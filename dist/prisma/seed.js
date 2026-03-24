"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    const passwordHash = await bcrypt.hash('password123', 10);
    const user1 = await prisma.user.upsert({
        where: { phoneNumber: '+919999999999' },
        update: {},
        create: {
            displayName: 'Alice',
            phoneNumber: '+919999999999',
            passwordHash,
            isVerified: true,
            aboutText: 'Hey there! I am using WhatsApp Clone.',
        },
    });
    const user2 = await prisma.user.upsert({
        where: { phoneNumber: '+919999999998' },
        update: {},
        create: {
            displayName: 'Bob',
            phoneNumber: '+919999999998',
            passwordHash,
            isVerified: true,
            aboutText: 'Available',
        },
    });
    const user3 = await prisma.user.upsert({
        where: { phoneNumber: '+919999999997' },
        update: {},
        create: {
            displayName: 'Charlie',
            phoneNumber: '+919999999997',
            passwordHash,
            isVerified: true,
        },
    });
    console.log('Created users:', { user1: user1.id, user2: user2.id, user3: user3.id });
    const chat = await prisma.chat.upsert({
        where: {
            id: 'temp-chat-id',
        },
        update: {},
        create: {
            type: 'DIRECT',
            createdById: user1.id,
            members: {
                create: [
                    { userId: user1.id, role: 'MEMBER' },
                    { userId: user2.id, role: 'MEMBER' },
                ],
            },
        },
    });
    console.log('Created chat:', chat.id);
    const message1 = await prisma.message.create({
        data: {
            chatId: chat.id,
            senderId: user1.id,
            type: 'TEXT',
            textContent: 'Hey Bob! How are you?',
            status: 'SEEN',
        },
    });
    const message2 = await prisma.message.create({
        data: {
            chatId: chat.id,
            senderId: user2.id,
            type: 'TEXT',
            textContent: 'Hi Alice! I am doing great, thanks!',
            status: 'SEEN',
            replyToMessageId: message1.id,
        },
    });
    console.log('Created messages:', { message1: message1.id, message2: message2.id });
    await prisma.chat.update({
        where: { id: chat.id },
        data: {
            lastMessageId: message2.id,
            lastMessageAt: message2.createdAt,
        },
    });
    console.log('Seeding completed!');
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map