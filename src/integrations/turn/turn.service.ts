import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface TurnServer {
  urls: string[];
  username?: string;
  credential?: string;
}

@Injectable()
export class TurnService {
  private readonly logger = new Logger(TurnService.name);

  getTurnServers(): TurnServer[] {
    const turnServers: TurnServer[] = [];

    // Add coturn server if configured
    const turnUrl = process.env.TURN_SERVER_URL;
    if (turnUrl) {
      turnServers.push({
        urls: [turnUrl],
        username: process.env.TURN_USERNAME || '',
        credential: process.env.TURN_CREDENTIAL || '',
      });
    }

    // Add STUN servers
    turnServers.push({ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] });

    return turnServers;
  }

  generateTurnCredentials(): { username: string; credential: string } {
    const secret = process.env.TURN_SECRET;
    if (!secret) return { username: 'mock', credential: 'mock' };

    const unixTimeStamp = Math.floor(Date.now() / 1000) + 24 * 3600; // 24 hours expiry
    const username = `${unixTimeStamp}:app_user`;

    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(username);
    const credential = hmac.digest('base64');

    return { username, credential };
  }
}
