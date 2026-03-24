import { CallsService } from './calls.service';
import { TurnService } from '../../integrations/turn/turn.service';
export declare class CallsController {
    private callsService;
    private turnService;
    constructor(callsService: CallsService, turnService: TurnService);
    getCalls(limit?: number, cursor?: string): Promise<{
        message: string;
    }>;
    getCallById(callId: string): Promise<{
        message: string;
    }>;
    getTurnCredentials(): Promise<{
        expiry: Date;
        username: string;
        credential: string;
        iceServers: import("../../integrations/turn/turn.service").TurnServer[];
    }>;
}
