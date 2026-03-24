import { Injectable, Logger } from '@nestjs/common';

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
    const username = Math.random().toString(36).substring(2, 15);
    const credential = Math.random().toString(36).substring(2, 15);
    return { username, credential };
  }
}
