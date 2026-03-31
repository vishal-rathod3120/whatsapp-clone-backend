import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePollDto } from './dto/poll.dto';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class PollsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a poll — creates a POLL-type message with attached poll data.
   */
  async createPoll(userId: string, dto: CreatePollDto) {
    // Verify user is a member of the chat
    const membership = await this.prisma.chatMember.findFirst({
      where: { chatId: dto.chatId, userId, leftAt: null },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this chat');
    }

    // Create message + poll in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the POLL message
      const message = await tx.message.create({
        data: {
          id: uuidv7(),
          chatId: dto.chatId,
          senderId: userId,
          type: 'POLL',
          textContent: dto.question, // Store question as textContent for search
        },
      });

      // Update chat's last message
      await tx.chat.update({
        where: { id: dto.chatId },
        data: {
          lastMessageId: message.id,
          lastMessageAt: message.createdAt,
        },
      });

      // Create the poll
      const poll = await tx.poll.create({
        data: {
          messageId: message.id,
          question: dto.question,
          isMultiple: dto.isMultiple || false,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
          options: {
            create: dto.options.map((text, index) => ({
              text,
              order: index,
            })),
          },
        },
        include: {
          options: {
            include: {
              votes: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      return { message, poll };
    });

    return result;
  }

  /**
   * Vote on a poll.
   */
  async vote(userId: string, pollId: string, optionIds: string[]) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: true,
        message: {
          include: {
            chat: {
              include: {
                members: { where: { leftAt: null }, select: { userId: true } },
              },
            },
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if poll has expired
    if (poll.expiresAt && poll.expiresAt < new Date()) {
      throw new ForbiddenException('This poll has expired');
    }

    // Verify user is a chat member
    const isMember = poll.message.chat.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Not a member of this chat');
    }

    // Validate option IDs belong to this poll
    const validOptionIds = poll.options.map((o) => o.id);
    const invalidIds = optionIds.filter((id) => !validOptionIds.includes(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException('Invalid option IDs');
    }

    // For single-choice polls, only allow one option
    if (!poll.isMultiple && optionIds.length > 1) {
      throw new BadRequestException('This poll only allows a single choice');
    }

    // Remove previous votes and add new ones
    await this.prisma.$transaction(async (tx) => {
      // Remove all previous votes by this user for this poll
      await tx.pollVote.deleteMany({
        where: {
          option: { pollId },
          userId,
        },
      });

      // Create new votes
      await tx.pollVote.createMany({
        data: optionIds.map((optionId) => ({
          optionId,
          userId,
        })),
      });
    });

    return this.getPoll(pollId);
  }

  /**
   * Get poll with results.
   */
  async getPoll(pollId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            votes: {
              select: { userId: true, votedAt: true },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Format: add vote count per option
    return {
      ...poll,
      totalVotes: poll.options.reduce((sum, o) => sum + o.votes.length, 0),
      options: poll.options.map((o) => ({
        id: o.id,
        text: o.text,
        order: o.order,
        voteCount: o.votes.length,
        voters: o.votes.map((v) => v.userId),
      })),
    };
  }

  /**
   * Get poll by message ID.
   */
  async getPollByMessageId(messageId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { messageId },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found for this message');
    }

    return this.getPoll(poll.id);
  }
}
