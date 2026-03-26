import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from '../auth/types/jwt-payload.type';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getMe(user: JwtPayload): Promise<{
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        phoneNumber: string | null;
        email: string | null;
        displayName: string;
        aboutText: string | null;
        isVerified: boolean;
    }>;
    updateMe(dto: UpdateProfileDto, user: JwtPayload): Promise<{
        id: string;
        avatarUrl: string | null;
        updatedAt: Date;
        phoneNumber: string | null;
        email: string | null;
        displayName: string;
        aboutText: string | null;
        isVerified: boolean;
    }>;
    searchUsers(query: string, user: JwtPayload): Promise<{
        id: string;
        avatarUrl: string | null;
        phoneNumber: string | null;
        displayName: string;
        aboutText: string | null;
    }[]>;
    getUserById(id: string): Promise<{
        id: string;
        avatarUrl: string | null;
        createdAt: Date;
        phoneNumber: string | null;
        email: string | null;
        displayName: string;
        aboutText: string | null;
        isVerified: boolean;
    }>;
    blockUser(id: string, user: JwtPayload): Promise<{
        success: boolean;
    }>;
    unblockUser(id: string, user: JwtPayload): Promise<{
        success: boolean;
    }>;
}
