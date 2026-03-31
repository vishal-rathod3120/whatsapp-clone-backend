# E2EE Implementation Guide - Signal Protocol

**Comprehensive guide for implementing End-to-End Encryption using Signal Protocol (X3DH + Double Ratchet)**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Key Concepts](#key-concepts)
3. [X3DH Key Agreement](#x3dh-key-agreement)
4. [Double Ratchet Algorithm](#double-ratchet-algorithm)
5. [Server Implementation](#server-implementation)
6. [Client Implementation](#client-implementation)
7. [Database Schema](#database-schema)
8. [Implementation Steps](#implementation-steps)
9. [Security Considerations](#security-considerations)

---

## Architecture Overview

### How E2EE Works in WhatsApp/Signal

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  Alice   │ ◄──── E2EE ──────► │  Server  │ ◄──── E2EE ──────► │   Bob    │
│  (Client)│    (Encrypted)     │ (Relay)  │    (Encrypted)     │  (Client)│
└──────────┘                    └──────────┘                    └──────────┘
     │                                │                               │
     │ 1. Generate keys               │                               │
     │ 2. Publish to server            │                               │
     │───────────────────────────────►│                               │
     │                                │                               │
     │                                │ 3. Store prekeys               │
     │                                │                               │
     │                                │◄──────────────────────────────│
     │                                │ 4. Bob publishes keys          │
     │                                │                               │
     │ 5. Request Bob's prekeys       │                               │
     │───────────────────────────────►│                               │
     │◄───────────────────────────────│ 6. Return prekeys            │
     │                                │                               │
     │ 7. X3DH: Establish session key │                               │
     │ 8. Double Ratchet encrypt        │                               │
     │───────────────────────────────►│                               │
     │                                │ 9. Store encrypted msg         │
     │                                │──────────────────────────────►│
     │                                │                               │
     │                                │                               │ 10. Decrypt
```

**Key Insight:** Server only sees encrypted blobs. It NEVER has access to plaintext messages or private keys.

---

## Key Concepts

### 1. Identity Key Pair (IK)
- **Long-term** key pair for each device
- Created once during registration
- Used to prove identity

### 2. Signed PreKey (SPK)
- **Medium-term** key pair
- Changed periodically (e.g., weekly)
- Signed by identity key

### 3. One-Time PreKeys (OPK)
- **Short-term** key pairs
- Each used only once
- Regenerated when depleted
- 100 prekeys stored on server

### 4. Session
- Established between two devices
- Contains Double Ratchet state
- Persisted in database

### 5. Chain Keys
- Used for symmetric encryption
- Rotated per message
- Provides forward secrecy

---

## X3DH Key Agreement

### Purpose
Establish initial shared secret between Alice and Bob (who may be offline).

### Keys Involved

```
┌─────────────────────────────────────────────────────────────────┐
│                    BOB'S KEYS (Published to Server)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Identity Key (IKB)     Signed PreKey (SPKB)   One-Time PreKey   │
│  ┌──────────────┐      ┌──────────────┐     ┌──────────────┐  │
│  │  long-term   │      │ medium-term  │     │ short-term   │  │
│  │  X25519      │──┐   │  X25519      │     │  X25519      │  │
│  │              │  │   │  signed by   │     │  (one use)   │  │
│  └──────────────┘  │   │  IKB         │     └──────────────┘  │
│                   │   └──────────────┘                       │
└───────────────────┼────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                 ALICE'S KEYS (Ephemeral)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Ephemeral Key (EKA)                                              │
│  ┌──────────────┐                                               │
│  │  temporary   │                                               │
│  │  X25519      │                                               │
│  │  (one use)   │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### X3DH Protocol Steps

#### Step 1: Alice Retrieves Bob's PreKeys
```typescript
// Alice requests Bob's prekey bundle from server
const bundle = await api.get(`/users/${bobId}/prekey-bundle`);

// Bundle contains:
{
  registrationId: 12345,
  deviceId: 1,
  identityKey: "base64(IKB)",
  signedPreKey: {
    keyId: 1,
    publicKey: "base64(SPKB)",
    signature: "base64(sig)"
  },
  preKey: {
    keyId: 99,
    publicKey: "base64(OPKB)"
  }
}
```

#### Step 2: Alice Generates Ephemeral Key
```typescript
const ephemeralKeyPair = await generateX25519KeyPair();
const EKA = ephemeralKeyPair.publicKey;
const ephemeralPrivate = ephemeralKeyPair.privateKey;
```

#### Step 3: Alice Performs 4 DH Calculations
```typescript
// Alice has her identity key (IKA) + ephemeral key (EKA)
// Alice has Bob's keys: IKB, SPKB, OPKB

// DH1: IKA (private) × IKB (public) = DH1
const DH1 = x25519(identityKeyPair.privateKey, bundle.identityKey);

// DH2: EKA (private) × IKB (public) = DH2  
const DH2 = x25519(ephemeralKeyPair.privateKey, bundle.identityKey);

// DH3: IKA (private) × SPKB (public) = DH3
const DH3 = x25519(identityKeyPair.privateKey, bundle.signedPreKey.publicKey);

// DH4: EKA (private) × OPKB (public) = DH4
const DH4 = x25519(ephemeralKeyPair.privateKey, bundle.preKey.publicKey);

// Combine all DH results
const sharedSecret = HKDF(
  concatenate(DH1, DH2, DH3, DH4),
  32,
  "SignalProtocolV3"
);
```

#### Step 4: Alice Sends Initial Message
```typescript
// Message contains:
{
  registrationId: aliceRegistrationId,
  identityKey: base64(IKA),
  ephemeralKey: base64(EKA),
  preKeyId: 99,  // Which one-time prekey was used
  signedPreKeyId: 1,
  // ... encrypted payload
}
```

#### Step 5: Bob Receives and Derives Same Secret
```typescript
// Bob has his keys: IKB, SPKB, OPKB (private keys)
// Bob receives: IKA, EKA

// DH1: IKB (private) × IKA (public) = DH1
const DH1 = x25519(identityPrivateKey, message.identityKey);

// DH2: IKB (private) × EKA (public) = DH2
const DH2 = x25519(identityPrivateKey, message.ephemeralKey);

// DH3: SPKB (private) × IKA (public) = DH3
const DH3 = x25519(signedPreKeyPrivate, message.identityKey);

// DH4: OPKB (private) × EKA (public) = DH4
const DH4 = x25519(oneTimePreKeyPrivate, message.ephemeralKey);

// Same shared secret!
const sharedSecret = HKDF(
  concatenate(DH1, DH2, DH3, DH4),
  32,
  "SignalProtocolV3"
);
```

**Result:** Alice and Bob now share a 32-byte secret key `SK`.

---

## Double Ratchet Algorithm

### Purpose
Continuously generate new encryption keys for each message, providing:
- **Forward Secrecy**: Past messages safe even if current key leaked
- **Break-in Recovery**: Future messages safe after key compromise
- **Out-of-Order Handling**: Decrypt messages received out of sequence

### Visual Overview

```
                    ┌───────────────────────────┐
                    │       ROOT CHAIN          │
                    │        (RK)               │
                    └───────────┬───────────────┘
                                │ DH Output (per message exchange)
                ┌───────────────┴───────────────┐
                │                               │
        ┌───────▼───────┐               ┌───────▼───────┐
        │  SENDING CHAIN │               │ RECEIVING CHAIN│
        │    (CKs)       │               │    (CKr)       │
        └───────┬───────┘               └───────┬───────┘
                │                               │
        ┌───────▼───────┐               ┌───────▼───────┐
        │  Message Key 1 │               │  Message Key 1 │
        │  Message Key 2 │               │  Message Key 2 │
        │  Message Key 3 │               │  Message Key 3 │
        └────────────────┘               └────────────────┘
        
        Alice sends msgs                  Bob sends msgs
        (encrypt)                         (decrypt)
```

### State Variables

```typescript
interface DoubleRatchetState {
  // DH Ratchet keys
  DHs: KeyPair;        // Our current DH key pair (sending)
  DHr: Uint8Array;     // Their DH public key (receiving)
  
  // Root and chain keys
  RK: Uint8Array;      // 32-byte Root Key
  CKs: Uint8Array;     // Sending chain key
  CKr: Uint8Array;     // Receiving chain key
  
  // Message counters
  Ns: number;          // Message number sent
  Nr: number;          // Message number received
  PN: number;          // Previous chain length
  
  // Skipped message keys (for out-of-order)
  MKSKIPPED: Map<string, Uint8Array>;
}
```

### Ratchet Steps

#### 1. Symmetric-Key Ratchet (Every Message)
```typescript
function ratchetStep(chainKey: Uint8Array): {
  messageKey: Uint8Array;
  newChainKey: Uint8Array;
} {
  // KDF_CK: Use HKDF to derive message key + new chain key
  const output = HKDF(chainKey, 64, "");
  return {
    messageKey: output.slice(0, 32),    // First 32 bytes = message key
    newChainKey: output.slice(32, 64)   // Next 32 bytes = new chain key
  };
}

// Example usage:
// CK0 → ratchet → MK1, CK1
// CK1 → ratchet → MK2, CK2
// CK2 → ratchet → MK3, CK3
```

#### 2. DH Ratchet (When Reply Received)
```typescript
function dhRatchetStep(
  state: DoubleRatchetState,
  theirNewDHPublic: Uint8Array
): void {
  // 1. Generate new DH key pair
  const newKeyPair = generateX25519KeyPair();
  
  // 2. Update receiving chain (their DH key changed)
  state.DHr = theirNewDHPublic;
  const dhOutput = x25519(state.DHs.privateKey, state.DHr);
  
  // 3. KDF_RK: Root key → new root key + receiving chain key
  const result = HKDF(concatenate(state.RK, dhOutput), 64, "");
  state.RK = result.slice(0, 32);
  state.CKr = result.slice(32, 64);
  
  // 4. Update sending chain with our new key
  state.DHs = newKeyPair;
  const dhOut2 = x25519(state.DHs.privateKey, state.DHr);
  
  const result2 = HKDF(concatenate(state.RK, dhOut2), 64, "");
  state.RK = result2.slice(0, 32);
  state.CKs = result2.slice(32, 64);
  
  // 5. Reset counters
  state.PN = state.Ns;
  state.Ns = 0;
  state.Nr = 0;
}
```

### Complete Encryption Flow

```typescript
function encryptMessage(
  state: DoubleRatchetState,
  plaintext: string,
  associatedData: Uint8Array
): EncryptedMessage {
  // 1. Symmetric ratchet step
  const { messageKey, newChainKey } = ratchetStep(state.CKs);
  state.CKs = newChainKey;
  state.Ns += 1;
  
  // 2. Encrypt with message key
  const header = {
    dh: state.DHs.publicKey,
    pn: state.PN,
    n: state.Ns - 1
  };
  
  const ciphertext = AESGCMEncrypt(
    messageKey,
    Buffer.from(plaintext),
    concatenate(associatedData, encodeHeader(header))
  );
  
  return {
    header,
    ciphertext: encodeBase64(ciphertext)
  };
}
```

### Complete Decryption Flow

```typescript
function decryptMessage(
  state: DoubleRatchetState,
  message: EncryptedMessage,
  associatedData: Uint8Array
): string {
  const { header, ciphertext } = message;
  
  // 1. Check if DH ratchet needed (their key changed)
  if (!constantTimeEqual(header.dh, state.DHr)) {
    dhRatchetStep(state, header.dh);
  }
  
  // 2. Check if this is a future message (gap in sequence)
  if (header.n > state.Nr) {
    // Store skipped message keys
    while (state.Nr < header.n) {
      const { messageKey, newChainKey } = ratchetStep(state.CKr);
      state.MKSKIPPED.set(
        `${encodeBase64(state.DHr)}:${state.Nr}`,
        messageKey
      );
      state.CKr = newChainKey;
      state.Nr += 1;
    }
  }
  
  // 3. Get message key for this message
  const { messageKey, newChainKey } = ratchetStep(state.CKr);
  state.CKr = newChainKey;
  state.Nr += 1;
  
  // 4. Decrypt
  const plaintext = AESGCMDecrypt(
    messageKey,
    decodeBase64(ciphertext),
    concatenate(associatedData, encodeHeader(header))
  );
  
  return Buffer.from(plaintext).toString();
}
```

---

## Server Implementation

### Server's Role in E2EE

**IMPORTANT:** Server acts as a "dumb pipe" - it NEVER sees plaintext or private keys.

```
┌──────────────────────────────────────────────────────────────────┐
│                        SERVER RESPONSIBILITIES                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. KEY DISTRIBUTION                                              │
│     - Store user's public prekeys                                 │
│     - Serve prekey bundles to requesting users                    │
│                                                                   │
│  2. MESSAGE RELAY                                                 │
│     - Store encrypted messages                                    │
│     - Deliver to recipients when online                         │
│     - Handle offline message queue                                │
│                                                                   │
│  3. DEVICE MANAGEMENT                                             │
│     - Track user's devices                                        │
│     - Handle multi-device sync                                    │
│                                                                   │
│  WHAT SERVER NEVER DOES:                                          │
│  ❌ Never has access to private keys                            │
│  ❌ Never decrypts messages                                       │
│  ❌ Never sees plaintext content                                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Server File Structure

```
src/modules/e2ee/
├── e2ee.module.ts
├── e2ee.controller.ts          # Expose prekey bundles
├── e2ee.service.ts             # Business logic
├── prekey-store.service.ts     # Manage prekeys in DB
├── device-keys.service.ts      # Device public key management
└── dto/
    ├── prekey-bundle.dto.ts
    ├── submit-prekeys.dto.ts
    └── encrypted-message.dto.ts
```

### Prekey Bundle Endpoint

```typescript
// e2ee.controller.ts
@Controller('e2ee')
export class E2EEController {
  @Get('users/:userId/prekey-bundle')
  async getPrekeyBundle(
    @Param('userId') userId: string,
    @Query('deviceId') deviceId?: string
  ): Promise<PrekeyBundleDto> {
    // Returns ONE prekey bundle for specified device
    // Or any available device if deviceId not specified
    return this.e2eeService.getPrekeyBundle(userId, deviceId);
  }

  @Post('devices/:deviceId/prekeys')
  @UseGuards(JwtAuthGuard, DeviceOwnerGuard)
  async submitPrekeys(
    @Param('deviceId') deviceId: string,
    @Body() dto: SubmitPrekeysDto
  ) {
    // Store prekeys for this device
    return this.e2eeService.storePrekeys(deviceId, dto);
  }

  @Get('devices/:deviceId/signed-prekey')
  async getSignedPrekey(
    @Param('deviceId') deviceId: string
  ) {
    return this.e2eeService.getSignedPrekey(deviceId);
  }
}
```

### Prekey Store Service

```typescript
// prekey-store.service.ts
@Injectable()
export class PrekeyStoreService {
  constructor(private prisma: PrismaService) {}

  // Store initial prekeys when device registers
  async storeInitialPrekeys(
    deviceId: string,
    signedPreKey: SignedPreKey,
    oneTimePreKeys: OneTimePreKey[]
  ): Promise<void> {
    await this.prisma.$transaction([
      // Store signed prekey
      this.prisma.signedPreKey.create({
        data: {
          deviceId,
          keyId: signedPreKey.keyId,
          publicKey: signedPreKey.publicKey,
          signature: signedPreKey.signature,
          createdAt: new Date()
        }
      }),
      
      // Store one-time prekeys
      ...oneTimePreKeys.map(key => 
        this.prisma.oneTimePreKey.create({
          data: {
            deviceId,
            keyId: key.keyId,
            publicKey: key.publicKey,
            isUsed: false
          }
        })
      )
    ]);
  }

  // Get a prekey bundle for a user (one-time use)
  async getPrekeyBundle(
    deviceId: string
  ): Promise<PrekeyBundle | null> {
    // Get signed prekey
    const signedPreKey = await this.prisma.signedPreKey.findFirst({
      where: { deviceId },
      orderBy: { createdAt: 'desc' }
    });

    if (!signedPreKey) return null;

    // Get one unused one-time prekey
    const oneTimePreKey = await this.prisma.oneTimePreKey.findFirst({
      where: { deviceId, isUsed: false }
    });

    // Mark it as used (or delete it)
    if (oneTimePreKey) {
      await this.prisma.oneTimePreKey.update({
        where: { id: oneTimePreKey.id },
        data: { isUsed: true }
      });
    }

    // Get identity key from device
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      select: { 
        publicKey: true,  // Identity key
        userId: true 
      }
    });

    return {
      registrationId: this.generateRegistrationId(deviceId),
      deviceId,
      identityKey: device.publicKey,
      signedPreKey: {
        keyId: signedPreKey.keyId,
        publicKey: signedPreKey.publicKey,
        signature: signedPreKey.signature
      },
      preKey: oneTimePreKey ? {
        keyId: oneTimePreKey.keyId,
        publicKey: oneTimePreKey.publicKey
      } : null  // May be null if depleted
    };
  }

  // Replenish one-time prekeys when low
  async replenishPrekeys(
    deviceId: string,
    newPreKeys: OneTimePreKey[]
  ): Promise<void> {
    const currentCount = await this.prisma.oneTimePreKey.count({
      where: { deviceId, isUsed: false }
    });

    if (currentCount < 10) {
      await this.prisma.oneTimePreKey.createMany({
        data: newPreKeys.map(key => ({
          deviceId,
          keyId: key.keyId,
          publicKey: key.publicKey,
          isUsed: false
        }))
      });
    }
  }

  // Rotate signed prekey periodically
  async rotateSignedPrekey(
    deviceId: string,
    newSignedPreKey: SignedPreKey
  ): Promise<void> {
    // Mark old as superseded, add new
    await this.prisma.signedPreKey.create({
      data: {
        deviceId,
        keyId: newSignedPreKey.keyId,
        publicKey: newSignedPreKey.publicKey,
        signature: newSignedPreKey.signature,
        createdAt: new Date()
      }
    });

    // Delete old signed prekeys (keep last 2)
    const oldKeys = await this.prisma.signedPreKey.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      skip: 2
    });

    await this.prisma.signedPreKey.deleteMany({
      where: { id: { in: oldKeys.map(k => k.id) } }
    });
  }
}
```

---

## Client Implementation

### Client Crypto Service

```typescript
// client/services/crypto.service.ts
export class SignalCryptoService {
  private identityKeyPair: KeyPair;
  private signedPreKey: SignedKeyPair;
  private oneTimePreKeys: KeyPair[];
  private sessions: Map<string, Session> = new Map();

  // 1. Initialize on registration
  async initialize(): Promise<void> {
    // Generate identity key
    this.identityKeyPair = await x25519.generateKeyPair();
    
    // Generate signed prekey
    this.signedPreKey = await this.generateSignedPreKey();
    
    // Generate 100 one-time prekeys
    this.oneTimePreKeys = await this.generatePreKeys(0, 100);
    
    // Upload to server
    await this.uploadPrekeys();
  }

  private async generateSignedPreKey(): Promise<SignedKeyPair> {
    const keyPair = await x25519.generateKeyPair();
    const signature = await ed25519.sign(
      keyPair.publicKey,
      this.identityKeyPair.privateKey
    );
    
    return {
      keyId: Date.now(), // Or increment
      keyPair,
      signature
    };
  }

  private async generatePreKeys(startId: number, count: number): Promise<KeyPair[]> {
    const preKeys: KeyPair[] = [];
    for (let i = 0; i < count; i++) {
      preKeys.push(await x25519.generateKeyPair());
    }
    return preKeys;
  }

  // 2. Encrypt message to recipient
  async encryptMessage(
    recipientId: string,
    recipientDeviceId: string,
    plaintext: string
  ): Promise<EncryptedMessage> {
    const sessionKey = `${recipientId}:${recipientDeviceId}`;
    let session = this.sessions.get(sessionKey);

    // No session yet - perform X3DH
    if (!session) {
      session = await this.initializeSession(recipientId, recipientDeviceId);
      this.sessions.set(sessionKey, session);
    }

    // Encrypt using Double Ratchet
    return this.doubleRatchetEncrypt(session, plaintext);
  }

  private async initializeSession(
    recipientId: string,
    deviceId: string
  ): Promise<Session> {
    // Fetch prekey bundle from server
    const bundle = await api.get(
      `/e2ee/users/${recipientId}/prekey-bundle?deviceId=${deviceId}`
    );

    // Verify signed prekey
    const isValid = await ed25519.verify(
      bundle.signedPreKey.signature,
      bundle.signedPreKey.publicKey,
      bundle.identityKey
    );
    if (!isValid) {
      throw new Error('Invalid signed prekey signature');
    }

    // Generate ephemeral key
    const ephemeralKey = await x25519.generateKeyPair();

    // Perform X3DH calculations
    const DH1 = await x25519.sharedSecret(
      this.identityKeyPair.privateKey,
      bundle.identityKey
    );
    const DH2 = await x25519.sharedSecret(
      ephemeralKey.privateKey,
      bundle.identityKey
    );
    const DH3 = await x25519.sharedSecret(
      this.identityKeyPair.privateKey,
      bundle.signedPreKey.publicKey
    );
    const DH4 = bundle.preKey 
      ? await x25519.sharedSecret(
          ephemeralKey.privateKey,
          bundle.preKey.publicKey
        )
      : new Uint8Array(32); // If no prekey available

    // Combine
    const sharedSecret = HKDF(
      concatenate(DH1, DH2, DH3, DH4),
      32,
      'SignalProtocolV3'
    );

    // Initialize Double Ratchet
    const session = await this.initializeRatchetAlice(
      sharedSecret,
      bundle.signedPreKey.publicKey
    );

    // Store ephemeral public key in session for initial message
    session.ephemeralKey = ephemeralKey.publicKey;

    return session;
  }

  // 3. Decrypt incoming message
  async decryptMessage(
    senderId: string,
    senderDeviceId: string,
    encryptedMessage: EncryptedMessage
  ): Promise<string> {
    const sessionKey = `${senderId}:${senderDeviceId}`;
    let session = this.sessions.get(sessionKey);

    // No session - this is initial message, perform X3DH as Bob
    if (!session) {
      session = await this.initializeSessionAsBob(encryptedMessage);
      this.sessions.set(sessionKey, session);
    }

    // Decrypt using Double Ratchet
    return this.doubleRatchetDecrypt(session, encryptedMessage);
  }

  private async initializeSessionAsBob(
    message: InitialMessage
  ): Promise<Session> {
    // Get our stored keys
    const identityPrivate = this.identityKeyPair.privateKey;
    const signedPreKeyPrivate = this.signedPreKey.keyPair.privateKey;
    const oneTimePreKey = this.oneTimePreKeys.find(
      pk => pk.keyId === message.preKeyId
    );

    // Perform X3DH calculations
    const DH1 = await x25519.sharedSecret(identityPrivate, message.identityKey);
    const DH2 = await x25519.sharedSecret(identityPrivate, message.ephemeralKey);
    const DH3 = await x25519.sharedSecret(signedPreKeyPrivate, message.identityKey);
    const DH4 = oneTimePreKey 
      ? await x25519.sharedSecret(oneTimePreKey.privateKey, message.ephemeralKey)
      : new Uint8Array(32);

    const sharedSecret = HKDF(
      concatenate(DH1, DH2, DH3, DH4),
      32,
      'SignalProtocolV3'
    );

    // Initialize Double Ratchet as Bob
    return this.initializeRatchetBob(sharedSecret, this.signedPreKey.keyPair);
  }
}
```

---

## Database Schema

```prisma
// Add to schema.prisma

// Device identity and prekeys
model Device {
  id                 String          @id @default(uuid())
  userId             String
  deviceType         DeviceType
  deviceName         String?
  pushToken          String?
  refreshTokenHash   String?
  
  // E2EE Fields
  registrationId     Int             @unique @default(autoincrement())
  publicKey          String?         // Identity key (IK) - base64 X25519
  signedPreKeys      SignedPreKey[]
  oneTimePreKeys     OneTimePreKey[]
  
  user               User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessions           Session[]       // Double Ratchet sessions for this device
  
  @@index([userId])
  @@map("devices")
}

// Signed prekeys (medium-term)
model SignedPreKey {
  id          String   @id @default(uuid())
  deviceId    String
  keyId       Int
  publicKey   String   // base64 encoded
  signature   String   // Signature by identity key
  createdAt   DateTime @default(now())
  
  device      Device   @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  
  @@unique([deviceId, keyId])
  @@index([deviceId])
  @@map("signed_prekeys")
}

// One-time prekeys (short-term, single use)
model OneTimePreKey {
  id          String   @id @default(uuid())
  deviceId    String
  keyId       Int
  publicKey   String   // base64 encoded
  isUsed      Boolean  @default(false)
  usedAt      DateTime?
  
  device      Device   @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  
  @@unique([deviceId, keyId])
  @@index([deviceId, isUsed])
  @@map("one_time_prekeys")
}

// Double Ratchet sessions between devices
model Session {
  id                String   @id @default(uuid())
  deviceId          String   // Our device
  remoteUserId      String   // Other party's user ID
  remoteDeviceId    String   // Other party's device ID
  
  // Double Ratchet state (encrypted at rest)
  sessionState      String   // JSON blob of DR state, encrypted
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  device            Device   @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  
  @@unique([deviceId, remoteUserId, remoteDeviceId])
  @@index([deviceId])
  @@map("sessions")
}

// Store which prekeys were used for which session (optional, for debugging)
model SessionPrekey {
  id              String   @id @default(uuid())
  sessionId       String
  prekeyId        String?  // Reference to OneTimePreKey if used
  signedPrekeyId  String   // Reference to SignedPreKey used
  
  @@map("session_prekeys")
}

// Messages remain the same, but content is encrypted
model Message {
  // ... existing fields ...
  
  // E2EE fields
  isEncrypted       Boolean  @default(false)
  encryptionType  String?  // 'signal', 'plaintext'
  
  // textContent now stores encrypted payload when isEncrypted=true
  // attachment is still separate (may be encrypted separately)
}
```

---

## Implementation Steps

### Phase 1: Server Setup (Week 1)

1. **Install dependencies**
```bash
npm install @nestjs/platform-express
# Note: Use libsignal or implement crypto yourself
npm install libsodium-wrappers  # For X25519, HKDF, etc.
```

2. **Create E2EE module files**
```typescript
// e2ee.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [E2EEController],
  providers: [
    E2EEService,
    PrekeyStoreService,
    DeviceKeysService
  ],
  exports: [E2EEService]
})
export class E2EEModule {}
```

3. **Add database migration**
```bash
npx prisma migrate dev --name add_e2ee_keys
```

4. **Implement prekey endpoints**
- POST /e2ee/devices/:id/prekeys
- GET /e2ee/users/:id/prekey-bundle

### Phase 2: Client Crypto (Week 2)

1. **Create crypto service**
```typescript
// client/services/signal-crypto.service.ts
export class SignalCryptoService {
  // Implement all methods shown above
}
```

2. **Implement X3DH**
```typescript
async performX3DH(
  ourIdentity: KeyPair,
  theirBundle: PrekeyBundle
): Promise<Uint8Array> {
  // Implement 4 DH calculations
}
```

3. **Implement Double Ratchet**
```typescript
export class DoubleRatchet {
  private state: DoubleRatchetState;
  
  encrypt(plaintext: string): EncryptedMessage {}
  decrypt(message: EncryptedMessage): string {}
}
```

### Phase 3: Integration (Week 3)

1. **Modify MessageService to encrypt**
```typescript
async createMessage(dto: CreateMessageDto) {
  if (dto.isEncrypted) {
    const encrypted = await this.cryptoService.encryptMessage(
      dto.recipientId,
      dto.plaintext
    );
    dto.textContent = encrypted.ciphertext;
  }
  // ... rest of create
}
```

2. **Modify MessageService to decrypt on fetch**
```typescript
async getMessages(chatId: string, userId: string) {
  const messages = await this.prisma.message.findMany({...});
  
  // Decrypt each message
  return Promise.all(messages.map(async msg => {
    if (msg.isEncrypted) {
      msg.textContent = await this.cryptoService.decryptMessage(
        msg.senderId,
        msg.textContent
      );
    }
    return msg;
  }));
}
```

---

## Security Considerations

### 1. Key Storage
```typescript
// Store keys securely (use Keychain/Keystore on mobile)
async storeKeys(keyPair: KeyPair): Promise<void> {
  // React Native: react-native-keychain
  // Electron: electron-safe-storage
  // Web: Web Crypto API with password derivation
  
  await Keychain.setGenericPassword(
    'identity_key',
    JSON.stringify(keyPair),
    { service: 'signal_identity' }
  );
}
```

### 2. Session State Protection
```typescript
// Encrypt session state before storing in DB
function encryptSessionState(
  state: DoubleRatchetState,
  deviceKey: Uint8Array
): string {
  const serialized = JSON.stringify(state);
  const encrypted = AESGCMEncrypt(deviceKey, serialized);
  return encodeBase64(encrypted);
}
```

### 3. Verification (Safety Numbers)
```typescript
// Generate safety number for key verification
function generateSafetyNumber(
  aliceIdentity: Uint8Array,
  bobIdentity: Uint8Array
): string {
  const fingerprint = HKDF(
    concatenate(aliceIdentity, bobIdentity),
    30,
    'SafetyNumber'
  );
  
  // Convert to 5-digit groups: 12345 67890 ...
  return chunk(fingerprint, 5).map(b => 
    b.reduce((a, x) => (a + x) % 100000).toString().padStart(5, '0')
  ).join(' ');
}
```

### 4. Forward Secrecy
- Chain keys must be securely deleted after ratchet step
- Old message keys can be deleted after message decrypted
- Implement secure memory wiping

### 5. Group Encryption (Optional Future)
Use Sender Keys for groups:
- Each member generates group-specific sender key
- Broadcast sender key to group via pairwise sessions
- Use symmetric encryption for group messages

---

## Libraries to Use

### Server (Node.js)
```json
{
  "libsodium-wrappers": "^0.7.11",
  "@nestjs/common": "^10.0.0",
  "prisma": "^5.0.0"
}
```

### Client Options

**Option 1: libsignal-protocol-javascript**
```bash
npm install @privacyresearch/libsignal-protocol-typescript
```
- Official-ish implementation
- TypeScript support
- Battle-tested

**Option 2: Custom implementation with libsodium**
```bash
npm install libsodium-wrappers
```
- More control
- Smaller bundle
- Need to implement yourself

**Option 3: libsignal-node (native)**
```bash
npm install libsignal
```
- Uses native C library
- Best performance
- Node.js only (not for web)

---

## Testing E2EE

```typescript
// e2ee.service.spec.ts
describe('E2EE', () => {
  it('should establish session between Alice and Bob', async () => {
    // Setup
    const alice = new SignalCryptoService();
    const bob = new SignalCryptoService();
    
    await alice.initialize();
    await bob.initialize();
    
    // Alice sends first message
    const message = "Hello Bob!";
    const encrypted = await alice.encryptMessage(
      bob.getUserId(),
      bob.getDeviceId(),
      message
    );
    
    // Bob decrypts
    const decrypted = await bob.decryptMessage(
      alice.getUserId(),
      alice.getDeviceId(),
      encrypted
    );
    
    expect(decrypted).toBe(message);
  });
  
  it('should maintain forward secrecy', async () => {
    // After many messages, compromise shouldn't reveal old messages
  });
  
  it('should handle out-of-order messages', async () => {
    // Messages 1, 2, 3 arrive as 2, 3, 1
  });
  
  it('should handle multi-device', async () => {
    // Alice sends to Bob's 2 devices
  });
});
```

---

## References

1. [Signal Protocol Docs](https://signal.org/docs/)
2. [X3DH Specification](https://signal.org/docs/specifications/x3dh/)
3. [Double Ratchet Spec](https://signal.org/docs/specifications/doubleratchet/)
4. [libsignal-protocol-javascript](https://github.com/signalapp/libsignal-protocol-javascript)
5. [ libsodium](https://libsodium.gitbook.io/doc/)

---

**Total Implementation Time:** 3-4 weeks for a working E2EE system
- Week 1: Server prekey infrastructure
- Week 2: Client crypto implementation
- Week 3: Integration and testing
- Week 4: Security hardening and group support
