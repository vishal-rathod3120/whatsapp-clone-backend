const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const messages = await prisma.message.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, displayName: true, phoneNumber: true } },
      chat: { select: { id: true, type: true, title: true } },
      receipts: { select: { userId: true, deliveredAt: true, seenAt: true } }
    }
  });
  console.log(JSON.stringify(messages, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
