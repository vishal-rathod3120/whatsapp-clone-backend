// @ts-nocheck
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

// ----------------------------------------------------------------------------
// 1. Primitive Key Handlers (TweetNaCl / Curve25519)
// ----------------------------------------------------------------------------

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface SignedKeyPair extends KeyPair {
  keyId: number;
  signature: Uint8Array;
}

/** 
 * Gets the X25519 (box) Key Pair from a 32 byte seed.
 */
export function getBoxKeyPairFromSeed(seed: Uint8Array): KeyPair {
  const kp = nacl.box.keyPair.fromSecretKey(seed);
  return {
    publicKey: kp.publicKey,
    privateKey: kp.secretKey, 
  };
}

/** 
 * Gets the Ed25519 (sign) Key Pair from a 32 byte seed.
 */
export function getSignKeyPairFromSeed(seed: Uint8Array): KeyPair {
  const kp = nacl.sign.keyPair.fromSeed(seed);
  return {
    publicKey: kp.publicKey,
    privateKey: kp.secretKey, 
  };
}

/** Generate a random 32 byte seed */
export function generateSeed(): Uint8Array {
  return nacl.randomBytes(32);
}

/** Generate an X25519 Ephemeral Key Pair */
export async function generateIdentityKeyPair(): Promise<KeyPair> {
  const kp = nacl.box.keyPair();
  return {
    publicKey: kp.publicKey,
    privateKey: kp.secretKey, // note tweetnacl uses secretKey property
  };
}

/** Generate an Ed25519 Key Pair for signing. (We'll adapt it via box if needed) */
export async function generateSigningKeyPair(): Promise<KeyPair> {
  const kp = nacl.sign.keyPair();
  return {
    publicKey: kp.publicKey,
    privateKey: kp.secretKey,
  };
}

/** ECDH (Curve25519) */
export function x25519(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
  // tweetnacl scalar mult (DH)
  return nacl.scalarMult(privateKey, publicKey);
}

/** 
 * Signal needs to sign our prekey with our Identity key. 
 * Since tweetnacl distincts sign vs box, we convert the identity key (box) 
 * to sign key or vice versa. But commonly in Signal, Identity is an Ed25519 key used for both.
 * However, tweetnacl provides Ed25519 -> X25519 conversion.
 * Let's keep it simple: we use nacl.sign.keyPair for Identity, then convert it 
 * to box key when doing X25519 DH. 
 */
export function convertPrivateKeyToX25519(ed25519SecretKey: Uint8Array): Uint8Array {
  // Wait, standard Signal does this, tweetnacl has unofficial converters or we just use Box pair for both if we must.
  // Actually, we can just use two pairs or we can just use tweetnacl-util. 
  throw new Error('convertPrivateKeyToX25519 is not implemented. Do not call this in production. Use X25519 keys (nacl.box) directly or add a correct Ed25519->X25519 conversion.');
}

export function sign(message: Uint8Array, privateKey: Uint8Array): Uint8Array {
  return nacl.sign.detached(message, privateKey);
}

export function verify(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean {
  return nacl.sign.detached.verify(message, signature, publicKey);
}

// ----------------------------------------------------------------------------
// 2. WebCrypto Primitives (HKDF & AES-GCM)
// ----------------------------------------------------------------------------
export async function hkdf(
  ikm: Uint8Array,
  length: number,
  salt: Uint8Array | string = new Uint8Array(32),
  info: Uint8Array | string = ""
): Promise<Uint8Array> {
  const subtle = window.crypto.subtle;
  const hkdfKey = await subtle.importKey(
    'raw',
    ikm,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  const saltBuf = typeof salt === 'string' ? naclUtil.decodeUTF8(salt) : salt;
  const infoBuf = typeof info === 'string' ? naclUtil.decodeUTF8(info) : info;

  const derived = await subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: saltBuf,
      info: infoBuf,
    },
    hkdfKey,
    length * 8
  );

  return new Uint8Array(derived);
}

export async function aesGcmEncrypt(
  key: Uint8Array,
  plaintext: Uint8Array,
  ad?: Uint8Array
): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
  const subtle = window.crypto.subtle;
  const cryptoKey = await subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: ad,
    },
    cryptoKey,
    plaintext
  );
  return { ciphertext: new Uint8Array(encrypted), iv };
}

export async function aesGcmDecrypt(
  key: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array,
  ad?: Uint8Array
): Promise<Uint8Array> {
  const subtle = window.crypto.subtle;
  const cryptoKey = await subtle.importKey('raw', key, 'AES-GCM', false, ['decrypt']);
  const decrypted = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: ad,
    },
    cryptoKey,
    ciphertext
  );
  return new Uint8Array(decrypted);
}

export function encodeBase64(data: Uint8Array): string {
  return naclUtil.encodeBase64(data);
}

export function decodeBase64(data: string): Uint8Array {
  return naclUtil.decodeBase64(data);
}

export function concatenate(...arrays: Uint8Array[]): Uint8Array {
  let totalLen = 0;
  for (const arr of arrays) totalLen += arr.length;
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

// ----------------------------------------------------------------------------
// 3. Media Encryption Helpers
// ----------------------------------------------------------------------------

/**
 * Encrypt a File or Blob before uploading it to the backend.
 * Uses AES-GCM with a newly generated random 32-byte key.
 */
export async function encryptMediaFile(file: File | Blob): Promise<{ encryptedBlob: Blob; mediaKeyBase64: string; mediaIvBase64: string }> {
  // Generate random 32-byte key
  const keyBuffer = generateSeed();
  
  const arrayBuffer = await file.arrayBuffer();
  const plaintextBytes = new Uint8Array(arrayBuffer);
  
  // Encrypt the bytes
  const { ciphertext, iv } = await aesGcmEncrypt(keyBuffer, plaintextBytes);
  
  // Create an opaque binary blob from ciphertext
  const encryptedBlob = new Blob([ciphertext], { type: 'application/octet-stream' });
  
  return {
    encryptedBlob,
    mediaKeyBase64: encodeBase64(keyBuffer),
    mediaIvBase64: encodeBase64(iv),
  };
}

/**
 * Decrypts a downloaded encrypted media blob.
 * Returns the plaintext Blob matching the original mimetype.
 */
export async function decryptMediaFile(
  encryptedBlob: Blob,
  mediaKeyBase64: string,
  mediaIvBase64: string,
  mimeType: string
): Promise<Blob> {
  const keyBuffer = decodeBase64(mediaKeyBase64);
  const ivBuffer = decodeBase64(mediaIvBase64);
  
  const arrayBuffer = await encryptedBlob.arrayBuffer();
  const ciphertextBytes = new Uint8Array(arrayBuffer);
  
  const plaintextBytes = await aesGcmDecrypt(keyBuffer, ivBuffer, ciphertextBytes);
  
  return new Blob([plaintextBytes], { type: mimeType });
}
