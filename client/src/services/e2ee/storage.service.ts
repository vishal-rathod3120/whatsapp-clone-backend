// @ts-nocheck
import { openDB, type IDBPDatabase } from 'idb';
import naclUtil from 'tweetnacl-util';

export interface IdentityData {
  device: string; // The primary key 'device'
  deviceId?: string; // Backend deviceId used for E2EE addressing (sdId)
  registrationId: number;
  // We keep a single 32-byte seed. From it we derive both Ed25519 and X25519 keys.
  seed: Uint8Array;
}

export interface SessionState {
  id: string; // `${deviceId}:${remoteUserId}:${remoteDeviceId}`
  DHs: { privateKey: string; publicKey: string }; // base64
  DHr: string | null; // base64
  RK: string;         // base64
  CKs: string;        // base64
  CKr: string | null; // base64
  Ns: number;
  Nr: number;
  PN: number;
}

export interface SkippedKey {
  id: string; // `${base64(DHr)}:${msgNum}`
  messageKey: string; // base64
}

export interface SenderKeyRecord {
  id: string; // "groupId:senderId"
  chainKey: string;           // base64
  signaturePublicKey: string; // base64
  signatureKeyPair?: {
    publicKey: string;
    privateKey: string;
  };
  iteration: number;
}

interface SignalDB extends IDBPDatabase {
  // Add types if we want strongly typed IDB
}

class StorageService {
  private dbPromise: Promise<any>;

  constructor() {
    this.dbPromise = openDB('signal-store', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('identity', { keyPath: 'device' });
          db.createObjectStore('sessions', { keyPath: 'id' });
          db.createObjectStore('skipped_keys', { keyPath: 'id' });
          db.createObjectStore('prekeys', { keyPath: 'keyId' });
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('senderKeys')) {
            db.createObjectStore('senderKeys', { keyPath: 'id' });
          }
        }
      },
    });
  }

  // --- Identity ---
  async getIdentity(): Promise<IdentityData | undefined> {
    const db = await this.dbPromise;
    return db.get('identity', 'device');
  }

  async saveIdentity(identity: IdentityData): Promise<void> {
    const db = await this.dbPromise;
    await db.put('identity', identity);
  }

  // --- One-Time Prekeys (Client-side private keys) ---
  // We only store the seed of each prekey to save space, but full privateKey is fine.
  async savePreKey(keyId: number, privateKey: Uint8Array): Promise<void> {
    const db = await this.dbPromise;
    await db.put('prekeys', { keyId, privateKey: naclUtil.encodeBase64(privateKey) });
  }

  async getPreKey(keyId: number): Promise<Uint8Array | undefined> {
    const db = await this.dbPromise;
    const item = await db.get('prekeys', keyId);
    if (item) return naclUtil.decodeBase64(item.privateKey);
    return undefined;
  }

  // --- Sessions ---
  async getSession(sessionId: string): Promise<SessionState | undefined> {
    const db = await this.dbPromise;
    return db.get('sessions', sessionId);
  }

  async saveSession(session: SessionState): Promise<void> {
    const db = await this.dbPromise;
    await db.put('sessions', session);
  }

  // --- Skipped Keys ---
  async saveSkippedKey(dhrBase64: string, msgNo: number, mk: Uint8Array): Promise<void> {
    const db = await this.dbPromise;
    await db.put('skipped_keys', {
      id: `${dhrBase64}:${msgNo}`,
      messageKey: naclUtil.encodeBase64(mk),
    });
  }

  async getSkippedKey(dhrBase64: string, msgNo: number): Promise<Uint8Array | undefined> {
    const db = await this.dbPromise;
    const item = await db.get('skipped_keys', `${dhrBase64}:${msgNo}`);
    if (item) {
      await db.delete('skipped_keys', item.id); // Consume it
      return naclUtil.decodeBase64(item.messageKey);
    }
    return undefined;
  }

  // --- Sender Keys ---
  async getSenderKey(groupId: string, senderId: string): Promise<SenderKeyRecord | undefined> {
    const db = await this.dbPromise;
    return await db.get('senderKeys', `${groupId}:${senderId}`);
  }

  async saveSenderKey(record: SenderKeyRecord): Promise<void> {
    const db = await this.dbPromise;
    await db.put('senderKeys', record);
  }
}

export const signalStore = new StorageService();
