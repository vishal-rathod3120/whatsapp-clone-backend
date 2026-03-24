export const APP_CONSTANTS = {
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MESSAGE_LIMIT: 30,
  },
  CALL: {
    TIMEOUT_SECONDS: 30,
  },
  TYPING: {
    TTL_SECONDS: 8,
  },
  JWT: {
    ACCESS_EXPIRATION: '15m',
    REFRESH_EXPIRATION: '7d',
  },
} as const;
