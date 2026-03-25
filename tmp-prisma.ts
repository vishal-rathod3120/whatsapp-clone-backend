import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Find any user and chat
    const user = await prisma.user.findFirst();
    if (!user) return console.log('No user');
    
    const chat = await prisma.chat.findFirst({
        where: { members: { some: { userId: user.id } } }
    });
    if (!chat) return console.log('No chat');

    console.log('Testing create with:', { userId: user.id, chatId: chat.id });
    
    const call = await prisma.call.create({
      data: {
        chatId: chat.id,
        callerId: user.id,
        type: 'VIDEO',
        status: 'RINGING',
        participants: {
          create: {
            userId: user.id,
            joinedAt: new Date(),
          }
        }
      }
    });
    
    console.log('Success!', call);
  } catch (err) {
    console.error('Prisma Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
