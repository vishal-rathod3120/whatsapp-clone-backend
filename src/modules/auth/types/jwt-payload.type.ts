export interface JwtPayload {
  sub: string;
  phoneNumber: string | null;
  iat: number;
  exp: number;
}
