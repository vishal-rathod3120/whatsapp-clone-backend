# WhatsApp Clone Backend

A production-ready WhatsApp clone backend built with Node.js, NestJS, Socket.IO, PostgreSQL, and Redis.

## Features

- **Authentication**: JWT-based auth with refresh tokens, multi-device support
- **Real-time Messaging**: Socket.IO for instant messaging with delivery/read receipts
- **Presence**: Online/offline status, typing indicators, last seen
- **Media**: File uploads (images, videos, audio, documents)
- **Audio/Video Calls**: WebRTC signaling for peer-to-peer calls
- **Chat Management**: Direct chats with unread count and pagination
- **Push Notifications**: FCM/APNs integration for offline notifications

## Tech Stack

- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for presence and socket management
- **Real-time**: Socket.IO
- **Auth**: JWT + Passport
- **Documentation**: Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Start infrastructure services**:
```bash
docker-compose up -d
```

3. **Setup environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Run database migrations**:
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Start the application**:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`
API documentation at `http://localhost:3000/docs`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout

### Users
- `GET /api/v1/users/me` - Get profile
- `PATCH /api/v1/users/me` - Update profile
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users/block/:id` - Block user

### Chats
- `POST /api/v1/chats/direct` - Create direct chat
- `GET /api/v1/chats` - Get chat list
- `GET /api/v1/chats/:chatId` - Get chat details
- `POST /api/v1/chats/:chatId/read` - Mark as read

### Messages
- `GET /api/v1/chats/:chatId/messages` - Get messages
- `POST /api/v1/chats/:chatId/messages` - Send message (REST)
- `DELETE /api/v1/messages/:messageId` - Delete message

### Media
- `POST /api/v1/media/upload` - Upload file

### Calls
- `GET /api/v1/calls` - Get call history
- `GET /api/v1/calls/:callId` - Get call details

## Socket.IO Events

### Client → Server
- `chat:send` - Send message
- `chat:delivered` - Mark message as delivered
- `chat:seen` - Mark message as seen
- `chat:typing:start` - Start typing
- `chat:typing:stop` - Stop typing
- `call:initiate` - Initiate call
- `call:accept` - Accept call
- `call:reject` - Reject call
- `call:end` - End call
- `call:offer` - WebRTC offer
- `call:answer` - WebRTC answer
- `call:ice-candidate` - ICE candidate

### Server → Client
- `chat:new` - New message received
- `chat:sent-ack` - Message sent confirmation
- `chat:delivered:update` - Delivery receipt
- `chat:seen:update` - Read receipt
- `chat:typing:update` - Typing indicator
- `presence:update` - Presence change
- `call:incoming` - Incoming call
- `call:accepted` - Call accepted
- `call:rejected` - Call rejected
- `call:ended` - Call ended
- `call:timeout` - Call timeout

## Project Structure

```
src/
├── modules/
│   ├── auth/           # Authentication
│   ├── users/          # User management
│   ├── chats/          # Chat management
│   ├── messages/       # Message handling
│   ├── gateway/        # Socket.IO gateway
│   ├── media/          # File uploads
│   ├── calls/          # Call signaling
│   └── notifications/  # Push notifications
├── prisma/             # Database schema
├── redis/              # Redis service
├── config/             # App configuration
└── common/             # Shared utilities
```

## Database Schema

- **users**: User accounts
- **devices**: User devices with push tokens
- **chats**: Chat rooms (direct/group)
- **chat_members**: Chat memberships
- **messages**: Messages with attachments
- **message_receipts**: Delivery/read receipts
- **attachments**: File metadata
- **user_blocks**: Blocked users
- **calls**: Call records
- **call_participants**: Call participants

## License

MIT
