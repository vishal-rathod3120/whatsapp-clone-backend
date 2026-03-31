// @ts-nocheck
import * as crypto from './crypto';

export interface SenderKeyState {
  chainKey: Uint8Array;
  signatureKeyPair?: crypto.SignKeyPair; // Required if we are the sender
  signaturePublicKey: Uint8Array;        // Public key of the sender
  iteration: number;
}

export interface SenderKeyDistributionMessage {
  chainKey: string;           // base64
  signaturePublicKey: string; // base64
  iteration: number;
}

/**
 * Creates a brand new Sender Key state for a group.
 */
export async function initializeSenderKey(): Promise<SenderKeyState> {
  const chainKey = crypto.generateSeed();
  const signatureKeyPair = await crypto.generateSigningKeyPair();
  
  return {
    chainKey,
    signatureKeyPair,
    signaturePublicKey: signatureKeyPair.publicKey,
    iteration: 0
  };
}

/**
 * Derives a message key and advances the chain key. (Symmetric ratchet)
 */
export async function ratchetSenderKey(state: SenderKeyState): Promise<{ messageKey: Uint8Array, newState: SenderKeyState }> {
  // According to Signal Sender Key spec:
  // MessageKey = HMAC-SHA256(ChainKey, 0x01)
  // ChainKey = HMAC-SHA256(ChainKey, 0x02)
  
  const hmacInputMsg = new Uint8Array([0x01]);
  const hmacInputChain = new Uint8Array([0x02]);
  
  // Using WebCrypto HMAC-SHA256 for symmetric ratchet derivation
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw', 
    state.chainKey, 
    { name: 'HMAC', hash: 'SHA-256' }, 
    false, 
    ['sign']
  );
  
  const messageKeyBuffer = await window.crypto.subtle.sign('HMAC', keyMaterial, hmacInputMsg);
  const newChainKeyBuffer = await window.crypto.subtle.sign('HMAC', keyMaterial, hmacInputChain);
  
  const messageKey = new Uint8Array(messageKeyBuffer).slice(0, 32);
  const newChainKey = new Uint8Array(newChainKeyBuffer).slice(0, 32);
  
  return {
    messageKey,
    newState: {
      ...state,
      chainKey: newChainKey,
      iteration: state.iteration + 1
    }
  };
}

/**
 * Serializes the sender key for distribution to another member via pairwise Double Ratchet.
 */
export function encodeSenderKeyDistribution(state: SenderKeyState): SenderKeyDistributionMessage {
  return {
    chainKey: crypto.encodeBase64(state.chainKey),
    signaturePublicKey: crypto.encodeBase64(state.signaturePublicKey),
    iteration: state.iteration
  };
}

/**
 * Deserializes an incoming sender key array distributed by someone else.
 */
export function decodeSenderKeyDistribution(msg: SenderKeyDistributionMessage): SenderKeyState {
  return {
    chainKey: crypto.decodeBase64(msg.chainKey),
    signaturePublicKey: crypto.decodeBase64(msg.signaturePublicKey),
    iteration: msg.iteration,
  };
}
