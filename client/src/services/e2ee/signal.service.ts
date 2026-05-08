// @ts-nocheck
import * as crypto from './crypto';
import { signalStore, type IdentityData, type SessionState } from './storage.service';
import { performX3DHAsAlice, performX3DHAsBob, type PrekeyBundle } from './x3dh';
import { dhRatchet, symmetricRatchet, initRatchetAlice, initRatchetBob, type RatchetState } from './ratchet';
import * as senderKeyService from './sender-key';
import { api } from '../api';

export interface EncryptedMessage {
  header: {
    sdId: string;
    dh: string; // Base64
    pn: number;
    n: number;
  };
  ciphertext: string; // Base64
  ephemeralKey?: string; // Only for initial message
  preKeyId?: number; // Only for initial message
}

export interface GroupEncryptedMessage {
  header: {
    groupId: string;
    senderId: string;
    signaturePublicKey: string;
    iteration: number;
    iv?: string; // Will store the base64 IV separately for easier extraction
  };
  ciphertext: string; // Base64 of (Signature + Ciphertext)
}

export class SignalService {
  private static instance = new SignalService();
  public static getInstance() { return this.instance; }
  private userId?: string;

  /**
   * Run on login. Ensures device has Identity and prekeys published.
   */
  async initializeAccount(userId: string, deviceId: string): Promise<void> {
    this.userId = userId;
    const existing = await signalStore.getIdentity();
    let identity: IdentityData;

    if (!existing) {
      const seed = crypto.generateSeed();
      identity = {
        device: 'device', // We just use literal 'device' as primary key for our own identity
        deviceId,
        registrationId: Math.floor(Math.random() * 16383) + 1,
        seed,
      };
      await signalStore.saveIdentity(identity);
      
      await this.uploadKeys(deviceId, identity);
    } else {
      identity = existing;
      // Backfill deviceId for older identities
      if (!identity.deviceId) {
        identity.deviceId = deviceId;
        await signalStore.saveIdentity(identity);
      }
      // Optionally check with server if we need to replenish prekeys
      try {
        const response = await api.get(`/e2ee/devices/${deviceId}/prekey-count`);
        if (response.data.needsReplenish) {
          await this.replenishPrekeys(deviceId, identity);
        }
      } catch (e) {
        console.error('Failed to initialize account on SignalService:', e);
      }
    }
  }

  // ==== GROUP CHAT ENCRYPTION (SENDER KEYS) ====

  async encryptGroupMessage(
    groupId: string, 
    groupMembersIds: string[], 
    plaintext: string,
    forceDistribution: boolean = false
  ): Promise<{ ciphertext: GroupEncryptedMessage, distributionRecords: Record<string, EncryptedMessage> }> {
    if (!this.userId) throw new Error('SignalService: Not initialized');
    
    let senderKeyRecord = await signalStore.getSenderKey(groupId, this.userId);
    let isNewKey = false;
    let senderKeyState: senderKeyService.SenderKeyState;
    
    if (!senderKeyRecord) {
      senderKeyState = await senderKeyService.initializeSenderKey();
      isNewKey = true;
    } else {
      senderKeyState = {
        chainKey: crypto.decodeBase64(senderKeyRecord.chainKey),
        signaturePublicKey: crypto.decodeBase64(senderKeyRecord.signaturePublicKey),
        signatureKeyPair: senderKeyRecord.signatureKeyPair ? {
          publicKey: crypto.decodeBase64(senderKeyRecord.signatureKeyPair.publicKey),
          privateKey: crypto.decodeBase64(senderKeyRecord.signatureKeyPair.privateKey)
        } : undefined,
        iteration: senderKeyRecord.iteration
      };
    }

    const { messageKey, newState } = await senderKeyService.ratchetSenderKey(senderKeyState);

    // Save the ratcheted state
    await signalStore.saveSenderKey({
      id: `${groupId}:${this.userId}`,
      chainKey: crypto.encodeBase64(newState.chainKey),
      signaturePublicKey: crypto.encodeBase64(newState.signaturePublicKey),
      signatureKeyPair: newState.signatureKeyPair ? {
        publicKey: crypto.encodeBase64(newState.signatureKeyPair.publicKey),
        privateKey: crypto.encodeBase64(newState.signatureKeyPair.privateKey)
      } : undefined,
      iteration: newState.iteration
    });

    const headerParams = {
      groupId,
      senderId: this.userId,
      signaturePublicKey: crypto.encodeBase64(newState.signaturePublicKey),
      iteration: senderKeyState.iteration 
    };
    
    const ad = new TextEncoder().encode(JSON.stringify(headerParams));
    const ctInfo = await crypto.aesGcmEncrypt(messageKey, new TextEncoder().encode(plaintext), ad);
    
    const combinedCt = new Uint8Array(ctInfo.iv.length + ctInfo.ciphertext.length);
    combinedCt.set(ctInfo.iv, 0);
    combinedCt.set(ctInfo.ciphertext, ctInfo.iv.length);

    const signature = crypto.sign(combinedCt, newState.signatureKeyPair!.privateKey);
    
    const finalBuffer = new Uint8Array(64 + combinedCt.length);
    finalBuffer.set(signature, 0);
    finalBuffer.set(combinedCt, 64);

    const distributionRecords: Record<string, EncryptedMessage> = {};

    if (isNewKey || forceDistribution) {
      const distributionPayload = senderKeyService.encodeSenderKeyDistribution(senderKeyState);
      const payloadString = JSON.stringify({ 
        type: 'SENDER_KEY_DISTRIBUTION', 
        groupId, 
        payload: distributionPayload 
      });

      for (const memberId of groupMembersIds) {
        if (memberId === this.userId) continue;
        try {
          const encryptedPairwise = await this.encryptMessageToAllDevices(memberId, payloadString);
          distributionRecords[memberId] = encryptedPairwise;
        } catch (e) {
          console.warn(`Could not distribute sender key to ${memberId}:`, e);
        }
      }
    }
    
    return {
      ciphertext: {
        header: {
          ...headerParams,
          iv: crypto.encodeBase64(ctInfo.iv)
        },
        ciphertext: crypto.encodeBase64(finalBuffer)
      },
      distributionRecords
    };
  }

