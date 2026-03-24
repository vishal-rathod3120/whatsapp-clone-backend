export declare function encodeCursor(data: Record<string, unknown>): string;
export declare function decodeCursor(cursor: string): Record<string, unknown> | null;
export declare function generateOpaqueCursor(id: string, timestamp: Date): string;
export declare function parseOpaqueCursor(cursor: string): {
    id: string;
    ts: string;
} | null;
