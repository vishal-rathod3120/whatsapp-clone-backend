# Contact Sync Algorithms - Research & Implementation Guide

## Overview

Contact discovery is the process of matching a user's phone contacts with registered users on your messaging service without revealing the user's entire address book to the server. This is a critical privacy requirement for modern messaging apps.

**The Core Problem:**
- User has 500+ contacts in phone book
- Service has 10M+ registered users
- How to find the intersection without revealing all contacts?

---

## Algorithm Comparison

| Algorithm | Privacy | Performance | Complexity | Production Use |
|-----------|---------|-------------|------------|----------------|
| Plain Upload | ❌ None | ✅ Fast | ✅ Simple | WhatsApp (old), most apps |
| Hash Matching | ⚠️ Weak | ✅ Fast | ✅ Simple | Signal (old), Telegram |
| Bloom Filter | ⚠️ Medium | ⚠️ Slow | ⚠️ Complex | Not widely used |
| SGX Enclave | ✅ Strong | ✅ Fast | ❌ Complex | Signal (current) |
| Private Set Intersection | ✅ Strong | ❌ Slow | ❌ Complex | Research only |

---

## 1. Plain Upload (Simplest - No Privacy)

**How it works:**
1. Client uploads all phone numbers to server
2. Server matches against registered users database
3. Server returns matching users

**Pros:**
- Simple implementation
- Fast matching
- Can notify when contacts join later

**Cons:**
- Server learns entire social graph
- Privacy risk if database breached
- Regulatory compliance issues (GDPR)

**Implementation:**
```typescript
// Client
const contacts = await getPhoneContacts(); // ['+1234567890', '+9876543210']
const response = await api.post('/contacts/sync', { contacts });

// Server
async syncContacts(userId: string, contacts: string[]) {
  // Store association for "who joined" notifications
  await prisma.contactAssociation.createMany({
    data: contacts.map(phone => ({
      userId,
      phoneNumber: phone,
      hashedPhone: hashPhone(phone)
    }))
  });
  
  // Find registered users
  const registeredUsers = await prisma.user.findMany({
    where: { phoneNumber: { in: contacts } }
  });
  
  return registeredUsers;
}
```

**Privacy Enhancement:** Delete contacts after matching, don't store persistently.

---

## 2. Hash-Based Matching (Privacy-Preserving - Basic)

**How it works:**
1. Client hashes phone numbers (SHA-256 truncated)
2. Sends truncated hashes to server
3. Server compares with hashed registered users
4. Returns matches

**Key Insight:** Phone numbers have small "keyspace" (~10^10 possible numbers), so hashes can be reversed via dictionary attack. Still better than plaintext.

**Pros:**
- Server never sees plaintext phone numbers
- Relatively simple
- Fast matching

**Cons:**
- Hashes can be inverted (rainbow tables)
- Can't salt hashes (must match consistently)
- Truncation reduces security but improves performance

**Implementation:**
```typescript
// utils/phone-hash.ts
import { createHash } from 'crypto';

export function hashPhoneNumber(phone: string): string {
  // Normalize: remove non-digits, add country code if missing
  const normalized = normalizePhone(phone);
  
  // Create hash
  const hash = createHash('sha256')
    .update(normalized)
    .digest('hex');
  
  // Truncate to first 16 chars for performance
  return hash.substring(0, 16);
}

// Client
const contacts = await getPhoneContacts();
const hashedContacts = contacts.map(hashPhoneNumber);

const response = await api.post('/contacts/discover', {
  hashes: hashedContacts
});

// Server
async discoverContacts(userId: string, hashes: string[]) {
  // Find matching users by hash
  const matches = await prisma.user.findMany({
    where: {
      phoneHash: { in: hashes }
    },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      phoneHash: true // Return hash, not phone number
    }
  });
  
  return matches;
}
```

**Database Schema Addition:**
```prisma
model User {
  id          String  @id @default(uuid())
  phoneNumber String? @unique
  phoneHash   String? @unique  // Add this field
  // ... other fields
}

model ContactHash {
  id        String   @id @default(uuid())
  userId    String
  phoneHash String   // Hash of contact in user's address book
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([phoneHash])
}
```

---

## 3. Bloom Filter Approach (Advanced - Medium Privacy)

**How it works:**
1. Server creates Bloom filter of all registered users
2. Client downloads Bloom filter periodically (~40MB for 10M users)
3. Client checks contacts locally against filter
4. False positives possible but rare

**Pros:**
- Server learns nothing about queries
- Client does matching locally

**Cons:**
- Large download size for big user bases
- False positives (rare but annoying)
- Doesn't work well for mobile/bandwidth-constrained

**Why It Doesn't Scale:**
For 10 million users:
- Bloom filter size: ~40MB
- If 1M users refresh daily: 40TB bandwidth/day
- Not feasible for mobile apps