  async processSenderKeyDistribution(senderId: string, groupId: string, payload: any) {
    const rawState = senderKeyService.decodeSenderKeyDistribution(payload);
    await signalStore.saveSenderKey({
      id: `${groupId}:${senderId}`,
      chainKey: crypto.encodeBase64(rawState.chainKey),
      signaturePublicKey: crypto.encodeBase64(rawState.signaturePublicKey),
      iteration: rawState.iteration
    });
  }

  async decryptGroupMessage(senderId: string, groupId: string, encryptedMsg: GroupEncryptedMessage): Promise<string> {
    const senderKeyRecord = await signalStore.getSenderKey(groupId, senderId);
    if (!senderKeyRecord) {
      throw new Error(`Missing sender key for group ${groupId} from user ${senderId}. They may need to send a distribution record first.`);
    }

    const finalBuffer = crypto.decodeBase64(encryptedMsg.ciphertext);
    const signature = finalBuffer.slice(0, 64);
    const combinedCt = finalBuffer.slice(64);
    
    const signaturePublicKey = crypto.decodeBase64(senderKeyRecord.signaturePublicKey);
    if (!crypto.verify(signature, combinedCt, signaturePublicKey)) {
      throw new Error('Invalid Group Message Signature (tampering detected)');
    }

    let currentState: senderKeyService.SenderKeyState = {
      chainKey: crypto.decodeBase64(senderKeyRecord.chainKey),
      signaturePublicKey,
      iteration: senderKeyRecord.iteration
    };

    const targetIteration = encryptedMsg.header.iteration;
    if (targetIteration < currentState.iteration) {
      throw new Error('Historical group message out of order - dropped');
    }

    let messageKey: Uint8Array | null = null;
    while (currentState.iteration <= targetIteration) {
      const { messageKey: mk, newState } = await senderKeyService.ratchetSenderKey(currentState);
      if (currentState.iteration === targetIteration) {
        messageKey = mk;
      }
      currentState = newState;
    }

    if (!messageKey) throw new Error('Failed to derive group message key');

    await signalStore.saveSenderKey({
      id: `${groupId}:${senderId}`,
      chainKey: crypto.encodeBase64(currentState.chainKey),
      signaturePublicKey: crypto.encodeBase64(currentState.signaturePublicKey),
      iteration: currentState.iteration
    });

    const iv = crypto.decodeBase64(encryptedMsg.header.iv!);
    const actualCiphertext = combinedCt.slice(iv.length);
    
    // Header for AD doesn't include the nested IV we added
    const adHeader = {
      groupId: encryptedMsg.header.groupId,
      senderId: encryptedMsg.header.senderId,
      signaturePublicKey: encryptedMsg.header.signaturePublicKey,
      iteration: encryptedMsg.header.iteration
    };
    
    const ad = new TextEncoder().encode(JSON.stringify(adHeader));
    const plaintextBuffer = await crypto.aesGcmDecrypt(messageKey, iv, actualCiphertext, ad);
    return new TextDecoder().decode(plaintextBuffer);
  }

