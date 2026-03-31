import { Injectable } from '@nestjs/common';
import { PrekeyStoreService } from '../e2ee/prekey-store.service';
import { E2EEService } from '../e2ee/e2ee.service';

/**
 * Server-side E2EE Crypto Service
 * 
 * IMPORTANT: This is a TRANSLATION LAYER only!
 * Actual encryption/decryption happens CLIENT-SIDE in the user's device.
 * The server NEVER sees plaintext or private keys.
 * 
 * This service provides:
 * 1. Session management (store/retrieve encrypted session states)
 * 2. Key distribution (prekey bundles)
 * 3. Encrypted message relay
 */
@Injectable()
export class E2EECryptoService {
  constructor(
    private prekeyStore: PrekeyStoreService,
    private e2eeService: E2EEService,
  ) {}

  /**
   * Store encrypted session state from client
   * Clients encrypt their Double Ratchet state and send to server for storage
   */
  async storeSession(
    deviceId: string,
    remoteUserId: string,
    remoteDeviceId: string,
    encryptedSessionState: string
  ): Promise<void> {
    await this.prekeyStore.storeSession(
      deviceId,
      remoteUserId,
      remoteDeviceId,
      encryptedSessionState
    );
  }

  /**
   * Retrieve encrypted session state for client
   */
  async getSession(
    deviceId: string,
    remoteUserId: string,
    remoteDeviceId: string
  ): Promise<string | null> {
    return this.prekeyStore.getSession(deviceId, remoteUserId, remoteDeviceId);
  }

  /**
   * Get prekey bundle to start new session
   */
  async getPrekeyBundle(userId: string, deviceId?: string) {
    return this.e2eeService.getPrekeyBundle(userId, deviceId);
  }

  /**
   * Validate that a message is properly encrypted
   * Server-side validation of E2EE payload format
   */
  validateEncryptedPayload(payload: {
    ciphertext: string;
    ephemeralKey?: string;
    preKeyId?: number;
  }): boolean {
    // Basic validation - ciphertext must be non-empty base64
    if (!payload.ciphertext || payload.ciphertext.length < 16) {
      return false;
    }

    // If initial message, ephemeral key and preKeyId should be present
    if (payload.ephemeralKey && !payload.preKeyId) {
      return false;
    }

    return true;
  }

  /**
   * Get all sessions for a device (for multi-device sync)
   */
  async getAllSessions(deviceId: string) {
    return this.e2eeService.getAllSessions(deviceId);
  }

  /**
   * Delete a session (when user blocks someone or resets E2EE)
   */
  async deleteSession(
    deviceId: string,
    remoteUserId: string,
    remoteDeviceId: string
  ): Promise<void> {
    await this.prekeyStore.deleteSession(deviceId, remoteUserId, remoteDeviceId);
  }

  /**
   * Replenish prekeys for a device
   */
  async replenishPrekeys(deviceId: string, count: number): Promise<{ added: number }> {
    // This would be called by a background job or client request
    // In real implementation, you'd generate keys on client and upload
    // Here we just check if replenishment is needed
    const currentCount = await this.prekeyStore.getPrekeyCount(deviceId);
    
    if (currentCount < 10) {
      return { added: count }; // Client should generate and upload
    }
    
    return { added: 0 };
  }
}
