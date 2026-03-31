import * as crypto from './crypto';

// Defines the data structure that lives in our storage service for each session.
export interface RatchetState {
  DHs: crypto.KeyPair;    // Our current DH pair for sending
  DHr: Uint8Array | null; // The remote participant's DH public key
  RK: Uint8Array;         // Root Key
  CKs: Uint8Array;        // Chain Key Sending
  CKr: Uint8Array | null; // Chain Key Receiving
  Ns: number;             // Message sequence num for sending
  Nr: number;             // Message sequence num for receiving
  PN: number;             // Previous chain length
  MKSKIPPED: Map<string, Uint8Array>; // For out-of-order delivery
}

export function createNewRatchetState(sharedSecret: Uint8Array, theirDHPublicKey: Uint8Array, dhPair: crypto.KeyPair): RatchetState {
  return {
    DHs: dhPair,
    DHr: theirDHPublicKey,
    RK: sharedSecret,
    CKs: new Uint8Array(32), // Will be updated
    CKr: null,
    Ns: 0,
    Nr: 0,
    PN: 0,
    MKSKIPPED: new Map(),
  };
}

export async function initRatchetAlice(sharedSecret: Uint8Array, theirDHPublicKey: Uint8Array, dhPair: crypto.KeyPair): Promise<RatchetState> {
  const state = createNewRatchetState(sharedSecret, theirDHPublicKey, dhPair);
  await dhRatchet(state, theirDHPublicKey);
  return state;
}

export function initRatchetBob(sharedSecret: Uint8Array, dhPair: crypto.KeyPair): RatchetState {
  const state = createNewRatchetState(sharedSecret, new Uint8Array(0), dhPair);
  state.RK = sharedSecret;
  state.DHr = null;
  return state;
}

/**
 * Perform symmetric key ratchet step
 * Generates Message Key (first 32 bytes) and next Chain Key (next 32 bytes).
 */
export async function symmetricRatchet(chainKey: Uint8Array): Promise<{ mk: Uint8Array; ck: Uint8Array }> {
  // Using HKDF on the chain key to expand it. We pass a null salt and no info per Signal docs.
  const out = await crypto.hkdf(chainKey, 64, new Uint8Array(32), new Uint8Array(0));
  return {
    mk: out.slice(0, 32),
    ck: out.slice(32, 64),
  };
}

/**
 * Perform Diffie-Hellman ratchet step
 */
export async function dhRatchet(state: RatchetState, theirNewDHPublic: Uint8Array): Promise<void> {
  state.PN = state.Ns;
  state.Ns = 0;
  state.Nr = 0;
  state.DHr = theirNewDHPublic;

  // 1. DHR step: Use their new public key with our CURRENT private key
  const dh1 = crypto.x25519(state.DHs.privateKey, state.DHr);
  
  // 2. Derive new RK and CKr
  let rootOut = await crypto.hkdf(crypto.concatenate(state.RK, dh1), 64, new Uint8Array(32), "SignalProtocolV3");
  state.RK = rootOut.slice(0, 32);
  state.CKr = rootOut.slice(32, 64);

  // 3. Generate our NEW key pair
  state.DHs = await crypto.generateIdentityKeyPair();

  // 4. DHS step: Use their new public key with our NEW private key
  const dh2 = crypto.x25519(state.DHs.privateKey, state.DHr);

  // 5. Derive new RK and CKs
  rootOut = await crypto.hkdf(crypto.concatenate(state.RK, dh2), 64, new Uint8Array(32), "SignalProtocolV3");
  state.RK = rootOut.slice(0, 32);
  state.CKs = rootOut.slice(32, 64);
}
