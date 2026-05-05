# Recipe Management and Sharing Platform - Setup Guide

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

The Recipe Management and Sharing Platform is a comprehensive backend API built with Node.js, Express, and MySQL that allows users to:

- Create, edit, and delete recipes
- Browse and search recipes with advanced filters
- Save recipes to favorites and organize into collections
- Rate and review recipes
- Follow other users and see their activities
- Admin dashboard for user and recipe management

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **MySQL** (v8 or higher)
- **Git**
- **Postman** (optional, for API testing)
- **AWS Account** (for S3 file storage)

### Verify Installation

```bash
node --version    # Should be v14 or higher
npm --version     # Should be v6 or higher
mysql --version   # Should be v8 or higher
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/recipe-management-api.git
cd recipe-management-api
```

### 2. Install Dependencies

```bash
npm install
```

This will install all dependencies listed in `package.json`:
- express: Web framework
- mysql2: MySQL client
- jsonwebtoken: JWT authentication
- bcryptjs: Password hashing
- @aws-sdk/client-s3: AWS S3 integration
- dotenv: Environment variable management
- multer: File upload handling
- joi: Data validation
- cors: Cross-origin resource sharing
- helmet: Security middleware
- morgan: HTTP request logger

---

## Environment Configuration

### 1. Create .env File

Copy the `.env.example` file to create your `.env` file:

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` and update with your actual values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=recipe_management
DB_USER=root
DB_PASSWORD=your_secure_password
DB_CONNECTION_LIMIT=10

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_min_32_characters
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=recipe-management-bucket

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Application URLs
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### Important Notes

- **JWT_SECRET**: Generate a secure random string (at least 32 characters) for production
- **Database Password**: Use a strong password for MySQL
- **AWS Credentials**: Get these from your AWS IAM console
- **NODE_ENV**: Set to `production` when deploying to production server

---

## Database Setup

### 1. Create MySQL Database

Connect to MySQL and create the database:

```bash
# Login to MySQL
mysql -u root -p

# Inside mysql shell
CREATE DATABASE recipe_management;
exit
```

### 2. Run Database Schema

Execute the SQL schema file to create tables:

```bash
mysql -u root -p < database/schema.sql
```

### 3. Verify Database Creation

```bash
# Connect to the database
mysql -u root -p recipe_management

# List tables
SHOW TABLES;

# You should see tables like: users, recipes, categories, reviews, etc.
```

### Database Tables

The schema creates the following tables:

- **users**: User accounts and profile information
- **recipes**: Recipe details and metadata
- **categories**: Recipe categories
- **difficulty_levels**: Difficulty levels (Easy, Medium, Hard)
- **dietary_preferences**: Dietary preferences (Vegetarian, Vegan, etc.)
- **recipe_dietary_preferences**: Many-to-many relationship between recipes and preferences
- **recipe_images**: Additional recipe images
- **favorites**: User's favorite recipes
- **collections**: User's recipe collections
- **collection_recipes**: Many-to-many relationship between collections and recipes
- **reviews**: Recipe reviews and ratings
- **follows**: User follow relationships
- **activity_feed**: Social activity updates

---

## Running the Server

### Development Mode

Start the server with automatic restart on file changes (requires nodemon):

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Production Mode

```bash
npm start
```

### Verify Server is Running

Open your browser or use curl:

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running"
}
```

---

## Project Structure

```
recipe-management-api/
├── 
│   ├── config/
│   │   └── database.js              # Database connection configuration
│   ├── controllers/
│   │   ├── userController.js        # User related endpoints
│   │   ├── recipeController.js      # Recipe related endpoints
│   │   ├── favoriteController.js    # Favorite & collection endpoints
│   │   ├── reviewController.js      # Review & rating endpoints
│   │   ├── socialController.js      # Social features endpoints
│   │   └── adminController.js       # Admin endpoints
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication middleware
│   │   ├── errorHandler.js          # Global error handling
│   │   └── upload.js                # File upload middleware
│   ├── services/
│   │   ├── userService.js           # User business logic
│   │   ├── recipeService.js         # Recipe business logic
│   │   ├── favoriteService.js       # Favorite & collection logic
│   │   ├── reviewService.js         # Review business logic
│   │   ├── socialService.js         # Social features logic
│   │   └── adminService.js          # Admin operations logic
│   ├── routes/
│   │   ├── userRoutes.js            # User endpoints
│   │   ├── recipeRoutes.js          # Recipe endpoints
│   │   ├── favoriteRoutes.js        # Favorite endpoints
│   │   ├── reviewRoutes.js          # Review endpoints
│   │   ├── socialRoutes.js          # Social endpoints
│   │   └── adminRoutes.js           # Admin endpoints
│   ├── validators/
│   │   └── schemas.js               # Joi validation schemas
│   ├── utils/
│   │   ├── appError.js              # Custom error class
│   │   ├── jwt.js                   # JWT utilities
│   │   └── s3.js                    # AWS S3 utilities
│   ├── database/
│   │   └── schema.sql               # Database schema
│   └── app.js                     # Application entry point
├── docs/
│   └── API_DOCUMENTATION.md         # Comprehensive API documentation
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore rules
├── package.json                     # Project dependencies
└── README.md                        # This file
```

---

## API Endpoints

### User Management
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password

### Recipes
- `POST /api/recipes` - Create recipe
- `GET /api/recipes/:id` - Get recipe details
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `GET /api/recipes/search` - Search recipes
- `GET /api/recipes/trending` - Get trending recipes
- `GET /api/recipes/category/:categoryId` - Get recipes by category

