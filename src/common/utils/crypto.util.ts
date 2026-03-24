import { createHash, randomBytes, randomUUID } from 'crypto';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const computedHash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return computedHash === hash;
}

export function generateRandomToken(): string {
  return randomBytes(32).toString('hex');
}

export function generateUUID(): string {
  return randomUUID();
}

export function hashData(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}
