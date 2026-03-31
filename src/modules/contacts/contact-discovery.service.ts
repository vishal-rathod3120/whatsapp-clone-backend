import { createHash } from 'crypto';
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DiscoveredContact {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  aboutText: string | null;
}

@Injectable()
export class ContactDiscoveryService {
  private readonly logger = new Logger(ContactDiscoveryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Hash a phone number using SHA-256, truncated to 16 hex chars.
   * Phone number should be normalized (E.164 format) before hashing.
   */
  static hashPhoneNumber(phone: string): string {
    // Normalize: strip all non-digit chars, ensure + prefix
    const normalized = phone.replace(/\D/g, '');
    const withPrefix = normalized.startsWith('+') ? normalized : `+${normalized}`;

    const hash = createHash('sha256')
      .update(withPrefix)
      .digest('hex');

    return hash.substring(0, 16);
  }

  /**
   * Discover registered users from a list of phone hashes.
   * Returns matched user profiles without exposing phone numbers.
   */
  async discoverContacts(
    userId: string,
    phoneHashes: string[],
  ): Promise<DiscoveredContact[]> {
    if (phoneHashes.length > 500) {
      throw new BadRequestException('Maximum 500 contacts per sync request');
    }

    // Find registered users matching the provided hashes
    const matches = await this.prisma.user.findMany({
      where: {
        phoneHash: { in: phoneHashes },
        id: { not: userId }, // Exclude self
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        aboutText: true,
      },
    });

    // Auto-save matched contacts to UserContact table
    if (matches.length > 0) {
      const contactData = matches.map((match) => ({
        userId,
        contactId: match.id,
      }));

      // Upsert — skip duplicates
      for (const contact of contactData) {
        await this.prisma.userContact.upsert({
          where: {
            userId_contactId: {
              userId: contact.userId,
              contactId: contact.contactId,
            },
          },
          create: contact,
          update: {}, // No-op on conflict
        });
      }
    }

    // Log sync event (for analytics, not storing individual hashes)
    await this.prisma.contactSyncLog.create({
      data: {
        userId,
        contactCount: phoneHashes.length,
        matchCount: matches.length,
      },
    });

    this.logger.log(
      `User ${userId} synced ${phoneHashes.length} contacts, found ${matches.length} matches`,
    );

    return matches;
  }

  /**
   * Get user's saved contacts list.
   */
  async getUserContacts(userId: string) {
    const contacts = await this.prisma.userContact.findMany({
      where: { userId },
      include: {
        contact: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            aboutText: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return contacts.map((c) => ({
      ...c.contact,
      nickname: c.nickname,
      addedAt: c.createdAt,
    }));
  }

  /**
   * Remove a contact from user's saved list.
   */
  async removeContact(userId: string, contactId: string) {
    await this.prisma.userContact.delete({
      where: {
        userId_contactId: { userId, contactId },
      },
    });

    return { success: true };
  }
}
