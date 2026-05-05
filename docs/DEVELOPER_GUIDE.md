# Developer Guide

## Table of Contents

1. [Code Structure & Patterns](#code-structure--patterns)
2. [Adding a New Feature](#adding-a-new-feature)
3. [Naming Conventions](#naming-conventions)
4. [Common Patterns](#common-patterns)
5. [Debugging](#debugging)
6. [Testing](#testing)
7. [Performance Tips](#performance-tips)
8. [Common Mistakes](#common-mistakes)

---

## Code Structure & Patterns

### MVC Architecture with Services

```
Route → Controller → Service → Database
↑                                    ↓
←———————— Error Handler ←———————————←
```

### Example: Creating a Recipe

**1. Route** (`routes/recipeRoutes.js`):
```javascript
router.post('/', authenticateToken, upload.single('featured_image'), recipeController.createRecipe);
```

**2. Controller** (`controllers/recipeController.js`):
```javascript
async createRecipe(req, res, next) {
  try {
    const { error, value } = recipeCreateSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));
    
    const imageUrl = req.file ? await uploadToS3(req.file) : null;
    const recipe = await recipeService.createRecipe(req.user.id, value, imageUrl);
    
    res.status(201).json({ success: true, data: recipe });
  } catch (error) {
    next(error);
  }
}
```

**3. Service** (`services/recipeService.js`):
```javascript
async createRecipe(userId, recipeData, imageUrl) {
  const result = await pool.query(
    'INSERT INTO recipes (...) VALUES (...)',
    [userId, recipeData.title, ...]
  );
  const recipe = await pool.query('SELECT * FROM recipes WHERE id = $1', [result.insertId]);
  return recipe.rows[0];
}
```

**4. Database**:
- Query executed by service
- Returns data
- Error handling in middleware

---

## Adding a New Feature

### Step-by-Step Guide

#### Step 1: Define the Database Schema

```sql
-- In database/schema.sql
CREATE TABLE new_feature (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  data VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_new_feature_user_id ON new_feature(user_id);
```

#### Step 2: Create Validation Schema

```javascript
// In validators/schemas.js
const newFeatureSchema = Joi.object({
  data: Joi.string().required(),
  // ... other validations
});
```

#### Step 3: Create Service

```javascript
// Create services/newFeatureService.js
class NewFeatureService {
  async create(userId, data) {
    try {
      const result = await pool.query(
        'INSERT INTO new_feature (user_id, data) VALUES ($1, $2)',
        [userId, data]
      );
      const created = await pool.query('SELECT * FROM new_feature WHERE id = $1', [result.insertId]);
      return created.rows[0];
    } catch (error) {
      throw error;
    }
  }
  
  async getByUser(userId) {
    const result = await pool.query(
      'SELECT * FROM new_feature WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  }
}

module.exports = new NewFeatureService();
```

#### Step 4: Create Controller

```javascript
// Create controllers/newFeatureController.js
class NewFeatureController {
  async create(req, res, next) {
    try {
      const { error, value } = newFeatureSchema.validate(req.body);
      if (error) return next(new AppError(error.details[0].message, 400));
      
      const feature = await newFeatureService.create(req.user.id, value.data);
      
      res.status(201).json({
        success: true,
        message: 'Feature created',
        data: feature
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getByUser(req, res, next) {
    try {
      const features = await newFeatureService.getByUser(req.user.id);
      res.status(200).json({ success: true, data: features });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NewFeatureController();
```

#### Step 5: Create Routes

```javascript
// Create routes/newFeatureRoutes.js
const express = require('express');
const router = express.Router();
const newFeatureController = require('../controllers/newFeatureController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, newFeatureController.create);
router.get('/', authenticateToken, newFeatureController.getByUser);

module.exports = router;
```

#### Step 6: Mount Routes

```javascript
// In app.js
const newFeatureRoutes = require('./routes/newFeatureRoutes');
app.use('/api/new-feature', newFeatureRoutes);
```

---

## Naming Conventions

### Files and Directories

```
✅ Correct:
- userController.js
- userRoutes.js
- userService.js
- user_profile_table.sql

❌ Incorrect:
- user-controller.js
- UserController.js
- USERCONTROLLER.js
- userprofile.js
```

### Variables and Functions

```javascript
// Constants (UPPERCASE)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const JWT_EXPIRE = '7d';

// Variables (camelCase)
const userName = 'john';
const isValid = true;
const recipesCount = 10;

// Functions (camelCase)
function getUserProfile(userId) { }
async function createRecipe(data) { }
const uploadFile = async (file) => { };

// Classes (PascalCase)
class UserService { }
class RecipeController { }

// Boolean variables (is/has prefix)
const isAuthenticated = true;
const hasPermission = false;
const isPublished = true;
```

### Database

```sql
-- Table names (lowercase, plural)
users, recipes, reviews, categories

-- Column names (lowercase, snake_case)
user_id, created_at, is_published, first_name

-- Index names (lowercase, descriptive)
idx_recipes_user_id
idx_reviews_recipe_id
idx_follows_follower_id
```

---

## Common Patterns

### Error Handling Pattern

```javascript
async someFunction(id) {
  try {
    // Business logic
    const result = await pool.query('SELECT * FROM table WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      throw new AppError('Resource not found', 404);
    }
    
    return result.rows[0];
  } catch (error) {
    if (error instanceof AppError) throw error;
    // Re-throw for global error handler
    throw error;
  }
}
```

### Pagination Pattern

```javascript
async getRecipes(userId, limit = 10, offset = 0) {
  try {
    const result = await pool.query(
      'SELECT * FROM recipes WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
}

// Usage in controller
const { page = 1, limit = 10 } = req.query;
const offset = (page - 1) * limit;
const recipes = await recipeService.getRecipes(userId, limit, offset);
```

### Many-to-Many Relationship Pattern

```javascript
// Adding dietary preferences to recipe
if (recipeData.dietary_preferences && recipeData.dietary_preferences.length > 0) {
  for (const prefId of recipeData.dietary_preferences) {
    await pool.query(
      'INSERT INTO recipe_dietary_preferences (recipe_id, dietary_preference_id) VALUES ($1, $2)',
      [recipe.id, prefId]
    );
  }
}

// Getting dietary preferences
const result = await pool.query(
  'SELECT dp.id, dp.name FROM dietary_preferences dp INNER JOIN recipe_dietary_preferences rdp ON dp.id = rdp.dietary_preference_id WHERE rdp.recipe_id = $1',
  [recipeId]
);
```

### Validation Pattern

```javascript
// Validate request
async register(req, res, next) {
  try {
    const { error, value } = userRegistrationSchema.validate(req.body);
    
    if (error) {
      return next(new AppError(error.details[0].message, 400));
    }
    
    // Continue with validated data
    const user = await userService.register(value.username, value.email, ...);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}
```

### Middleware Pattern

```javascript
const authenticateToken = (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      return next(new AppError('No token provided', 401));
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return next(new AppError('Invalid token', 403));
      req.user = user;
      next();
    });
  } catch (error) {
    next(error);
  }
};
```

---

## Debugging

### 1. Enable Logging

```javascript
// In your code
console.log('Debug info:', variableName);
console.error('Error:', error.message);

// Use Morgan middleware (already configured)
// GET http://localhost:5000/api/recipes - shows in console
```

### 2. Check Environment Variables

```bash
# View all env variables
echo $DATABASE_URL
echo $JWT_SECRET

# Windows PowerShell
$env:DATABASE_URL
$env:JWT_SECRET
```

### 3. Test Database Connection

```bash
# Login to MySQL
mysql -u root -p recipe_management

# Check tables
\dt

# Run test query
SELECT * FROM users LIMIT 1;
```

### 4. Use Postman for API Testing

1. Set Authorization Bearer token
2. Check response status and body
3. Inspect headers
4. Use Collection Runner for multiple requests

### 5. Check Server Logs

```bash
# Development mode shows all requests
npm run dev

# Look for errors in console output
```

---

## Testing

### Manual Testing

```bash
# Test user registration
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Test authentication
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Unit Testing (Future)

```javascript
// Example Jest test
describe('UserService', () => {
  it('should register a new user', async () => {
    const user = await userService.register('john', 'john@example.com', 'password');
    expect(user.username).toBe('john');
  });
  
  it('should throw error for duplicate email', async () => {
    expect(() => {
      userService.register('jane', 'john@example.com', 'password');
    }).toThrow();
  });
});
```

---

## Performance Tips

### 1. Database Queries

❌ Bad:
```javascript
// N+1 query problem
const users = await pool.query('SELECT * FROM users');
for (const user of users.rows) {
  const recipes = await pool.query('SELECT * FROM recipes WHERE user_id = $1', [user.id]);
}
```

✅ Good:
```javascript
// Single query with JOIN
const result = await pool.query(
  'SELECT u.*, r.* FROM users u LEFT JOIN recipes r ON u.id = r.user_id'
);
```

### 2. Pagination

Always paginate large datasets:
```javascript
// Avoid loading all data
❌ SELECT * FROM recipes;

// Use LIMIT and OFFSET
✅ SELECT * FROM recipes LIMIT 10 OFFSET 0;
```

### 3. Indexes

Use indexes for commonly filtered columns:
```sql
CREATE INDEX idx_recipes_is_published ON recipes(is_published);
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
```

### 4. Response Compression

Already configured with:
```javascript
app.use(compression());
```

---

## Common Mistakes

### ❌ Mistake 1: Hardcoding Secrets

```javascript
❌ const JWT_SECRET = 'my-secret-key-12345';

✅ const JWT_SECRET = process.env.JWT_SECRET;
```

### ❌ Mistake 2: Not Validating Input

```javascript
❌ async createRecipe(req, res) {
  const recipe = await recipeService.create(req.body);
}

✅ async createRecipe(req, res, next) {
  const { error, value } = recipeCreateSchema.validate(req.body);
  if (error) return next(new AppError(error.message, 400));
  
  const recipe = await recipeService.create(req.user.id, value);
}
```

### ❌ Mistake 3: Not Handling Async/Await Errors

```javascript
❌ async function doSomething() {
  const result = await pool.query('SELECT * FROM users'); // No try-catch
}

✅ async function doSomething() {
  try {
    const result = await pool.query('SELECT * FROM users');
    return result.rows;
  } catch (error) {
    throw error;
  }
}
```

### ❌ Mistake 4: Exposing Database Errors to Client

```javascript
❌ res.status(500).json({ error: error.detail }); // Shows database details

✅ res.status(500).json({ 
  success: false, 
  message: 'Internal server error' 
}); // Generic message
```

### ❌ Mistake 5: Not Using Middleware for Auth

```javascript
❌ async someRoute(req, res) {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

✅ router.get('/protected', authenticateToken, someController.method);
```

### ❌ Mistake 6: SQL Injection Vulnerability

```javascript
❌ const query = `SELECT * FROM users WHERE id = ${id}`;
const result = await pool.query(query);

✅ const query = 'SELECT * FROM users WHERE id = $1';
const result = await pool.query(query, [id]);
```

---

## Quick Reference

### File Locations

```
Need to add...        → Create/Edit...
─────────────────────────────────────
New database table    → database/schema.sql
New validation rule   → validators/schemas.js
New business logic    → services/
New HTTP handler      → controllers/
New endpoint          → routes/
New authorization     → middleware/auth.js
New error type        → utils/appError.js
New utility function  → utils/
```

### Key Files to Know

```
app.js                  - Express app entry point
config/database.js        - Database connection
middleware/               - Middleware functions
validators/schemas.js     - Joi validation schemas
services/                 - Business logic
controllers/              - HTTP handlers
routes/                   - API endpoints
```

### Environment Variables

```bash
PORT                   - Server port (5000)
DB_HOST               - Database host
DB_USER               - Database user
DB_PASSWORD           - Database password
JWT_SECRET            - JWT signing key
AWS_ACCESS_KEY_ID     - AWS credentials
AWS_SECRET_ACCESS_KEY - AWS credentials
```

---

## Best Practices Checklist

- [ ] Always validate input with Joi schemas
- [ ] Always use try-catch for async operations
- [ ] Always use parameterized SQL queries
- [ ] Always check user permissions (is owner, is admin)
- [ ] Always handle errors gracefully
- [ ] Always log important operations (in production)
- [ ] Always use environment variables for secrets
- [ ] Always use HTTPS in production
- [ ] Always paginate large datasets
- [ ] Always use database indexes for filtering
- [ ] Always sanitize error messages for clients
- [ ] Always follow naming conventions
- [ ] Always write descriptive commit messages
- [ ] Always test endpoints with Postman
- [ ] Always backup database before major changes

---

*For more information, see the other documentation files in the `docs/` directory.*
