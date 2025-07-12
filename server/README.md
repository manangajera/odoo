# Skill Swap Platform - Backend

A comprehensive backend API for the Skill Swap Platform built with Node.js, Express, and MongoDB.

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin/User)
  - Password hashing with bcrypt
  - Protected routes

- **User Management**
  - User registration and login
  - Profile management with skills and availability
  - Public/private profile settings
  - User search and filtering

- **Skill Swap System**
  - Create, accept, reject swap requests
  - Complete swaps with ratings and feedback
  - Swap request management
  - Status tracking (pending, accepted, rejected, completed)

- **Admin Panel**
  - User management (ban/unban)
  - Swap monitoring
  - Platform announcements
  - Activity reports and analytics

- **Security Features**
  - Rate limiting
  - Input validation
  - CORS protection
  - Helmet security headers

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Password Hashing**: bcryptjs

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/skillswap
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   PORT=5000
   NODE_ENV=development
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system or use MongoDB Atlas.

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user profile
- `PUT /me` - Update user profile
- `POST /change-password` - Change password

### User Routes (`/api/users`)
- `GET /` - Get all public users (with search/filter)
- `GET /:id` - Get user by ID
- `GET /:id/reviews` - Get user reviews/feedback
- `GET /search/skills` - Get skills for autocomplete

### Swap Routes (`/api/swaps`)
- `POST /` - Create swap request
- `GET /` - Get user's swap requests
- `GET /:id` - Get specific swap request
- `PUT /:id/accept` - Accept swap request
- `PUT /:id/reject` - Reject swap request
- `PUT /:id/complete` - Complete swap with rating
- `DELETE /:id` - Cancel swap request
- `GET /stats/dashboard` - Get swap statistics

### Admin Routes (`/api/admin`)
- `GET /dashboard` - Admin dashboard statistics
- `GET /users` - Get all users (admin view)
- `PUT /users/:id/ban` - Ban user
- `PUT /users/:id/unban` - Unban user
- `GET /swaps` - Get all swap requests
- `POST /announcements` - Create announcement
- `GET /reports/users` - User activity report
- `GET /reports/swaps` - Swap activity report
- `GET /reports/activity` - Platform activity report

## Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  location: String,
  profilePhoto: String,
  bio: String,
  skillsOffered: [String],
  skillsWanted: [String],
  availability: [String],
  isPublic: Boolean,
  isAdmin: Boolean,
  isBanned: Boolean,
  rating: Number,
  totalRatings: Number,
  ratingSum: Number,
  lastActive: Date,
  timestamps: true
}
```

### SwapRequest Model
```javascript
{
  requester: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  skillOffered: String,
  skillWanted: String,
  message: String,
  status: String (enum),
  rating: Number,
  feedback: String,
  completedAt: Date,
  acceptedAt: Date,
  rejectedAt: Date,
  timestamps: true
}
```

### Announcement Model
```javascript
{
  title: String,
  message: String,
  type: String (enum),
  isActive: Boolean,
  createdBy: ObjectId (ref: User),
  expiresAt: Date,
  timestamps: true
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The API returns consistent error responses:

```javascript
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors (if any)
}
```

## Success Responses

Successful responses follow this format:

```javascript
{
  "success": true,
  "message": "Success message",
  "data": {} // Response data
}
```

## Validation

All input data is validated using Express Validator. Validation errors are returned with detailed information about what went wrong.

## Security

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend domains
- **Helmet**: Security headers
- **Input Validation**: All inputs are validated and sanitized
- **Password Hashing**: bcrypt with salt rounds
- **JWT**: Secure token-based authentication

## Development

### Running Tests
```bash
npm test
```

### Code Structure
```
server/
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── scripts/         # Utility scripts
├── .env.example     # Environment variables template
├── server.js        # Main server file
└── package.json     # Dependencies and scripts
```

### Adding New Features

1. Create model in `models/` if needed
2. Add routes in `routes/`
3. Add middleware in `middleware/` if needed
4. Update documentation

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillswap
JWT_SECRET=your_production_secret_key
PORT=5000
```

### Deployment Platforms
- **Heroku**: Easy deployment with MongoDB Atlas
- **Railway**: Modern deployment platform
- **Render**: Free tier available
- **DigitalOcean**: App Platform

## Sample Data

Run the seed script to populate the database with sample data:

```bash
npm run seed
```

This creates:
- 1 admin user (admin@skillswap.com / admin123)
- 8 sample users (password: password123)
- Sample swap requests with different statuses

## Support

For issues and questions:
1. Check the API documentation
2. Review error messages and logs
3. Ensure all environment variables are set correctly
4. Verify MongoDB connection

## License

This project is licensed under the MIT License.