  private async uploadKeys(deviceId: string, identity: IdentityData): Promise<void> {
    const signKp = crypto.getSignKeyPairFromSeed(identity.seed);
    const boxKp = crypto.getBoxKeyPairFromSeed(identity.seed);
    
    // We send public keys as JSON
    const identityKeyPayload = crypto.encodeBase64(
      new TextEncoder().encode(JSON.stringify({ 
        dh: crypto.encodeBase64(boxKp.publicKey), 
        sig: crypto.encodeBase64(signKp.publicKey) 
      }))
    );

    // Generate Signed Prekey
    const spkKp = await crypto.generateIdentityKeyPair(); // Just a random x25519 pair
    const spkSig = crypto.sign(spkKp.publicKey, signKp.privateKey);
    // Wait, in real Signal it is generated periodically and rotated. 
    // We will store it in IDB as prekey with id = 0 
    await signalStore.savePreKey(0, spkKp.privateKey);

    const signedPreKey = {
      keyId: 0,
      publicKey: crypto.encodeBase64(spkKp.publicKey),
      signature: crypto.encodeBase64(spkSig),
    };

    // Generate 100 One-Time Prekeys
    const oneTimePreKeys = [];
    for (let i = 1; i <= 100; i++) {
      const pkPair = await crypto.generateIdentityKeyPair();
      await signalStore.savePreKey(i, pkPair.privateKey);
      oneTimePreKeys.push({
        keyId: i,
        publicKey: crypto.encodeBase64(pkPair.publicKey),
      });
    }

    await api.post(`/e2ee/devices/${deviceId}/prekeys`, {
      identityKey: identityKeyPayload,
      registrationId: identity.registrationId,
      signedPreKey,
      oneTimePreKeys,
    });
  }

  private async replenishPrekeys(deviceId: string, identity: IdentityData) {
    const oneTimePreKeys = [];
    // Start IDs from 101 to avoid collisions with old ones for now
    const offset = Math.floor(Date.now() / 1000) % 10000; 
    for (let i = offset; i < offset + 10; i++) {
        const pkPair = await crypto.generateIdentityKeyPair();
        await signalStore.savePreKey(i, pkPair.privateKey);
        oneTimePreKeys.push({
          keyId: i,
          publicKey: crypto.encodeBase64(pkPair.publicKey),
        });
    }
    await api.post(`/e2ee/devices/${deviceId}/prekeys/replenish`, { oneTimePreKeys });
  }

