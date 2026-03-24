export class UserResponse {
  id: string;
  displayName: string;
  phoneNumber?: string;
  email?: string;
  avatarUrl?: string;
  aboutText?: string;
  isVerified: boolean;
  createdAt: Date;

  constructor(user: any) {
    this.id = user.id;
    this.displayName = user.displayName;
    this.phoneNumber = user.phoneNumber;
    this.email = user.email;
    this.avatarUrl = user.avatarUrl;
    this.aboutText = user.aboutText;
    this.isVerified = user.isVerified;
    this.createdAt = user.createdAt;
  }
}
