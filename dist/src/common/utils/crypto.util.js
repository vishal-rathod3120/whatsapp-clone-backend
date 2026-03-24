"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateRandomToken = generateRandomToken;
exports.generateUUID = generateUUID;
exports.hashData = hashData;
const crypto_1 = require("crypto");
function hashPassword(password) {
    const salt = (0, crypto_1.randomBytes)(16).toString('hex');
    const hash = (0, crypto_1.createHash)('sha256')
        .update(password + salt)
        .digest('hex');
    return `${salt}:${hash}`;
}
function verifyPassword(password, hashedPassword) {
    const [salt, hash] = hashedPassword.split(':');
    const computedHash = (0, crypto_1.createHash)('sha256')
        .update(password + salt)
        .digest('hex');
    return computedHash === hash;
}
function generateRandomToken() {
    return (0, crypto_1.randomBytes)(32).toString('hex');
}
function generateUUID() {
    return (0, crypto_1.randomUUID)();
}
function hashData(data) {
    return (0, crypto_1.createHash)('sha256').update(data).digest('hex');
}
//# sourceMappingURL=crypto.util.js.map