**Implementation (for small scale):**
```typescript
import { BloomFilter } from 'bloom-filters';

// Server - Generate filter
function generateBloomFilter(users: string[]): BloomFilter {
  // False positive rate: 0.1%
  const filter = new BloomFilter(10000000, 0.001);
  
  users.forEach(user => {
    filter.add(hashPhoneNumber(user));
  });
  
  return filter;
}

// Client - Check contacts
function findRegisteredContacts(
  bloomFilter: BloomFilter,
  contacts: string[]
): string[] {
  return contacts.filter(contact => {
    const hash = hashPhoneNumber(contact);
    return bloomFilter.has(hash); // May have false positives
  });
}
```

---

## 4. Sharded Bloom Filters (Privacy/Performance Trade-off)

**How it works:**
1. Split users into buckets (e.g., by phone prefix)
2. Create separate Bloom filter for each bucket
3. Client only downloads buckets matching their contacts
4. Privacy leak: server knows which bucket client is querying

**Trade-off Analysis:**
| Buckets | Privacy | Download Size | Query Leakage |
|---------|---------|---------------|---------------|
| 1       | Perfect | 40MB          | Nothing       |
| 100     | High    | 400KB         | 2 digits      |
| 1000    | Medium  | 40KB          | 3 digits      |
| 10000   | Low     | 4KB           | 4 digits      |

**The Problem:**
With 5,000 contacts and 100 buckets, client might need to query 50 buckets (birthday paradox). Still leaks significant info.

---

## 5. Signal's SGX Approach (State-of-the-Art)

**How it works:**
1. Run contact discovery service in Intel SGX secure enclave
2. Client verifies enclave code via remote attestation
3. Client encrypts contacts with enclave's public key
4. Enclave decrypts, matches, encrypts results
5. Server OS never sees plaintext

**Pros:**
- Cryptographic guarantee of code execution
- Server learns nothing about contacts
- Computationally efficient

**Cons:**
- Requires Intel SGX hardware
- Complex implementation
- SGX has had security vulnerabilities
- Not portable to all cloud providers

**Architecture:**
```
┌─────────────┐         ┌──────────────────────────────┐
│   Client    │────────▶│        Untrusted Host        │
│  (Signal)   │  TLS    │       (Signal Server)        │
└─────────────┘         └──────────────────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  SGX Enclave │
                        │   (Trusted)  │
                        └──────────────┘
```

**Signal's Implementation Details:**
- Uses Intel SGX with remote attestation
- Oblivious RAM (ORAM) to hide memory access patterns
- Prevents side-channel attacks
- Client verifies enclave is running published code

---

## 6. Private Set Intersection (PSI) - Research Grade

**How it works:**
Cryptographic protocol where two parties compute intersection without revealing their sets.

**Issues:**
- High computational cost
- Requires touching every record
- 10M users × 500 contacts = 5B operations per sync
- Not practical for real-time

**Example Protocols:**
- DH-PSI (Diffie-Hellman based)
- OT-based PSI (Oblivious Transfer)
- RSA-PSI

All are too slow for mobile messaging apps at scale.

---

## Recommended Implementation for WhatsApp Clone

### Phase 1: Hash-Based Matching (MVP)

**Best balance of simplicity and privacy for initial launch.**

```typescript
// services/contact-discovery.service.ts
@Injectable()
export class ContactDiscoveryService {
  constructor(private prisma: PrismaService) {}

  async discoverContacts(
    userId: string,
    phoneHashes: string[]
  ): Promise<DiscoveredContact[]> {
    // Rate limit: max 500 contacts per request
    if (phoneHashes.length > 500) {
      throw new BadRequestException('Too many contacts');
    }

    // Find matching users
    const matches = await this.prisma.user.findMany({
      where: {
        phoneHash: { in: phoneHashes },
        id: { not: userId } // Exclude self
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        aboutText: true,
        phoneHash: true
      }
    });

    // Store for "new contact joined" notifications
    // But don't persist the actual hashes long-term
    await this.prisma.contactSyncLog.create({
      data: {
        userId,
        contactCount: phoneHashes.length,
        matchCount: matches.length,
        syncedAt: new Date()
      }
    });

    return matches;
  }
}

// controller
@Controller('contacts')
export class ContactsController {
  @Post('discover')
  @UseGuards(JwtAuthGuard)
  async discover(
    @Body() dto: DiscoverContactsDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.contactDiscoveryService.discoverContacts(
      user.sub,
      dto.hashes
    );
  }
}
```

**Frontend Implementation:**
```typescript
// React Native / Frontend
import { NativeModules } from 'react-native';
import { createHash } from 'crypto';

class ContactSyncService {
  async syncContacts(): Promise<User[]> {
    // 1. Get phone contacts
    const contacts = await NativeModules.Contacts.getAll();
    
    // 2. Extract and normalize phone numbers
    const phoneNumbers = contacts
      .flatMap(c => c.phoneNumbers)
      .map(p => this.normalizePhone(p.number))
      .filter(Boolean);
    
    // 3. Hash phone numbers
    const hashes = phoneNumbers.map(phone => 
      createHash('sha256')
        .update(phone)
        .digest('hex')
        .substring(0, 16)
    );
    
    // 4. Send to server
    const response = await api.post('/contacts/discover', { hashes });
    
    return response.data;
  }
  
  private normalizePhone(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Add country code if missing (assume user's country)
    if (digits.length === 10) {
      return `+1${digits}`; // Default to US
    }
    
    return `+${digits}`;
  }
}
```

