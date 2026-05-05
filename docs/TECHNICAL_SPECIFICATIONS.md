# Technical Specifications & Architecture

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Design](#database-design)
4. [API Architecture](#api-architecture)
5. [Authentication & Authorization](#authentication--authorization)
6. [Error Handling](#error-handling)
7. [File Storage](#file-storage)
8. [Performance Considerations](#performance-considerations)
9. [Security Measures](#security-measures)
10. [Scalability](#scalability)

---

## System Architecture

### Layered Architecture

The application follows a three-tier layered architecture:

```
┌─────────────────────────────────────┐
│     API Routes (Request Handler)    │
├─────────────────────────────────────┤
│  Controllers (Business Logic Layer) │
├─────────────────────────────────────┤
│  Services (Business Logic)          │
├─────────────────────────────────────┤
│  Database (Data Access Layer)       │
├─────────────────────────────────────┤
│  MySQL (Data Storage)               │
└─────────────────────────────────────┘
```

### Component Responsibilities

#### Routes Layer
- Handle HTTP requests and responses
- Route incoming requests to appropriate controllers
- Validate request format

#### Controllers Layer
- Process incoming HTTP requests
- Validate request data using Joi schemas
- Call appropriate services
- Format and send HTTP responses

#### Services Layer
- Implement business logic
- Interact with database
- Handle data transformation
- Manage external services (AWS S3)

#### Database Layer
- Execute SQL queries
- Manage database connections
- Handle data persistence

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 14+ | Runtime environment |
| Express | 4.18+ | Web framework |
| MySQL | 8+ | Relational database |
| JWT | 9.0+ | Authentication |
| bcryptjs | 2.4+ | Password hashing |
| Joi | 17.9+ | Data validation |
| Multer | 1.4+ | File upload handling |
| AWS SDK | 2.13+ | S3 integration |
| Morgan | 1.10+ | HTTP logging |
| Helmet | 7.0+ | Security headers |
| Compression | 1.7+ | Response compression |
| CORS | 2.8+ | Cross-origin requests |

### Tools & Services

| Tool | Purpose |
|------|---------|
| Nodemon | Development auto-reload |
| Git | Version control |
| MySQL | Database |
| AWS S3 | File storage |
| ESLint | Code linting |
| Jest | Testing framework |

---

## Database Design

### Entity Relationship Diagram

```
Users (1) ----< (Many) Recipes
Users (1) ----< (Many) Favorites
Users (1) ----< (Many) Reviews
Users (1) ----< (Many) Collections
Users (1) ----< (Many) Follows
Users (1) ----< (Many) Activity_Feed

Recipes (1) ----< (Many) Reviews
Recipes (1) ----< (Many) Recipe_Images
Recipes (1) ----< (Many) Favorites
Recipes (1) ----< (Many) Collection_Recipes
Recipes (Many) ----< (Many) Dietary_Preferences
Recipes (Many) ----< (Many) Categories
Recipes (Many) ----< (Many) Difficulty_Levels

Collections (1) ----< (Many) Collection_Recipes
Difficulty_Levels (1) ----< (Many) Recipes
Categories (1) ----< (Many) Recipes
Dietary_Preferences (Many) ----< (Many) Recipes
```

### Table Specifications

#### Users Table

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  bio TEXT,
  profile_picture_url VARCHAR(500),
  is_verified TINYINT(1) DEFAULT 0,
  is_admin TINYINT(1) DEFAULT 0,
  is_banned TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**: username, email (for fast lookups)

#### Recipes Table

```sql
CREATE TABLE recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  cooking_time INT,
  preparation_time INT,
  servings INT,
  difficulty_level_id INT,
  category_id INT,
  featured_image_url VARCHAR(500),
  is_published TINYINT(1) DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**: user_id, category_id, is_published (for fast queries)

#### Reviews Table

```sql
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified_purchase TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(recipe_id, user_id)
);
```

**Constraints**: Composite UNIQUE on (recipe_id, user_id) prevents duplicate reviews

#### Follows Table

```sql
CREATE TABLE follows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);
```

**Constraints**: 
- UNIQUE prevents duplicate follows
- CHECK prevents self-following

### Normalization

All tables follow **Third Normal Form (3NF)**:

1. **First Normal Form**: All attributes are atomic (no composite values)
2. **Second Normal Form**: No partial dependencies on composite keys
3. **Third Normal Form**: No transitive dependencies

### Data Types

- **TEXT**: For long content (ingredients, instructions, bio)
- **VARCHAR**: For bounded-length strings
- **INTEGER**: For numeric values
- **BOOLEAN**: For flags
- **TIMESTAMP**: For date-time tracking with UTC

---

## API Architecture

### Request/Response Flow

```
HTTP Request
    ↓
Middleware (CORS, Helmet, Morgan)
    ↓
Route Handler
    ↓
Input Validation (Joi Schema)
    ↓
Authentication/Authorization
    ↓
Controller Method
    ↓
Service Method
    ↓
Database Query
    ↓
Error Handling
    ↓
Response Formatting
    ↓
HTTP Response
```

### Endpoint Naming Conventions

```
GET    /api/resources           - List resources
GET    /api/resources/:id       - Get single resource
POST   /api/resources           - Create resource
PUT    /api/resources/:id       - Update resource
DELETE /api/resources/:id       - Delete resource

GET    /api/resources/search    - Search functionality
GET    /api/resources/trending  - Special queries
```

### Request Structure

```
POST /api/recipes
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "title": "Recipe Title",
  "ingredients": "...",
  "instructions": "...",
  "cooking_time": 30
}
```

### Response Structure

**Success Response (200-201)**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* resource data */ }
}
```

**Error Response (4xx-5xx)**:
```json
{
  "success": false,
  "message": "Error description",
  "stack": "Stack trace (development only)"
}
```

---

## Authentication & Authorization

### JWT Implementation

#### Token Structure

```
Header.Payload.Signature

Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "id": 1,
  "is_admin": false,
  "iat": 1234567890,
  "exp": 1234654290
}

Signature:
HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

#### Token Flow

```
1. User submits credentials
2. Server validates credentials
3. Server generates JWT token
4. Server returns token to client
5. Client includes token in Authorization header
6. Server verifies token signature and expiration
7. Server grants or denies access
```

### Role-Based Access Control (RBAC)

#### User Roles

1. **User**: Regular user
   - Can create/edit/delete own recipes
   - Can create favorites and collections
   - Can leave reviews
   - Can follow other users

2. **Admin**: Administrative user
   - All user permissions
   - Can ban/unban users
   - Can delete any recipe
   - Can manage categories and preferences
   - Can access platform statistics

#### Authorization Levels

```javascript
// Public endpoints (no token required)
GET /api/recipes/:id
GET /api/recipes/search

// Authenticated endpoints (token required)
POST /api/recipes
PUT /api/recipes/:id
DELETE /api/recipes/:id

// Admin endpoints (token + admin role required)
POST /admin/users/:id/ban
DELETE /admin/recipes/:id
```

### Middleware Stack

```
1. CORS Middleware         - Allow cross-origin requests
2. Security Middleware     - Helmet headers
3. Logging Middleware      - Morgan HTTP logging
4. Body Parser             - Parse JSON/URL-encoded
5. Compression             - Compress responses
6. Authentication          - Verify JWT token
7. Authorization           - Check user roles
8. Validation              - Validate request data
9. Business Logic          - Controllers & Services
10. Error Handler          - Catch and format errors
```

---

## Error Handling

### Error Hierarchy

```
AppError (Custom Error Class)
  ├─ Validation Errors (400)
  ├─ Authentication Errors (401)
  ├─ Authorization Errors (403)
  ├─ Not Found Errors (404)
  ├─ Conflict Errors (409)
  └─ Server Errors (500)
```

### Error Response Format

```json
{
  "success": false,
  "message": "Descriptive error message",
  "statusCode": 400,
  "stack": "Full stack trace (dev only)"
}
```

### Error Handling Chain

```
try {
  // Business logic
} catch (error) {
  if (error instanceof ValidationError) {
    throw new AppError(error.message, 400);
  } else if (error instanceof AuthError) {
    throw new AppError(error.message, 401);
  } else {
    // Global error handler catches and formats
    next(error);
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 500 | Server Error | Unexpected error |

---

## File Storage

### AWS S3 Integration

#### Upload Process

```
1. Multer captures file from request
2. File stored in memory buffer
3. S3 upload service generates unique key
4. File uploaded to S3 bucket
5. Public URL returned to client
6. URL saved in database
```

#### File Path Structure

```
bucket/
  recipes/
    1234567890-image.jpg
    1234567891-image.png
  profiles/
    1234567892-avatar.jpg
```

#### File Validation

```javascript
// Allowed MIME types
['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// Size limit: 5MB
maxFileSize: 5 * 1024 * 1024
```

### Image Optimization

1. **Cloud Storage**: Store on S3, not locally
2. **CDN**: Use CloudFront for distribution
3. **Format**: Use WebP for better compression
4. **Responsive**: Store multiple sizes if needed

---

## Performance Considerations

### Database Performance

#### Indexes

```sql
-- Search optimization
CREATE INDEX idx_recipes_title ON recipes(title);
CREATE INDEX idx_recipes_is_published ON recipes(is_published);

-- Join optimization
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_category_id ON recipes(category_id);

-- Filter optimization
CREATE INDEX idx_reviews_recipe_id ON reviews(recipe_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
```

#### Query Optimization

1. **Use Pagination**: Limit results in all list endpoints
2. **Projection**: Select only needed columns
3. **Connection Pooling**: Reuse DB connections
4. **Query Optimization**: Use efficient WHERE clauses

#### Example Optimized Query

```sql
-- Inefficient (Full table scan)
SELECT * FROM recipes;

-- Efficient (With index and pagination)
SELECT id, title, featured_image_url 
FROM recipes 
WHERE is_published = TRUE 
ORDER BY created_at DESC 
LIMIT 10 OFFSET 0;
```

### Caching Strategy

1. **Database Caching**: Use connection pooling
2. **Application Caching**: Cache frequently accessed data
3. **HTTP Caching**: Set appropriate cache headers

### Response Compression

```javascript
// Middleware for compression
app.use(compression());

// Automatically compresses responses > 1KB
```

### Pagination Guidelines

```
Default limit: 10 items
Maximum limit: 100 items
Default page: 1

Query: GET /api/recipes?page=2&limit=20
Offset calculation: offset = (page - 1) * limit
```

---

## Security Measures

### Authentication Security

1. **Password Hashing**: bcryptjs with 10 salt rounds
2. **JWT Signature**: HS256 algorithm with secure secret
3. **Token Expiration**: 7 days for access token
4. **Token Storage**: Server-side only (no local storage)

### API Security

1. **CORS**: Allow only trusted origins
2. **Helmet**: Security headers protection
3. **Rate Limiting**: Limit requests per IP (to implement)
4. **SQL Injection Prevention**: Parameterized queries
5. **XSS Prevention**: Input sanitization and validation

### Data Protection

1. **Database Connection**: Use environment variables
2. **Credentials**: Never hardcode secrets
3. **SSL/HTTPS**: Use in production
4. **Data Encryption**: For sensitive data fields

### Input Validation

```javascript
// Joi schema validation
const schema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required()
});

// Validates before database access
const { error, value } = schema.validate(req.body);
```

---

## Scalability

### Horizontal Scaling

```
Load Balancer
    ├─ Server 1
    ├─ Server 2
    └─ Server 3
    
    ↓ (All connect to)
    
MySQL Database
AWS S3 Storage
```

### Vertical Scaling

1. **Increase server resources**: CPU, RAM, Disk
2. **Database optimization**: Better hardware
3. **Connection pooling**: Handle more concurrent connections

### Caching Layer (Future Enhancement)

```
Client → Load Balancer → Server → Redis Cache → Database
```

### Microservices Architecture (Future)

```
API Gateway
├─ User Service
├─ Recipe Service
├─ Review Service
└─ Social Service

All connected to:
- Shared MySQL
- AWS S3
- Message Queue (RabbitMQ/Kafka)
```

### Database Scaling

1. **Read Replicas**: For read-heavy operations
2. **Master-Slave**: For data redundancy
3. **Sharding**: Partition data across multiple databases

---

## Development Workflow

### Local Development

```bash
1. npm install              # Install dependencies
2. npm run dev             # Start with nodemon
3. Make changes            # Edit files
4. Automatic reload        # Nodemon restarts server
5. Test endpoints          # Using Postman/curl
```

### Deployment Workflow

```bash
1. git commit              # Commit changes
2. git push               # Push to remote
3. npm run lint           # Lint code
4. npm test               # Run tests
5. Build process          # Compile if needed
6. Deploy to server       # AWS/Heroku/etc
7. Verify endpoints       # Post-deployment testing
```

---

## Future Enhancements

1. **Email Notifications**: Send welcome, password reset emails
2. **Recipe Ratings**: Advanced rating algorithms
3. **Real-time Updates**: WebSocket for live activity feed
4. **Search Optimization**: Elasticsearch for better search
5. **API Versioning**: /api/v1/, /api/v2/
6. **Caching**: Redis for session and data caching
7. **Rate Limiting**: Prevent API abuse
8. **Payment Processing**: Stripe integration for premium features
9. **Analytics**: Track user behavior and trends
10. **Mobile App API**: Mobile-specific endpoints

---

## Reference Materials

- [Express.js Documentation](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [JWT.io](https://jwt.io/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [REST API Best Practices](https://restfulapi.net/)

---

## Support & Documentation

For more information, refer to:
- [README.md](README.md) - Project overview
- [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) - Complete API reference
- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