### Favorites & Collections
- `POST /api/favorites/:recipeId` - Add to favorites
- `DELETE /api/favorites/:recipeId` - Remove from favorites
- `GET /api/favorites` - Get user favorites
- `POST /api/favorites/collections` - Create collection
- `GET /api/favorites/collections` - Get collections
- `POST /api/favorites/collections/:collectionId/recipes/:recipeId` - Add recipe to collection

### Reviews & Ratings
- `POST /api/reviews/:recipeId` - Create review
- `DELETE /api/reviews/:reviewId` - Delete review
- `GET /api/reviews/recipe/:recipeId` - Get recipe reviews
- `GET /api/reviews/recipe/:recipeId/stats` - Get rating statistics

### Social Features
- `POST /api/social/follow/:userId` - Follow user
- `DELETE /api/social/follow/:userId` - Unfollow user
- `GET /api/social/:userId/followers` - Get user followers
- `GET /api/social/:userId/following` - Get user following
- `GET /api/social/feed/activities` - Get activity feed

### Admin Operations
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/:userId/ban` - Ban user
- `GET /api/admin/recipes` - List all recipes
- `DELETE /api/admin/recipes/:recipeId` - Delete recipe (admin)
- `POST /api/admin/categories` - Create category
- `GET /api/admin/stats` - Get platform statistics

For complete API documentation, see [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

---

## Testing the API

### Using cURL

```bash
# Register a new user
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testPassword123",
    "confirmPassword": "testPassword123",
    "first_name": "Test",
    "last_name": "User"
  }'

# Login
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testPassword123"
  }'
```

### Using Postman

1. Import the API collection from the documentation
2. Create environment variables for:
   - `base_url`: http://localhost:5000/api
   - `token`: Your JWT token (from login response)
3. Use `{{base_url}}` and `{{token}}` in your requests

---

## Deployment

### Prerequisites for Production

1. **Security**: Update all default credentials and secrets
2. **Environment**: Set NODE_ENV to 'production'
3. **Database**: Use a managed MySQL service (AWS RDS, PlanetScale, DigitalOcean)
4. **File Storage**: Use AWS S3 for image storage
5. **SSL/HTTPS**: Enable HTTPS with valid SSL certificates
6. **Monitoring**: Set up error tracking and monitoring

### AWS Deployment

#### Option 1: Using AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB
eb init -p node.js-14 recipe-api --region us-east-1

# Create environment
eb create recipe-api-production

# Deploy
eb deploy
```

#### Option 2: Using AWS EC2

1. Launch an EC2 instance
2. Install Node.js and MySQL
3. Clone the repository
4. Configure environment variables
5. Use PM2 for process management
6. Set up Nginx as reverse proxy

### Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create recipe-api

# Add a managed MySQL add-on or configure DB_* variables for your MySQL host

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t recipe-api .
docker run -p 5000:5000 -e DATABASE_URL=your_db_url recipe-api
```

---

## Troubleshooting

### Database Connection Issues

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Solution**:
```bash
# Check if MySQL is running
mysql --version

# Start MySQL
# On Windows
net start MySQL80

# On Mac
brew services start mysql

# On Linux
sudo service mysql start
```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE :::5000`

**Solution**:
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### JWT Token Errors

**Problem**: `Invalid or expired token`

**Solution**:
- Ensure token is included in Authorization header
- Format: `Authorization: Bearer <token>`
- Check if token has expired
- Re-login to get a new token

### AWS S3 Upload Fails

**Problem**: `NoSuchBucket` or `InvalidAccessKeyId`

**Solution**:
- Verify AWS credentials in `.env`
- Check if S3 bucket exists
- Verify bucket permissions
- Check AWS_REGION setting

### Database Migration Issues

**Problem**: `relation "users" does not exist`

**Solution**:
```bash
# Re-run schema
mysql -u root -p < database/schema.sql

# Or manually check tables
mysql -u root -p recipe_management
SHOW TABLES;
```

---

## Performance Optimization

1. **Enable Database Indexing**: Already configured in schema
2. **Implement Caching**: Use Redis for frequently accessed data
3. **Pagination**: Always use pagination for large datasets
4. **Compression**: Enable gzip compression (already in middleware)
5. **Connection Pooling**: Uses pool from mysql2 package
6. **Image Optimization**: Store images on S3, use CDN

---

## Security Best Practices

1. **Use HTTPS** in production
2. **Validate all inputs** using Joi schemas
3. **Hash passwords** with bcryptjs (already implemented)
4. **Use JWT** for stateless authentication
5. **Enable CORS** only for trusted origins
6. **Rate limiting** (implement in production)
7. **SQL injection prevention** (using parameterized queries)
8. **XSS protection** (Helmet middleware)
9. **Environment variables** for sensitive data
10. **Regular security updates** for dependencies

---

## Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Run tests (if configured)
npm test

# Lint code (if configured)
npm run lint

# Database schema
mysql -u root -p < database/schema.sql

# Connect to database
mysql -u root -p recipe_management
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## Support

For support or questions:
- Create an issue on GitHub
- Email: support@recipeapi.com
- Documentation: See API_DOCUMENTATION.md

---

## Version History

### v1.0.0 (Initial Release)
- User authentication and profile management
- Recipe creation, editing, and deletion
- Recipe search with advanced filters
- Favorites and collections
- Reviews and ratings
- Social features (follow, activity feed)
- Admin dashboard
- AWS S3 integration
- Comprehensive API documentation
