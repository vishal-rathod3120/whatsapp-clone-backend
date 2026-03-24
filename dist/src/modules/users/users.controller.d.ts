import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getMe(): Promise<{
        message: string;
    }>;
    updateMe(dto: UpdateProfileDto): Promise<{
        message: string;
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
    blockUser(id: string): Promise<{
        message: string;
    }>;
    unblockUser(id: string): Promise<{
        message: string;
    }>;
}
