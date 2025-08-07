# ColmanWebProject 🌐

A modern social media platform built with Node.js, Express, and MongoDB. Connect with friends, join groups, share posts, and track your social activity with comprehensive statistics.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)

## ✨ Features

### 🔐 Authentication & User Management
- **User Registration & Login** - Secure JWT-based authentication
- **Profile Management** - Edit personal information and preferences
- **Password Encryption** - Secure bcrypt password hashing

### 👥 Social Features
- **Friend System** - Add friends directly without requests
- **User Search** - Find and connect with other users
- **Profile Viewing** - View detailed user profiles with location maps

### 📝 Content Management
- **Post Creation** - Share text and media posts
- **Comments System** - Engage with posts through comments
- **Likes System** - Like posts and comments
- **Media Support** - Upload and share images and videos

### 🏢 Group Management
- **Create Groups** - Start communities around shared interests
- **Join Groups** - Discover and join existing groups
- **Group Posts** - Share content within specific groups
- **Member Management** - Add/remove members (admin controls)

### 📊 User Statistics
- **Comprehensive Analytics** - Track posts, likes, comments, and more
- **Time Filtering** - View statistics for "All Time" or "Last 24 Hours"
- **Social Metrics** - Monitor engagement and social activity

### 🔍 Advanced Search
- **Multi-Type Search** - Search for users, posts, and groups
- **Real-time Results** - Instant search with live suggestions
- **Filter Options** - Narrow down search results by type

### 📱 Modern UI/UX
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Interactive Elements** - Smooth animations and hover effects
- **Bootstrap Integration** - Professional styling and components

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing
- **HTTP Client**: Axios for external API calls
- **Middleware**: CORS, Body Parser, Morgan logging

### Frontend
- **Languages**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Bootstrap 5.1.3, Custom CSS
- **HTTP Requests**: Fetch API, jQuery AJAX
- **Maps Integration**: Google Maps API
- **Icons**: Font Awesome, Emoji icons

### External Services
- **Facebook API** - Social media integration
- **Google Maps** - Location visualization

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (version 18.0 or higher)
- **MongoDB** (version 6.0 or higher)
- **npm** or **yarn** package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ColmanWebProject.git
cd ColmanWebProject
```

### 2. Backend Setup
```bash
cd BE
npm install
```

### 3. Frontend Setup
```bash
cd ../ui
npm install
```

### 4. Environment Configuration
Create a `.env` file in the `BE` directory:
```env
# Database
MONGO_URI=mongodb://localhost:27017/colmanwebproject

# JWT Secret (use a strong, unique secret in production)
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Facebook API (optional)
FACEBOOK_PAGE_ID=your_facebook_page_id
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token

# Google Maps API (optional)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 5. Database Setup
Start MongoDB and the database will be automatically created when you first run the application.

Optional: Seed the database with test data
```bash
cd BE
node test/add_data.js
```

### 6. Start the Application

**Backend Server:**
```bash
cd BE
npm start
# Server will run on http://localhost:5000
```

**Frontend (in a new terminal):**
```bash
cd ui
# Serve the files using a local server
# Option 1: Using Python
python -m http.server 8000

# Option 2: Using Node.js http-server
npx http-server -p 8000

# Frontend will be available at http://localhost:8000
```

## 📁 Project Structure

```
ColmanWebProject/
├── BE/                          # Backend application
│   ├── controllers/             # Request handlers
│   │   ├── authController.js    # Authentication logic
│   │   ├── userController.js    # User management & statistics
│   │   ├── postController.js    # Post operations
│   │   ├── groupController.js   # Group management
│   │   └── ...
│   ├── middleware/              # Custom middleware
│   │   ├── auth.js             # JWT authentication
│   │   └── errorHandler.js     # Error handling
│   ├── models/                 # Database schemas
│   │   ├── User.js             # User model
│   │   ├── Post.js             # Post model
│   │   └── Group.js            # Group model
│   ├── routes/                 # API route definitions
│   ├── services/               # External service integrations
│   ├── test/                   # Test utilities and data
│   ├── app.js                  # Express app configuration
│   └── package.json
├── ui/                         # Frontend application
│   ├── ui/
│   │   ├── css/               # Stylesheets
│   │   ├── js/                # JavaScript modules
│   │   ├── *.html             # HTML pages
│   │   └── logo_files/        # Assets and images
│   └── package.json
├── LICENSE                     # MIT License
└── README.md                  # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/statistics?period={all|day}` - Get user statistics
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/add-friend` - Add friend
- `GET /api/users/search?q={query}` - Search users

### Posts
- `GET /api/posts` - Get posts (with filters)
- `POST /api/posts` - Create new post
- `DELETE /api/posts/:id` - Delete post
- `PATCH /api/posts/:id/like` - Toggle post like
- `POST /api/posts/:id/comments` - Add comment
- `GET /api/posts/search?q={query}` - Search posts

### Groups
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create group
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/leave` - Leave group
- `DELETE /api/groups/:id` - Delete group
- `GET /api/groups/search?q={query}` - Search groups

### Feed
- `GET /api/feed` - Get personalized feed

## 💡 Usage Guide

### Getting Started
1. **Register** a new account or **login** with existing credentials
2. **Complete your profile** with personal information
3. **Find friends** using the search functionality
4. **Join groups** that interest you
5. **Start posting** and engaging with content

### Creating Content
- **Text Posts**: Share your thoughts and updates
- **Media Posts**: Upload images and videos
- **Group Posts**: Share content within specific groups

### Social Interaction
- **Like posts** and comments to show appreciation
- **Comment** on posts to start conversations
- **Add friends** directly from search results
- **Join groups** to connect with like-minded people

### Statistics Dashboard
- View your **activity metrics** in your profile
- Switch between **All Time** and **Last 24 Hours** views
- Track your **social engagement** and **content performance**

## 🔧 Configuration

### Security Settings
- Change the default JWT secret in production
- Enable HTTPS in production environments
- Configure CORS for your domain
- Set secure cookie options

### Database Configuration
- MongoDB connection string in `.env`
- Database name: `colmanwebproject` (configurable)
- Automatic indexing for optimal performance

### External APIs
- **Google Maps**: For location visualization
- **Facebook API**: For social media integration (optional)

## 🧪 Testing

### Running Tests
```bash
cd BE
npm test
```

### Seeding Test Data
```bash
cd BE
node test/add_data.js
```

This will create:
- 10 test users
- 3 sample groups
- 20 sample posts with comments and likes

## 🚀 Deployment

### Backend Deployment
1. Set `NODE_ENV=production` in your environment
2. Use a process manager like PM2
3. Configure reverse proxy (Nginx)
4. Set up MongoDB Atlas for cloud database

### Frontend Deployment
1. Build and minify assets
2. Deploy to static hosting (Netlify, Vercel, etc.)
3. Update API endpoint URLs for production

## 🤝 Contributing

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. Open a **Pull Request**

### Development Guidelines
- Follow existing code style and conventions
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Bootstrap** for the responsive UI framework
- **MongoDB** for the flexible database solution
- **Express.js** for the robust backend framework
- **Google Maps** for location services
- **Font Awesome** for beautiful icons

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed description
3. Include error messages and steps to reproduce

---

**Made with ❤️ for Colman College**

*Happy coding! 🚀*