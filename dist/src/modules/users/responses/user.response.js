"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResponse = void 0;
class UserResponse {
    constructor(user) {
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
exports.UserResponse = UserResponse;
//# sourceMappingURL=user.response.js.map