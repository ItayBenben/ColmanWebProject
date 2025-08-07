# ColmanWebProject - Backend API

This is the backend API server for the ColmanWebProject social media platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- npm or yarn

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file with:
```env
MONGO_URI=mongodb://localhost:27017/colmanwebproject
JWT_SECRET=your_jwt_secret_here
PORT=5000
NODE_ENV=development
```

### Running the Server
```bash
# Development
npm start

# Production
NODE_ENV=production npm start
```

### Testing
```bash
# Run tests
npm test

# Seed test data
node test/add_data.js
```

## 📁 Structure

```
BE/
├── controllers/     # Request handlers
├── middleware/      # Custom middleware
├── models/         # Database schemas
├── routes/         # API endpoints
├── services/       # External integrations
├── test/          # Test utilities
└── app.js         # Express app
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/statistics` - Get user statistics
- `POST /api/users/add-friend` - Add friend
- `GET /api/users/search` - Search users

### Posts
- `GET /api/posts` - Get posts
- `POST /api/posts` - Create post
- `PATCH /api/posts/:id/like` - Toggle like
- `POST /api/posts/:id/comments` - Add comment

### Groups
- `GET /api/groups` - List groups
- `POST /api/groups` - Create group
- `POST /api/groups/:id/join` - Join group

### Feed
- `GET /api/feed` - Get personalized feed

## 🛠️ Technologies

- **Express.js** - Web framework
- **MongoDB** + **Mongoose** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin requests

---

For complete documentation, see the [main README](../README.md).
