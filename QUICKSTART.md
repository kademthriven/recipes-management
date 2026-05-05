# Quick Start Guide

## Get Started in 5 Minutes

This guide will help you set up and run the Recipe Management API on your local machine.

---

## Step 1: Prerequisites

Make sure you have these installed:

```bash
# Check Node.js
node --version  # Should be v14 or higher

# Check npm
npm --version   # Should be v6 or higher

# Check MySQL
mysql --version # Should be v8 or higher
```

If any are missing, install them from:
- [Node.js](https://nodejs.org/)
- [MySQL](https://dev.mysql.com/downloads/)

---

## Step 2: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd recipe-management-api

# Install dependencies
npm install
```

---

## Step 3: Setup Database

### Option A: Quick Setup (Windows)

1. Open PowerShell as Administrator
2. Start MySQL service:
   ```powershell
   net start MySQL80
   ```
3. Create database:
   ```powershell
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS recipe_management;"
   ```
4. Load schema:
   ```powershell
   mysql -u root -p < database/schema.sql
   ```
5. Seed initial data:
   ```powershell
   npm run seed
   ```

### Option B: Quick Setup (Mac/Linux)

```bash
# Start MySQL
brew services start mysql       # Mac
sudo service mysql start        # Linux

# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS recipe_management;"

# Load schema
mysql -u root -p < database/schema.sql

# Seed initial data
npm run seed
```

---

## Step 4: Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit .env with your settings
# Minimum required:
# - DB_PASSWORD (your MySQL password)
# - JWT_SECRET (any secure string)
```

---

## Step 5: Run the Server

```bash
npm run dev
```

You should see:
```
Server is running on port 5000
```

---

## Step 6: Test the API

Open another terminal and test:

```bash
# Health check
curl http://localhost:5000/health

# Register a user
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
```

---

## Troubleshooting

### MySQL Connection Error

```bash
# Check if MySQL is running
mysql -u root -p

# If it fails:
# Windows: net start MySQL80
# Mac: brew services start mysql
# Linux: sudo service mysql start
```

### Port 5000 Already in Use

```bash
# Use different port
PORT=3001 npm run dev
```

### Database Already Exists

```bash
# Drop and recreate
mysql -u root -p -e "DROP DATABASE IF EXISTS recipe_management; CREATE DATABASE recipe_management;"
mysql -u root -p < database/schema.sql
npm run seed
```

---

## Next Steps

1. **Read the API Documentation**: See [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
2. **Setup AWS S3** (optional): For image uploads, configure AWS credentials in `.env`
3. **Test with Postman**: Import API endpoints for easier testing
4. **Deploy**: See deployment section in README.md

---

## Useful Commands

```bash
npm run dev          # Start development server
npm start            # Start production server
npm run seed         # Seed initial data
npm test             # Run tests
npm run lint         # Lint code
```

---

## API Base URL

```
http://localhost:5000/api
```

---

## Common Endpoints to Try

```bash
# Create a recipe (after login, add token)
curl -X POST http://localhost:5000/api/recipes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pasta",
    "ingredients": "pasta, sauce",
    "instructions": "cook and serve"
  }'

# Search recipes
curl http://localhost:5000/api/recipes/search?search=pasta

# Get trending recipes
curl http://localhost:5000/api/recipes/trending
```

---

## Support

Stuck? Check:
- README.md for detailed setup
- docs/API_DOCUMENTATION.md for API reference
- GitHub Issues for common problems
