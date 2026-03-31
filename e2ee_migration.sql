-- E2EE Infrastructure Migration
-- Apply this when database is running: psql -d whatsapp_db -f e2ee_migration.sql
-- Created: March 29, 2026

-- 1. Add E2EE columns to Device table
ALTER TABLE "devices" 
ADD COLUMN IF NOT EXISTS "publicKey" TEXT,
ADD COLUMN IF NOT EXISTS "registrationId" INTEGER;

-- 2. Create SignedPreKey table
CREATE TABLE IF NOT EXISTS "signed_prekeys" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "deviceId" TEXT NOT NULL,
    "keyId" INTEGER NOT NULL,
    "publicKey" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "signed_prekeys_deviceId_keyId_unique" UNIQUE ("deviceId", "keyId"),
    CONSTRAINT "signed_prekeys_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "signed_prekeys_deviceId_idx" ON "signed_prekeys"("deviceId");

-- 3. Create OneTimePreKey table
CREATE TABLE IF NOT EXISTS "one_time_prekeys" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "deviceId" TEXT NOT NULL,
    "keyId" INTEGER NOT NULL,
    "publicKey" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    
    CONSTRAINT "one_time_prekeys_deviceId_keyId_unique" UNIQUE ("deviceId", "keyId"),
    CONSTRAINT "one_time_prekeys_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "one_time_prekeys_deviceId_idx" ON "one_time_prekeys"("deviceId");
CREATE INDEX IF NOT EXISTS "one_time_prekeys_deviceId_isUsed_idx" ON "one_time_prekeys"("deviceId", "isUsed");

-- 4. Create Session table for Double Ratchet state
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "deviceId" TEXT NOT NULL,
    "remoteUserId" TEXT NOT NULL,
    "remoteDeviceId" TEXT NOT NULL,
    "sessionState" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "sessions_deviceId_remoteUserId_remoteDeviceId_unique" UNIQUE ("deviceId", "remoteUserId", "remoteDeviceId"),
    CONSTRAINT "sessions_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "sessions_deviceId_idx" ON "sessions"("deviceId");

-- 5. Add isEncrypted and encryptionType to messages (if not already present)
ALTER TABLE "messages"
ADD COLUMN IF NOT EXISTS "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "encryptionType" TEXT;

-- Verification queries
-- Uncomment to verify after migration:
-- SELECT * FROM information_schema.tables WHERE table_name IN ('signed_prekeys', 'one_time_prekeys', 'sessions');
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'devices' AND column_name IN ('publicKey', 'registrationId');
