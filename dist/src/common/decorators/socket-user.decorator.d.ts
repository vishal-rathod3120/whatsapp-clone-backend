import { JwtPayload } from '../../modules/auth/types/jwt-payload.type';
export declare const SocketUser: (...dataOrPipes: (import("@nestjs/common").PipeTransform<any, any> | keyof JwtPayload | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
