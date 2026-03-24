import { registerAs } from '@nestjs/config';

export default registerAs('socket', () => ({
  corsOrigin: process.env.SOCKET_CORS_ORIGIN || '*',
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || '60000', 10) || 60000,
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || '25000', 10) || 25000,
}));
