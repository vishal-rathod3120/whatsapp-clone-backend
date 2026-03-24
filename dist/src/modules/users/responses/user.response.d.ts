export declare class UserResponse {
    id: string;
    displayName: string;
    phoneNumber?: string;
    email?: string;
    avatarUrl?: string;
    aboutText?: string;
    isVerified: boolean;
    createdAt: Date;
    constructor(user: any);
}
