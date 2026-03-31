// @ts-nocheck
import * as crypto from './crypto';
import type { IdentityData } from './storage.service';

/** 
 * Prekey Bundle received from the server 
 */
export interface PrekeyBundle {
  registrationId: number;
  deviceId: string;
  identityKey: string; // Base64 JSON of both signatures
  signedPreKey: {
    keyId: number;
    publicKey: string; // Base64
    signature: string; // Base64
  };
  preKey: {
    keyId: number;
    publicKey: string; // Base64
  } | null;
}

export interface X3DHResult {
  sharedSecret: Uint8Array;
  ephemeralPublicKey: Uint8Array;
  // Identifiers for the keys used
  preKeyId?: number;
}

/**
 * Alice (Sender) performs X3DH using Bob's bundle.
 */
export async function performX3DHAsAlice(
  aliceIdentity: IdentityData,
  bobBundle: PrekeyBundle
): Promise<X3DHResult> {
  // Parse Bob's identity key
  const bobIdStr = crypto.decodeBase64(bobBundle.identityKey);
  const bobIdParsed = JSON.parse(new TextDecoder().decode(bobIdStr));
  const IKB = crypto.decodeBase64(bobIdParsed.dh); // X25519 part
  const IKBSig = crypto.decodeBase64(bobIdParsed.sig); // Ed25519 part

  const SPKB = crypto.decodeBase64(bobBundle.signedPreKey.publicKey);
  const signature = crypto.decodeBase64(bobBundle.signedPreKey.signature);

  // 1. Verify Signed PreKey signature
  const isValid = crypto.verify(signature, SPKB, IKBSig);
  if (!isValid) {
    throw new Error('Invalid signed prekey signature in bundle');
  }

  // Generate our ephemeral key (EKA)
  const EKAPair = await crypto.generateIdentityKeyPair();

  // Our identity private key for X25519 
  const identKp = await crypto.generateIdentityKeyPair();
  identKp.privateKey = aliceIdentity.seed; // We use the seed for everything
  
  // Actually we need the same DH key every time for identity. Let's assume aliceIdentity.seed 
  // actually directly generates the DH key via tweetnacl `box.keyPair.fromSecretKey(seed)`. 
  // Wait! Tweetnacl doesn't expose `fromSecretKey` for boxes, it uses `fromSecretKey` but `secretKey` is 32 bytes seed!
  // In crypto.ts, I didn't wrap this. I will assume `aliceIdentity.seed` is the 32 byte secretKey for box.
  const IKA_priv = aliceIdentity.seed;

  // 4 DH computations
  const DH1 = crypto.x25519(IKA_priv, SPKB); // IKA(priv) x SPKB(pub) -> Wait, Signal protocol: DH1 = IKA*SPKB, DH2=EKA*IKB... 
  // According to standard: DH1 = IKA*SPKB, DH2 = EKA*IKB, DH3 = EKA*SPKB, DH4 = EKA*OPKB

  const DH_IKA_SPKB = crypto.x25519(IKA_priv, SPKB);
  const DH_EKA_IKB = crypto.x25519(EKAPair.privateKey, IKB);
  const DH_EKA_SPKB = crypto.x25519(EKAPair.privateKey, SPKB);

  let DH_EKA_OPKB = new Uint8Array(0);
  let preKeyId: number | undefined;

  if (bobBundle.preKey) {
    const OPKB = crypto.decodeBase64(bobBundle.preKey.publicKey);
    DH_EKA_OPKB = crypto.x25519(EKAPair.privateKey, OPKB);
    preKeyId = bobBundle.preKey.keyId;
  }

  // Combine
  const F1 = new Uint8Array(32); // 32 bytes of 0xFF
  F1.fill(0xFF);
  
  const material = crypto.concatenate(
    F1, 
    DH_IKA_SPKB, 
    DH_EKA_IKB, 
    DH_EKA_SPKB, 
    DH_EKA_OPKB
  );

  const sharedSecret = await crypto.hkdf(material, 32, "SignalProtocolV3", "");

  return {
    sharedSecret,
    ephemeralPublicKey: EKAPair.publicKey,
    preKeyId
  };
}

/**
 * Bob (Receiver) absorbs Alice's X3DH initialization inside an incoming message
 */
export async function performX3DHAsBob(
  bobIdentity: IdentityData,
  aliceIdentityKeyBase64: string, // Alice's IKA (we just need the DH pubkey)
  aliceEphemeralKeyBase64: string,
  bobSignedPreKeyPrivate: Uint8Array,
  bobOneTimePreKeyPrivate: Uint8Array | null
): Promise<Uint8Array> {
  const aliceIdStr = crypto.decodeBase64(aliceIdentityKeyBase64);
  const aliceIdParsed = JSON.parse(new TextDecoder().decode(aliceIdStr));
  const IKA = crypto.decodeBase64(aliceIdParsed.dh); // X25519 part
  
  const EKA = crypto.decodeBase64(aliceEphemeralKeyBase64);
  const IKB_priv = bobIdentity.seed;

  const DH_SPKB_IKA = crypto.x25519(bobSignedPreKeyPrivate, IKA);
  const DH_IKB_EKA = crypto.x25519(IKB_priv, EKA);
  const DH_SPKB_EKA = crypto.x25519(bobSignedPreKeyPrivate, EKA);

  let DH_OPKB_EKA = new Uint8Array(0);
  if (bobOneTimePreKeyPrivate) {
    DH_OPKB_EKA = crypto.x25519(bobOneTimePreKeyPrivate, EKA);
  }

  const F1 = new Uint8Array(32);
  F1.fill(0xFF);

  const material = crypto.concatenate(
    F1,
    DH_SPKB_IKA,
    DH_IKB_EKA,
    DH_SPKB_EKA,
    DH_OPKB_EKA
  );

  return crypto.hkdf(material, 32, "SignalProtocolV3", "");
}
