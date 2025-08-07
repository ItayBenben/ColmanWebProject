# ColmanWebProject - Frontend

This is the frontend client application for the ColmanWebProject social media platform.

## 🚀 Quick Start

### Prerequisites
- Web browser (Chrome, Firefox, Safari, Edge)
- Local web server (Python, Node.js, or any HTTP server)

### Running the Frontend
```bash
# Option 1: Using Python
python -m http.server 8000

# Option 2: Using Node.js
npx http-server -p 8000

# Option 3: Using PHP
php -S localhost:8000

# Then visit: http://localhost:8000
```

### Backend Connection
Make sure the backend API is running on `http://localhost:5000` before using the frontend.

## 📁 Structure

```
ui/
├── ui/
│   ├── css/                 # Stylesheets
│   │   ├── style-feed.css   # Feed page styles
│   │   ├── user_profile.css # Profile page styles
│   │   ├── style-login.css  # Login page styles
│   │   └── styles.css       # Global styles
│   ├── js/                  # JavaScript modules
│   │   ├── feed.js         # Feed functionality
│   │   ├── user_profile.js # Profile management
│   │   ├── login.js        # Authentication
│   │   ├── register.js     # User registration
│   │   └── header.js       # Navigation component
│   ├── feed.html           # Main feed page
│   ├── user_profile.html   # User profile page
│   ├── login.html          # Login page
│   ├── register.html       # Registration page
│   └── logo_files/         # Assets and images
└── package.json
```

## 🎨 Pages & Features

### 🏠 Feed Page (`feed.html`)
- View personalized post feed
- Create new posts with media
- Like and comment on posts
- Search for users, posts, and groups
- Add friends directly from search
- Filter posts by groups

### 👤 Profile Page (`user_profile.html`)
- View detailed user profiles
- Edit your own profile information
- See user statistics with time filters
- Manage friends and groups
- Create and join groups
- Google Maps integration for addresses

### 🔐 Authentication (`login.html`, `register.html`)
- Secure user registration
- JWT-based login system
- Form validation
- Automatic redirects

## 🛠️ Technologies

### Core Technologies
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Grid/Flexbox
- **JavaScript ES6+** - Interactive functionality

### Libraries & Frameworks
- **Bootstrap 5.1.3** - Responsive UI framework
- **jQuery 3.6.0** - DOM manipulation and AJAX
- **Font Awesome** - Icons (via CDN)

### External APIs
- **Google Maps API** - Location visualization
- **Backend API** - Data and authentication

## 🎨 Styling Features

- **Responsive Design** - Works on all screen sizes
- **Modern UI Components** - Cards, modals, buttons
- **Interactive Elements** - Hover effects, animations
- **Color Scheme** - Professional blue/green palette
- **Typography** - Clean, readable fonts

## 🔧 Configuration

### API Endpoints
Update the backend URL in JavaScript files if needed:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

### Google Maps API
Replace the API key in HTML files:
```html
<script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"></script>
```

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🔒 Security

- JWT tokens stored in localStorage
- CSRF protection via same-origin policy
- Input validation and sanitization
- Secure cookie handling

---

For complete setup instructions, see the [main README](../README.md).