  /**
   * Retrieves or builds a session via X3DH, then encrypts message using Double Ratchet
   */
  async encryptMessage(
    remoteUserId: string,
    plaintextStr: string,
    targetDeviceId?: string,
  ): Promise<EncryptedMessage> {
    const identity = await signalStore.getIdentity();
    if (!identity) throw new Error('E2EE not initialized locally');

    // Fetch prekey bundles for user to determine the device to encrypt for
    let bundle: PrekeyBundle | undefined;
    let remoteDeviceId = '';

    const resp = await api.get(`/e2ee/users/${remoteUserId}/prekey-bundle`, {
      params: targetDeviceId ? { deviceId: targetDeviceId } : undefined,
    });
    const bundles: PrekeyBundle | PrekeyBundle[] = resp.data;
    
    // API might return an array or a single object if requested specifically
    if (Array.isArray(bundles)) {
       bundle = bundles[0];
       if (!bundle) throw new Error('No E2EE devices found for user');
    } else {
       bundle = bundles;
    }
    remoteDeviceId = bundle.deviceId;

    const sessionId = `${identity.device}:${remoteUserId}:${remoteDeviceId}`;
    let session = await signalStore.getSession(sessionId);

    let isInitial = false;
    let preKeyIdUsed: number | undefined;
    let ephemeralKeyUsed: string | undefined;
    
    // Parse ratchet state
    let state: RatchetState;

    if (!session) {
      // Need X3DH!
      isInitial = true;
      const x3dh = await performX3DHAsAlice(identity, bundle);
      
      const parsedBobId = JSON.parse(new TextDecoder().decode(crypto.decodeBase64(bundle.identityKey)));
      const IKB = crypto.decodeBase64(parsedBobId.dh);

      const aliceDhKeyPair = crypto.getBoxKeyPairFromSeed(identity.seed); // Our base DHT sending key? 
      // Actually signal double ratchet uses a fresh DH pair for sending!
      const ratchetDhPair = await crypto.generateIdentityKeyPair();

      state = await initRatchetAlice(x3dh.sharedSecret, IKB, ratchetDhPair);

      // We MUST send our EKA (ephemeral key) with the first message so Bob computes X3DH!
      ephemeralKeyUsed = crypto.encodeBase64(x3dh.ephemeralPublicKey);
      preKeyIdUsed = x3dh.preKeyId;
    } else {
      state = this.deserializeSession(session);
    }

    // 1. Ratchet step
    const { mk, ck } = await symmetricRatchet(state.CKs);
    state.CKs = ck;
    const msgNum = state.Ns++;

    // 2. Encrypt
    const header = {
      sdId: identity.deviceId || identity.device,
      dh: crypto.encodeBase64(state.DHs.publicKey),
      pn: state.PN,
      n: msgNum,
    };

    const headerBytes = new TextEncoder().encode(JSON.stringify(header));
    const plaintext = new TextEncoder().encode(plaintextStr);

    const { ciphertext, iv } = await crypto.aesGcmEncrypt(mk, plaintext, headerBytes);
    
    // We append IV to ciphertext in transmission
    const combinedCt = crypto.concatenate(iv, ciphertext);

    // Save session
    await signalStore.saveSession(this.serializeSession(sessionId, state));

    return {
      header,
      ciphertext: crypto.encodeBase64(combinedCt),
      ephemeralKey: ephemeralKeyUsed,
      preKeyId: preKeyIdUsed,
    };
  }

  /**
   * MVP multi-device support: encrypt the same plaintext for ALL available devices
   * of the remote user (one ciphertext per device). Returns a map of deviceId -> EncryptedMessage.
   */
  async encryptMessageToAllDevices(
    remoteUserId: string,
    plaintextStr: string
  ): Promise<Record<string, EncryptedMessage>> {
    const resp = await api.get(`/e2ee/users/${remoteUserId}/prekey-bundle`);
    const bundles: PrekeyBundle[] = Array.isArray(resp.data) ? resp.data : [resp.data];

    const out: Record<string, EncryptedMessage> = {};
    for (const bundle of bundles) {
      // Encrypt per remote device (one message per device)
      const encrypted = await this.encryptMessage(remoteUserId, plaintextStr, bundle.deviceId);
      out[bundle.deviceId] = encrypted;
    }
    return out;
  }

