import { createHash, randomBytes } from 'crypto';

export function encodeCursor(data: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

export function decodeCursor(cursor: string): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString());
  } catch {
    return null;
  }
}

export function generateOpaqueCursor(
  id: string,
  timestamp: Date,
): string {
  return encodeCursor({ id, ts: timestamp.toISOString() });
}

export function parseOpaqueCursor(
  cursor: string,
): { id: string; ts: string } | null {
  const decoded = decodeCursor(cursor);
  if (!decoded || !decoded.id || !decoded.ts) return null;
  return { id: decoded.id as string, ts: decoded.ts as string };
}
