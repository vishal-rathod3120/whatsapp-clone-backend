import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
export interface JwtPayload {
    sub: string;
    phoneNumber: string | null;
    iat: number;
    exp: number;
}
export interface Tokens {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthTokenService {
    private jwtService;
    private configService;
    constructor(jwtService: JwtService, configService: ConfigService);
    generateTokens(userId: string, phoneNumber: string | null): Promise<Tokens>;
    verifyAccessToken(token: string): Promise<JwtPayload>;
    verifyRefreshToken(token: string): Promise<JwtPayload>;
    hashRefreshToken(token: string): Promise<string>;
    compareRefreshToken(token: string, hash: string): Promise<boolean>;
}
