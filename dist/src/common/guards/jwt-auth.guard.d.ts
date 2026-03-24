import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthTokenService } from '../../modules/auth/auth-token.service';
export declare class JwtAuthGuard implements CanActivate {
    private authTokenService;
    constructor(authTokenService: AuthTokenService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
}
