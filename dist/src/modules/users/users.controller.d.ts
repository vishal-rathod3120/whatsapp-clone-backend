import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from '../auth/types/jwt-payload.type';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getMe(user: JwtPayload): Promise<{
        id: string;
        phoneNumber: string | null;
        email: string | null;
        displayName: string;
        avatarUrl: string | null;
        aboutText: string | null;
        isVerified: boolean;
        createdAt: Date;
    }>;
    updateMe(dto: UpdateProfileDto, user: JwtPayload): Promise<{
        id: string;
        phoneNumber: string | null;
        email: string | null;
        displayName: string;
        avatarUrl: string | null;
        aboutText: string | null;
        isVerified: boolean;
        updatedAt: Date;
    }>;
    getUserById(id: string): Promise<{
        id: string;
        phoneNumber: string | null;
        email: string | null;
        displayName: string;
        avatarUrl: string | null;
        aboutText: string | null;
        isVerified: boolean;
        createdAt: Date;
    }>;
    blockUser(id: string, user: JwtPayload): Promise<{
        success: boolean;
    }>;
    unblockUser(id: string, user: JwtPayload): Promise<{
        success: boolean;
    }>;
}
