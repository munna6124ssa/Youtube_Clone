# YouTube Clone - Production Ready

A full-stack YouTube clone application with advanced features including multi-language comment system, location-based theming, and comprehensive user management.

## 🚀 Features

### Core YouTube Features
- **Video Streaming**: Integration with YouTube API via RapidAPI
- **Search & Discovery**: Real-time video search and categorized content
- **User Authentication**: Secure login/registration with JWT
- **Comments System**: Full-featured commenting with replies
- **Like/Dislike System**: Video and comment interactions
- **Responsive Design**: Mobile, tablet, and desktop optimized

### Advanced Features

#### 1. Groups System
- **Create Groups**: Users can create public/private groups
- **Group Management**: Role-based permissions (Admin, Moderator, Member)
- **Invitations**: Search and invite users to groups
- **Discovery**: Browse and search groups by category

#### 2. Smart Comments System
- **Multi-language Support**: Comment in any language
- **Real-time Translation**: Translate comments to preferred language
- **Location Display**: Shows commenter's city automatically
- **Auto-moderation**: Removes comments with 2+ dislikes
- **Special Character Filtering**: Blocks comments with special characters

#### 3. Dynamic Theme System
- **Location-based Theming**: 
  - South India (TN, KL, KA, AP, TG) + 10 AM-12 PM = Light theme
  - All other times/locations = Dark theme
- **User Preferences**: Manual theme override option

#### 4. Location-based Authentication
- **Smart OTP Delivery**:
  - South Indian states: Email OTP
  - Other states: SMS OTP
- **Automatic Detection**: Uses IP geolocation

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **Communication**: Nodemailer (Email), Twilio (SMS)
- **APIs**: YouTube API via RapidAPI
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: React Query
- **Forms**: React Hook Form
- **Video Player**: React Player
- **Icons**: Lucide React

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- RapidAPI account (YouTube API)
- Twilio account (SMS)
- Gmail account (Email)

### 1. Clone Repository
```bash
git clone <repository-url>
cd youtube-clone
```

### 2. Backend Setup
```bash
cd server
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your credentials
```

**Required Environment Variables:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/youtube-clone

# JWT
JWT_SECRET=your_super_secret_jwt_key

# RapidAPI (YouTube)
RAPIDAPI_KEY=your_rapidapi_key_here

# Email (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

**Start Backend:**
```bash
npm run dev  # Development
# or
npm start    # Production
```

### 3. Frontend Setup
```bash
cd clients
npm install

# Configure API endpoint
cp .env.example .env
# Update VITE_API_URL if needed
```

**Start Frontend:**
```bash
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔧 Configuration Guide

### API Keys Setup

#### 1. RapidAPI (YouTube Data)
1. Visit [RapidAPI YouTube API](https://rapidapi.com/ytdlfree/api/youtube-v31)
2. Subscribe to the API
3. Copy your API key to `RAPIDAPI_KEY`

#### 2. Twilio (SMS)
1. Create account at [Twilio](https://www.twilio.com)
2. Get Account SID, Auth Token, and Phone Number
3. Add to environment variables

#### 3. Gmail (Email)
1. Enable 2-factor authentication
2. Generate App Password
3. Use app password in `EMAIL_PASS`

### Database Setup

#### Local MongoDB
```bash
# Install MongoDB
# Start MongoDB service
mongod

# Database will be created automatically
```

#### MongoDB Atlas (Cloud)
1. Create cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Get connection string
3. Update `MONGODB_URI`

## 📱 Application Screenshots

### Homepage
- Responsive video grid
- Category navigation
- Search functionality

### Video Player
- YouTube integration
- Like/dislike buttons
- Comments section
- Related videos

### Groups
- Group discovery
- Create/manage groups
- Member management
- Invitation system

### Authentication
- Login/register forms
- OTP verification
- Location-based flow

## 🌟 Key Features Explained

### 1. Smart Theme System
The application automatically detects user location and time to apply appropriate themes:

```javascript
// Logic: South India + 10AM-12PM = Light theme
if (isSouthernState(userLocation) && isTimeBetween10And12()) {
  return 'light';
} else {
  return 'dark';
}
```

### 2. Intelligent Comment System
- **Auto-translation**: Comments can be translated to any supported language
- **Location tracking**: Shows commenter's city automatically
- **Smart moderation**: Auto-removes problematic content
- **Multi-language input**: Accept comments in any language

### 3. Groups Management
- **Role hierarchy**: Owner > Admin > Moderator > Member
- **Privacy controls**: Public groups vs invitation-only private groups
- **Search & discovery**: Find groups by name, category, or tags
- **Activity tracking**: Member join dates, activity status

### 4. Location-based Features
- **OTP delivery method**: Email for South India, SMS for others
- **Theme selection**: Time and location-based automatic theming
- **Comment metadata**: City-level location display

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Comprehensive data validation
- **CORS Protection**: Configured for secure cross-origin requests
- **Password Hashing**: Bcrypt with salt rounds
- **XSS Protection**: Helmet.js security headers

## 📈 Performance Optimizations

### Backend
- **Database Indexing**: Optimized MongoDB queries
- **Caching**: Query result caching
- **Rate Limiting**: Prevents API abuse
- **Compression**: Response compression

### Frontend
- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component and image lazy loading
- **React Query**: Intelligent data caching
- **Bundle Optimization**: Vite optimizations

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
```

### Frontend Testing
```bash
cd clients
npm test
```

## 🚀 Deployment

### Backend Deployment (Heroku)
```bash
# Install Heroku CLI
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_uri
# Add all environment variables
git push heroku main
```

### Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel
cd clients
vercel --prod
```

### Environment Variables for Production
Make sure to set all environment variables in your hosting platform:
- Backend: All variables from `.env`
- Frontend: `VITE_API_URL` pointing to your backend

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Login with OTP
- `POST /api/auth/verify-otp` - OTP verification

### Videos
- `GET /api/videos` - Get videos with search/pagination
- `GET /api/videos/:id` - Get single video
- `POST /api/videos/:id/like` - Like/unlike video

### Comments
- `GET /api/comments/:videoId` - Get video comments
- `POST /api/comments` - Add comment
- `POST /api/comments/:id/translate` - Translate comment

### Groups
- `GET /api/groups` - Get public groups
- `POST /api/groups` - Create group
- `POST /api/groups/:id/join` - Join group

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

## 📄 License

This project is for educational purposes. Feel free to use and modify.

## 🐛 Known Issues

- Video upload feature not implemented (uses YouTube API only)
- Real-time notifications not implemented
- Advanced video analytics not available

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Video upload functionality
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Live streaming support
- [ ] AI-powered recommendations

## 💬 Support

For support, email [your-email] or create an issue in the repository.

---

**Built with ❤️ for learning purposes**
