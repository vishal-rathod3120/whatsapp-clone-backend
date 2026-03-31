/**
 * Backfill Script: Compute phoneHash for existing users.
 * 
 * Run with: npx ts-node scripts/backfill-phone-hash.ts
 * 
 * This should be run once after migration to ensure existing users
 * are discoverable via contact sync.
 */
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

function hashPhoneNumber(phone: string): string {
  const normalized = phone.replace(/\D/g, '');
  const withPrefix = normalized.startsWith('+') ? normalized : `+${normalized}`;
  return createHash('sha256').update(withPrefix).digest('hex').substring(0, 16);
}

async function main() {
  console.log('Backfilling phoneHash for existing users...');

  const users = await prisma.user.findMany({
    where: {
      phoneNumber: { not: null },
      phoneHash: null,
    },
    select: { id: true, phoneNumber: true },
  });

  console.log(`Found ${users.length} users without phoneHash`);

  let updated = 0;
  for (const user of users) {
    if (user.phoneNumber) {
      const phoneHash = hashPhoneNumber(user.phoneNumber);
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneHash },
      });
      updated++;
    }
  }

  console.log(`Updated ${updated} users with phoneHash`);
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