### Phase 2: Enhanced Privacy

**Add contact change notifications without storing hashes:**

```typescript
// When new user registers
async onUserRegistered(user: User) {
  // Find users who might have this contact
  // Without storing their full contact list
  
  // Option A: Store only prefix (first 6 digits of hash)
  const hashPrefix = user.phoneHash.substring(0, 6);
  
  const potentialMatches = await prisma.contactSyncLog.findMany({
    where: {
      // Users who synced contacts with matching prefix
      contactPrefixes: { has: hashPrefix }
    }
  });
  
  // Notify potential matches to re-sync
  for (const match of potentialMatches) {
    await this.notificationService.notifyContactJoined(
      match.userId,
      user.id
    );
  }
}
```

---

## Database Schema for Contact Discovery

```prisma
// Add to schema.prisma

// Store user phone hash for matching
model User {
  // ... existing fields ...
  phoneHash   String? @unique  // SHA-256 truncated
}

// Optional: Track sync events (not individual contacts)
model ContactSyncLog {
  id              String   @id @default(uuid())
  userId          String
  contactCount    Int      // How many contacts user has
  matchCount      Int      // How many registered users found
  contactPrefixes String[] // First 6 chars of hashes for notification
  syncedAt        DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([syncedAt])
  @@map("contact_sync_logs")
}

// Track which contacts user has "found"
model UserContact {
  id          String   @id @default(uuid())
  userId      String   // Owner of address book
  contactId   String   // Registered user they found
  createdAt   DateTime @default(now())
  
  user    User @relation("UserContacts", fields: [userId], references: [id], onDelete: Cascade)
  contact User @relation("ContactUsers", fields: [contactId], references: [id], onDelete: Cascade)
  
  @@unique([userId, contactId])
  @@index([userId])
  @@index([contactId])
  @@map("user_contacts")
}
```

---

## API Endpoints

```typescript
// DTOs
discover-contacts.dto.ts:
export class DiscoverContactsDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  @Length(16, 16, { each: true }) // SHA-256 truncated
  hashes: string[];
}

// Response
discovered-contact.response.ts:
export interface DiscoveredContact {
  id: string;
  displayName: string;
  avatarUrl?: string;
  aboutText?: string;
  // Note: Never return phone number or full hash
}
```

---

## Security Considerations

### 1. Rate Limiting
- Max 1 sync per hour per user
- Max 500 contacts per sync
- Progressive delays for repeated requests

### 2. Hash Truncation Trade-off
- Full SHA-256: Secure but slower DB queries
- 16 chars: Good balance (2^64 possible combinations)
- 12 chars: Faster but more collision risk

### 3. Timing Attack Prevention
```typescript
// Always do same amount of work regardless of matches
async function constantTimeMatch(hashes: string[]) {
  const results = [];
  
  // Batch lookup for consistent timing
  const users = await prisma.user.findMany({
    where: { phoneHash: { in: hashes } },
    take: hashes.length // Always query max
  });
  
  // Pad results to avoid timing leaks
  while (users.length < hashes.length) {
    users.push(null);
  }
  
  return users.filter(Boolean);
}
```

### 4. Forward Secrecy
- Don't store contact hashes long-term
- Delete sync logs after 30 days
- Allow users to disable contact discovery

---

## Comparison Summary

| Feature | Plain Upload | Hash Matching | Bloom Filter | SGX |
|---------|-------------|---------------|--------------|-----|
| **Privacy** | ❌ Bad | ⚠️ Okay | ⚠️ Okay | ✅ Good |
| **Speed** | ✅ Fast | ✅ Fast | ⚠️ Medium | ✅ Fast |
| **Mobile Data** | ✅ Low | ✅ Low | ❌ High | ✅ Low |
| **Implementation** | ✅ Easy | ✅ Easy | ⚠️ Medium | ❌ Hard |
| **Scalability** | ✅ Good | ✅ Good | ❌ Bad | ✅ Good |
| **New Join Notifications** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |

---

## Recommendation

**Start with Hash-Based Matching (16-char truncated SHA-256)**

1. ✅ Simple to implement
2. ✅ Good privacy (not plaintext)
3. ✅ Fast and scalable
4. ✅ Allows "who joined" notifications
5. ✅ Works on any infrastructure

**Future Upgrade Path:**
- Phase 1: Hash matching
- Phase 2: Add SGX if you have dedicated infrastructure
- Phase 3: Evaluate new PSI protocols as they become practical

---

## References

1. [Signal's Contact Discovery Blog](https://signal.org/blog/contact-discovery/)
2. [Signal's SGX Implementation](https://signal.org/blog/private-contact-discovery/)
3. [Private Set Intersection Research](https://contact-discovery.github.io/)
4. [Bloom Filters Explained](https://en.wikipedia.org/wiki/Bloom_filter)
5. [Intel SGX Documentation](https://software.intel.com/sgx)
