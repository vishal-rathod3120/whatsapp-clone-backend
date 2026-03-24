"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeCursor = encodeCursor;
exports.decodeCursor = decodeCursor;
exports.generateOpaqueCursor = generateOpaqueCursor;
exports.parseOpaqueCursor = parseOpaqueCursor;
function encodeCursor(data) {
    return Buffer.from(JSON.stringify(data)).toString('base64url');
}
function decodeCursor(cursor) {
    try {
        return JSON.parse(Buffer.from(cursor, 'base64url').toString());
    }
    catch {
        return null;
    }
}
function generateOpaqueCursor(id, timestamp) {
    return encodeCursor({ id, ts: timestamp.toISOString() });
}
function parseOpaqueCursor(cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded || !decoded.id || !decoded.ts)
        return null;
    return { id: decoded.id, ts: decoded.ts };
}
//# sourceMappingURL=cursor.util.js.map