  /**
   * Decrypts incoming message. Performs X3DH if it's the first message from sender.
   */
  async decryptMessage(
    senderUserId: string,
    encryptedMsg: EncryptedMessage
  ): Promise<string> {
    const identity = await signalStore.getIdentity();
    if (!identity) throw new Error('E2EE not initialized locally');

    const senderDeviceId = encryptedMsg.header.sdId || 'device';
    const sessionId = `${identity.device}:${senderUserId}:${senderDeviceId}`;
    let session = await signalStore.getSession(sessionId);
    let state: RatchetState;

    if (!session) {
      if (!encryptedMsg.ephemeralKey) {
        throw new Error('No session exists and no ephemeral key provided!');
      }
      
      // Fetch sender identity bundle to verify their ephemeral key (X3DH)
      const senderResp = await api.get(`/e2ee/users/${senderUserId}/prekey-bundle`);
      let senderBundle: PrekeyBundle;
      if (Array.isArray(senderResp.data)) {
         senderBundle = senderResp.data.find((b: any) => b.deviceId === senderDeviceId) || senderResp.data[0];
      } else {
         senderBundle = senderResp.data;
      }
      const senderIdentityKeyBase64 = senderBundle.identityKey;

      // Perform Bob X3DH
      const spkPriv = await signalStore.getPreKey(0); // SPKB
      if (!spkPriv) throw new Error('Missing our own signed prekey!');
      
      let opkPriv: Uint8Array | null = null;
      if (encryptedMsg.preKeyId !== undefined) {
         const k = await signalStore.getPreKey(encryptedMsg.preKeyId);
         if (k) opkPriv = k;
      }

      const sharedSecret = await performX3DHAsBob(
        identity, 
        senderIdentityKeyBase64, 
        encryptedMsg.ephemeralKey, 
        spkPriv, 
        opkPriv
      );
      
      const dhPair = await crypto.generateIdentityKeyPair();
      state = initRatchetBob(sharedSecret, dhPair);
    } else {
      state = this.deserializeSession(session);
    }

    const remoteDHPublic = crypto.decodeBase64(encryptedMsg.header.dh);
    
    // DH Ratchet Check
    if (!state.DHr || !crypto.constantTimeEqual(remoteDHPublic, state.DHr)) {
      // It's a new DH protocol turn!
      // But first, we should store skipped message keys for any gaps in the previous receiving chain!
      if (state.CKr) {
        while (state.Nr < encryptedMsg.header.pn) {
          const { mk, ck } = await symmetricRatchet(state.CKr);
          state.CKr = ck;
          const mapKey = `${crypto.encodeBase64(state.DHr)}:${state.Nr}`;
          await signalStore.saveSkippedKey(crypto.encodeBase64(state.DHr), state.Nr, mk);
          state.Nr++;
        }
      }

      await dhRatchet(state, remoteDHPublic);
    }

    // Is it a skipped message key we already have?
    const currentDhrB64 = crypto.encodeBase64(state.DHr!);
    const skippedMK = await signalStore.getSkippedKey(currentDhrB64, encryptedMsg.header.n);
    
    let mk: Uint8Array;
    if (skippedMK) {
      mk = skippedMK;
    } else {
      // Normal symmetric ratchet progression for skipped keys in current chain
      while (state.Nr < encryptedMsg.header.n) {
          const r = await symmetricRatchet(state.CKr!);
          state.CKr = r.ck;
          await signalStore.saveSkippedKey(currentDhrB64, state.Nr, r.mk);
          state.Nr++;
      }
      // Deriving current message key
      const { mk: msgKey, ck } = await symmetricRatchet(state.CKr!);
      state.CKr = ck;
      mk = msgKey;
      state.Nr++;
    }

    // Decrypt standard AES-GCM
    const combinedCt = crypto.decodeBase64(encryptedMsg.ciphertext);
    const iv = combinedCt.slice(0, 12);
    const ciphertext = combinedCt.slice(12);

    const headerBytes = new TextEncoder().encode(JSON.stringify(encryptedMsg.header));
    
    let decryptedBytes: Uint8Array;
    try {
      decryptedBytes = await crypto.aesGcmDecrypt(mk, iv, ciphertext, headerBytes);
    } catch (e) {
      throw new Error(`E2EE Decryption failed (bad key or manipulated packet)`);
    }

    await signalStore.saveSession(this.serializeSession(sessionId, state));
    return new TextDecoder().decode(decryptedBytes);
  }

  // --- Helpers ---
  private serializeSession(id: string, state: RatchetState): SessionState {
    return {
      id,
      DHs: {
        privateKey: crypto.encodeBase64(state.DHs.privateKey),
        publicKey: crypto.encodeBase64(state.DHs.publicKey),
      },
      DHr: state.DHr ? crypto.encodeBase64(state.DHr) : null,
      RK: crypto.encodeBase64(state.RK),
      CKs: crypto.encodeBase64(state.CKs),
      CKr: state.CKr ? crypto.encodeBase64(state.CKr) : null,
      Ns: state.Ns,
      Nr: state.Nr,
      PN: state.PN,
    };
  }

  private deserializeSession(sess: SessionState): RatchetState {
    return {
      DHs: {
        privateKey: crypto.decodeBase64(sess.DHs.privateKey),
        publicKey: crypto.decodeBase64(sess.DHs.publicKey),
      },
      DHr: sess.DHr ? crypto.decodeBase64(sess.DHr) : null,
      RK: crypto.decodeBase64(sess.RK),
      CKs: crypto.decodeBase64(sess.CKs),
      CKr: sess.CKr ? crypto.decodeBase64(sess.CKr) : null,
      Ns: sess.Ns,
      Nr: sess.Nr,
      PN: sess.PN,
      MKSKIPPED: new Map(), // Stored entirely in IndexedDB now instead of RAM
    };
  }
}

export const signalService = SignalService.getInstance();
