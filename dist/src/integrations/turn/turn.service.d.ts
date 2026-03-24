export interface TurnServer {
    urls: string[];
    username?: string;
    credential?: string;
}
export declare class TurnService {
    private readonly logger;
    getTurnServers(): TurnServer[];
    generateTurnCredentials(): {
        username: string;
        credential: string;
    };
}
