# Recipe Management and Sharing Platform - API Documentation

## Overview

This document provides comprehensive documentation for the Recipe Management and Sharing Platform API. The API is built with Node.js, Express, and MySQL, providing endpoints for users to create, share, and discover recipes.

**Base URL**: `http://localhost:5000/api`

## Table of Contents

1. [Authentication](#authentication)
2. [User Endpoints](#user-endpoints)
3. [Recipe Endpoints](#recipe-endpoints)
4. [Favorite Endpoints](#favorite-endpoints)
5. [Review Endpoints](#review-endpoints)
6. [Social Endpoints](#social-endpoints)
7. [Admin Endpoints](#admin-endpoints)
8. [Error Handling](#error-handling)
9. [Response Format](#response-format)

---

## Authentication

### JWT Token Usage

The API uses JSON Web Tokens (JWT) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Expiration

- Access tokens expire in 7 days (configurable via `JWT_EXPIRE` in `.env`)
- Refresh tokens expire in 30 days (configurable via `JWT_REFRESH_EXPIRE` in `.env`)

---

## User Endpoints

### 1. User Registration

**Endpoint**: `POST /users/register`

**Description**: Register a new user account

**Request Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Rules**:
- Username: 3-50 alphanumeric characters, must be unique
- Email: Valid email format, must be unique
- Password: Minimum 6 characters
- Password confirmation must match password

---

### 2. User Login

**Endpoint**: `POST /users/login`

**Description**: Login to user account

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Get User Profile

**Endpoint**: `GET /users/profile`

**Description**: Retrieve the profile of the authenticated user

**Authentication**: Required (JWT Token)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "bio": "Food enthusiast and home chef",
    "profile_picture_url": "https://s3.amazonaws.com/recipes/profile-1.jpg",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### 4. Update User Profile

**Endpoint**: `PUT /users/profile`

**Description**: Update the profile of the authenticated user

**Authentication**: Required (JWT Token)

**Request Body** (All fields optional):
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "bio": "Passionate about healthy cooking",
  "username": "johnsmith"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "username": "johnsmith",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Smith",
    "bio": "Passionate about healthy cooking",
    "profile_picture_url": "https://s3.amazonaws.com/recipes/profile-1.jpg"
  }
}
```

---

### 5. Change Password

**Endpoint**: `PUT /users/change-password`

**Description**: Change user password

**Authentication**: Required (JWT Token)

**Request Body**:
```json
{
  "old_password": "currentPassword123",
  "new_password": "newPassword123",
  "confirm_password": "newPassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### 6. Update Profile Picture

**Endpoint**: `PUT /users/profile/picture`

**Description**: Upload or replace the authenticated user's profile picture

**Authentication**: Required (JWT Token)

**Request** (Form Data):
- `profile_picture`: Image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "profile_picture_url": "https://s3.amazonaws.com/profiles/profile-1.jpg"
  }
}
```

---

### 7. Get User Recipes

**Endpoints**: `GET /users/recipes`, `GET /users/recipes/:userId`

**Description**: Get recipes created by a specific user or by the authenticated user. The `/users/recipes` form requires authentication.

**Parameters**:
- `userId` (optional): ID of the user. If not provided, returns recipes of authenticated user
- `page` (query, default: 1): Page number
- `limit` (query, default: 10): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Chocolate Cake",
      "description": "Delicious homemade chocolate cake",
      "featured_image_url": "https://s3.amazonaws.com/recipes/cake-1.jpg",
      "created_at": "2024-01-20T15:30:00Z"
    }
  ]
}
```

---

### 8. Get User Favorites

**Endpoints**: `GET /users/favorites`, `GET /users/:userId/favorites`

**Description**: Get favorite recipes of the authenticated user or a specific user

**Authentication**: Required for `/users/favorites`; public for `/users/:userId/favorites`

**Parameters**:
- `userId` (optional): ID of the user whose favorites should be returned
- `page` (query, default: 1): Page number
- `limit` (query, default: 10): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Pasta Carbonara",
      "description": "Classic Italian pasta",
      "featured_image_url": "https://s3.amazonaws.com/recipes/pasta-1.jpg",
      "cooking_time": 30
    }
  ]
}
```

---

## Recipe Endpoints

### 1. Create Recipe

**Endpoint**: `POST /recipes`

**Description**: Create a new recipe

**Authentication**: Required (JWT Token)

**Request** (Form Data):
- `title` (required): Recipe title
- `description`: Short description
- `ingredients` (required): Ingredients list
- `instructions` (required): Cooking instructions
- `cooking_time`: Cooking time in minutes
- `preparation_time`: Preparation time in minutes
- `servings`: Number of servings
- `difficulty_level_id`: Difficulty level ID (1-3)
- `category_id`: Category ID
- `dietary_preferences`: Array of dietary preference IDs
- `featured_image`: Image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Recipe created successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "Chocolate Chip Cookies",
    "description": "Delicious homemade cookies",
    "ingredients": "2 cups flour, 1 cup butter...",
    "instructions": "Preheat oven...",
    "cooking_time": 12,
    "preparation_time": 15,
    "servings": 24,
    "difficulty_level_id": 1,
    "category_id": 2,
    "featured_image_url": "https://s3.amazonaws.com/recipes/cookies-1.jpg",
    "is_published": true,
    "view_count": 0,
    "created_at": "2024-01-20T15:30:00Z"
  }
}
```

**Validation Rules**:
- Title: 3-255 characters (required)
- Description: Max 1000 characters
- Ingredients: Required
- Instructions: Required
- Cooking time: Non-negative integer
- Preparation time: Non-negative integer
- Servings: Positive integer

---

### 2. Get Recipe

**Endpoint**: `GET /recipes/:id`

**Description**: Get detailed information about a specific recipe

**Parameters**:
- `id` (required): Recipe ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "Chocolate Chip Cookies",
    "description": "Delicious homemade cookies",
    "ingredients": "2 cups flour, 1 cup butter...",
    "instructions": "Preheat oven...",
    "cooking_time": 12,
    "preparation_time": 15,
    "servings": 24,
    "difficulty_name": "Easy",
    "category_name": "Desserts",
    "featured_image_url": "https://s3.amazonaws.com/recipes/cookies-1.jpg",
    "view_count": 150,
    "username": "johndoe",
    "dietary_preferences": [
      { "id": 1, "name": "Vegetarian" }
    ],
    "images": [
      { "id": 1, "image_url": "https://s3.amazonaws.com/recipes/image-1.jpg" }
    ],
    "recent_reviews": [
      {
        "id": 1,
        "rating": 5,
        "comment": "Amazing recipe!",
        "user_id": 2,
        "created_at": "2024-01-21T10:00:00Z"
      }
    ],
    "created_at": "2024-01-20T15:30:00Z"
  }
}
```

---

### 3. Update Recipe

**Endpoint**: `PUT /recipes/:id`

**Description**: Update an existing recipe (only the creator can update)

**Authentication**: Required (JWT Token)

**Parameters**:
- `id` (required): Recipe ID

**Request Body** (All fields optional):
```json
{
  "title": "Updated Recipe Title",
  "description": "Updated description",
  "ingredients": "Updated ingredients",
  "instructions": "Updated instructions",
  "cooking_time": 20,
  "preparation_time": 10,
  "servings": 8,
  "difficulty_level_id": 2,
  "category_id": 3,
  "dietary_preferences": [1, 2]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Recipe updated successfully",
  "data": {
    "id": 1,
    "title": "Updated Recipe Title",
    "description": "Updated description",
    "updated_at": "2024-01-21T12:00:00Z"
  }
}
```

---

### 4. Delete Recipe

**Endpoint**: `DELETE /recipes/:id`

**Description**: Delete a recipe (only the creator can delete)

**Authentication**: Required (JWT Token)

**Parameters**:
- `id` (required): Recipe ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Recipe deleted successfully"
}
```

---

### 5. Browse and Search Recipes

**Endpoints**: `GET /recipes`, `GET /recipes/search`

**Description**: Browse all published recipes or search with filtering options. Use `GET /recipes` with no filters to browse the catalog.

**Query Parameters**:
- `search` (optional): Search keyword matched against recipe title, description, and ingredients
- `category_id` (optional): Filter by category ID
- `difficulty_level_id` (optional): Filter by difficulty level
- `dietary_preference_id` (optional): Filter by dietary preference
- `min_preparation_time` (optional): Filter to recipes with at least this many preparation minutes
- `max_preparation_time` (optional): Filter to recipes with no more than this many preparation minutes
- `sort_by` (optional): Sort option ('recent', 'rating', 'popularity')
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Example Request**:
```
GET /recipes?page=1&limit=10
GET /recipes/search?search=chocolate&difficulty_level_id=1&max_preparation_time=30&sort_by=rating&page=1&limit=10
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Chocolate Chip Cookies",
      "description": "Delicious homemade cookies",
      "featured_image_url": "https://s3.amazonaws.com/recipes/cookies-1.jpg",
      "cooking_time": 12,
      "preparation_time": 15,
      "username": "johndoe",
      "average_rating": 4.5
    }
  ]
}
```

---

### 6. Get Trending Recipes

**Endpoint**: `GET /recipes/trending`

**Description**: Get most viewed/popular recipes

**Query Parameters**:
- `limit` (optional, default: 10): Number of recipes to return

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Popular Recipe",
      "description": "Very popular recipe",
      "featured_image_url": "https://s3.amazonaws.com/recipes/popular-1.jpg",
      "view_count": 5000,
      "username": "johndoe"
    }
  ]
}
```

---

### 7. Get Recipes by Category

**Endpoint**: `GET /recipes/category/:categoryId`

**Description**: Get all recipes in a specific category

**Parameters**:
- `categoryId` (required): Category ID

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Chocolate Cake",
      "description": "Delicious chocolate cake",
      "featured_image_url": "https://s3.amazonaws.com/recipes/cake-1.jpg"
    }
  ]
}
```

---

### 8. Add Recipe Image

**Endpoint**: `POST /recipes/:recipeId/images`

**Description**: Add additional images to a recipe

**Authentication**: Required (JWT Token)

**Parameters**:
- `recipeId` (required): Recipe ID

**Request** (Form Data):
- `image`: Image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Image added successfully",
  "data": {
    "id": 1,
    "image_url": "https://s3.amazonaws.com/recipes/image-1.jpg"
  }
}
```

---

## Favorite Endpoints

### 1. Add Recipe to Favorites

**Endpoint**: `POST /favorites/:recipeId`

**Description**: Add a recipe to user's favorites

**Authentication**: Required (JWT Token)

**Parameters**:
- `recipeId` (required): Recipe ID

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Recipe added to favorites",
  "data": {
    "id": 1,
    "user_id": 1,
    "recipe_id": 1,
    "created_at": "2024-01-21T12:00:00Z"
  }
}
```

---

### 2. Remove Recipe from Favorites

**Endpoint**: `DELETE /favorites/:recipeId`

**Description**: Remove a recipe from user's favorites

**Authentication**: Required (JWT Token)

**Parameters**:
- `recipeId` (required): Recipe ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Recipe removed from favorites"
}
```

---

### 3. Check if Recipe is Favorite

**Endpoint**: `GET /favorites/check/:recipeId`

**Description**: Check if a recipe is in user's favorites

**Authentication**: Required (JWT Token)

**Parameters**:
- `recipeId` (required): Recipe ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "is_favorite": true
  }
}
```

---

### 4. Get User Favorites

**Endpoint**: `GET /favorites`

**Description**: Get all favorite recipes of authenticated user

**Authentication**: Required (JWT Token)

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Pasta Carbonara",
      "description": "Classic Italian pasta",
      "featured_image_url": "https://s3.amazonaws.com/recipes/pasta-1.jpg",
      "cooking_time": 30,
      "created_at": "2024-01-21T12:00:00Z"
    }
  ]
}
```

---

### 5. Create Collection

**Endpoint**: `POST /favorites/collections`

**Description**: Create a new collection for organizing recipes

**Authentication**: Required (JWT Token)

**Request Body**:
```json
{
  "name": "Desserts",
  "description": "My favorite dessert recipes",
  "is_public": false
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Collection created successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "name": "Desserts",
    "description": "My favorite dessert recipes",
    "is_public": false,
    "created_at": "2024-01-21T12:00:00Z"
  }
}
```

---

### 6. Update Collection

**Endpoint**: `PUT /favorites/collections/:collectionId`

**Description**: Update an existing collection

**Authentication**: Required (JWT Token)

**Parameters**:
- `collectionId` (required): Collection ID

**Request Body** (All fields optional):
```json
{
  "name": "Updated Collection Name",
  "description": "Updated description",
  "is_public": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Collection updated successfully",
  "data": {
    "id": 1,
    "name": "Updated Collection Name",
    "description": "Updated description",
    "is_public": true,
    "updated_at": "2024-01-21T12:00:00Z"
  }
}
```

---

### 7. Delete Collection

**Endpoint**: `DELETE /favorites/collections/:collectionId`

**Description**: Delete a collection

**Authentication**: Required (JWT Token)

**Parameters**:
- `collectionId` (required): Collection ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Collection deleted successfully"
}
```

---

### 8. Get Collections

**Endpoint**: `GET /favorites/collections`

**Description**: Get all collections of authenticated user

**Authentication**: Required (JWT Token)

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Desserts",
      "description": "My favorite dessert recipes",
      "is_public": false,
      "recipe_count": 5,
      "created_at": "2024-01-21T12:00:00Z"
    }
  ]
}
```

---

### 9. Get Collection Recipes

**Endpoint**: `GET /favorites/collections/:collectionId/recipes`

**Description**: Get all recipes in a collection

**Parameters**:
- `collectionId` (required): Collection ID

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Chocolate Cake",
      "description": "Delicious chocolate cake",
      "featured_image_url": "https://s3.amazonaws.com/recipes/cake-1.jpg"
    }
  ]
}
```

---

### 10. Add Recipe to Collection

**Endpoint**: `POST /favorites/collections/:collectionId/recipes/:recipeId`

**Description**: Add a recipe to a collection

**Authentication**: Required (JWT Token)

**Parameters**:
- `collectionId` (required): Collection ID
- `recipeId` (required): Recipe ID

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Recipe added to collection",
  "data": {
    "id": 1,
    "collection_id": 1,
    "recipe_id": 1,
    "created_at": "2024-01-21T12:00:00Z"
  }
}
```

---

### 11. Remove Recipe from Collection

**Endpoint**: `DELETE /favorites/collections/:collectionId/recipes/:recipeId`

**Description**: Remove a recipe from a collection

**Authentication**: Required (JWT Token)

**Parameters**:
- `collectionId` (required): Collection ID
- `recipeId` (required): Recipe ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Recipe removed from collection"
}
```

---

## Review Endpoints

### 1. Create Review

**Endpoint**: `POST /reviews/:recipeId`

**Description**: Create a review for a recipe

**Authentication**: Required (JWT Token)

**Parameters**:
- `recipeId` (required): Recipe ID

**Request Body**:
```json
{
  "rating": 5,
  "comment": "This recipe was amazing! Highly recommend."
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "id": 1,
    "recipe_id": 1,
    "user_id": 1,
    "rating": 5,
    "comment": "This recipe was amazing! Highly recommend.",
    "created_at": "2024-01-21T12:00:00Z"
  }
}
```

**Validation Rules**:
- Rating: 1-5 (required)
- Comment: Max 1000 characters

---

### 2. Delete Review

**Endpoint**: `DELETE /reviews/:reviewId`

**Description**: Delete a review (only the creator can delete)

**Authentication**: Required (JWT Token)

**Parameters**:
- `reviewId` (required): Review ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

### 3. Get Recipe Reviews

**Endpoint**: `GET /reviews/recipe/:recipeId`

**Description**: Get all reviews for a specific recipe

**Parameters**:
- `recipeId` (required): Recipe ID

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Amazing recipe!",
      "user_id": 1,
      "username": "johndoe",
      "profile_picture_url": "https://s3.amazonaws.com/profiles/user-1.jpg",
      "created_at": "2024-01-21T10:00:00Z"
    }
  ]
}
```

---

### 4. Get Recipe Stats

**Endpoint**: `GET /reviews/recipe/:recipeId/stats`

**Description**: Get statistics for a recipe (ratings summary)

**Parameters**:
- `recipeId` (required): Recipe ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total_reviews": 50,
    "average_rating": 4.6,
    "five_star": 35,
    "four_star": 10,
    "three_star": 4,
    "two_star": 1,
    "one_star": 0
  }
}
```

---

### 5. Get User Reviews

**Endpoint**: `GET /reviews/user/reviews`

**Description**: Get all reviews by authenticated user

**Authentication**: Required (JWT Token)

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Excellent recipe",
      "recipe_id": 1,
      "recipe_title": "Chocolate Cake",
      "featured_image_url": "https://s3.amazonaws.com/recipes/cake-1.jpg",
      "created_at": "2024-01-21T10:00:00Z"
    }
  ]
}
```

---

## Social Endpoints

### 1. Follow User

**Endpoint**: `POST /social/follow/:userId`

**Description**: Follow another user

**Authentication**: Required (JWT Token)

**Parameters**:
- `userId` (required): ID of user to follow

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User followed successfully",
  "data": {
    "id": 1,
    "follower_id": 1,
    "following_id": 2,
    "created_at": "2024-01-21T12:00:00Z"
  }
}
```

---

### 2. Unfollow User

**Endpoint**: `DELETE /social/follow/:userId`

**Description**: Unfollow a user

**Authentication**: Required (JWT Token)

**Parameters**:
- `userId` (required): ID of user to unfollow

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User unfollowed successfully"
}
```

---

### 3. Check if Following

**Endpoint**: `GET /social/follow/:userId/status`

**Description**: Check if authenticated user is following another user

**Authentication**: Required (JWT Token)

**Parameters**:
- `userId` (required): ID of user to check

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "is_following": true
  }
}
```

---

### 4. Get User Followers

**Endpoint**: `GET /social/:userId/followers`

**Description**: Get list of followers for a user

**Parameters**:
- `userId` (required): User ID

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "johndoe",
      "profile_picture_url": "https://s3.amazonaws.com/profiles/user-1.jpg",
      "bio": "Food enthusiast"
    }
  ]
}
```

---

### 5. Get User Following

**Endpoint**: `GET /social/:userId/following`

**Description**: Get list of users that a user is following

**Parameters**:
- `userId` (required): User ID

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "username": "janedoe",
      "profile_picture_url": "https://s3.amazonaws.com/profiles/user-2.jpg",
      "bio": "Home chef"
    }
  ]
}
```

---

### 6. Get Follow Stats

**Endpoint**: `GET /social/:userId/stats`

**Description**: Get follower and following statistics for a user

**Parameters**:
- `userId` (required): User ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "followers": 150,
    "following": 45
  }
}
```

---

### 7. Get Activity Feed

**Endpoint**: `GET /social/feed/activities`

**Description**: Get activity feed from followed users

**Authentication**: Required (JWT Token)

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "activity_type": "recipe_created",
      "user_id": 1,
      "username": "johndoe",
      "profile_picture_url": "https://s3.amazonaws.com/profiles/user-1.jpg",
      "recipe_id": 1,
      "recipe_title": "Chocolate Cake",
      "featured_image_url": "https://s3.amazonaws.com/recipes/cake-1.jpg",
      "created_at": "2024-01-21T12:00:00Z"
    }
  ]
}
```

**Activity Types**:
- `recipe_created`: Followed user created a new recipe
- `recipe_reviewed`: Followed user rated or reviewed a recipe
- `recipe_favorited`: Followed user saved a recipe as a favorite

---

## Admin Endpoints

Admin routes require a JWT whose payload includes `is_admin: true`. Create an initial admin by setting `is_admin = 1` for a trusted user directly in the database, then log in again to receive an admin token.

### 1. Get All Users

**Endpoint**: `GET /admin/users`

**Description**: Get list of all users (Admin only)

**Authentication**: Required (JWT Token with admin privileges)

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_verified": true,
      "is_banned": false,
      "created_at": "2024-01-20T10:00:00Z"
    }
  ]
}
```

---

### 2. Get User Statistics

**Endpoint**: `GET /admin/users/stats`

**Description**: Get user statistics (Admin only)

**Authentication**: Required (JWT Token with admin privileges)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total_users": 1000,
    "verified_users": 850,
    "banned_users": 15
  }
}
```

---

### 3. Ban User

**Endpoint**: `POST /admin/users/:userId/ban`

**Description**: Ban a user account (Admin only)

**Authentication**: Required (JWT Token with admin privileges)

**Parameters**:
- `userId` (required): User ID to ban

**Request Body** (optional):
```json
{
  "reason": "Inappropriate content"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User banned successfully",
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "is_banned": true
  }
}
```

---

### 4. Unban User

**Endpoint**: `POST /admin/users/:userId/unban`

**Description**: Unban a user account (Admin only)

**Authentication**: Required (JWT Token with admin privileges)

**Parameters**:
- `userId` (required): User ID to unban

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User unbanned successfully",
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "is_banned": false
  }
}
```

---

### 5. Verify User

**Endpoint**: `POST /admin/users/:userId/verify`

**Description**: Verify a user account (Admin only)

**Authentication**: Required (JWT Token with admin privileges)

**Parameters**:
- `userId` (required): User ID to verify

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User verified successfully",
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "is_verified": true
  }
}
```

---

### 6. Get All Recipes

**Endpoint**: `GET /admin/recipes`

**Description**: Get list of all recipes (Admin only)

**Authentication**: Required (JWT Token with admin privileges)

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Chocolate Cake",
      "user_id": 1,
      "username": "johndoe",
      "is_published": true,
      "review_count": 25,
      "created_at": "2024-01-20T10:00:00Z"
    }
  ]
}
```

---

### 7. Get Recipe Statistics

**Endpoint**: `GET /admin/recipes/stats`

**Description**: Get recipe statistics (Admin only)

**Authentication**: Required (JWT Token with admin privileges)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total_recipes": 500,
    "published_recipes": 480,
    "avg_views": 250
  }
}
```

---

### 8. Delete Recipe (Admin)

**Endpoint**: `DELETE /admin/recipes/:recipeId`

**Description**: Delete a recipe (Admin only)

**Authentication**: Required (JWT Token with admin privileges)

**Parameters**:
- `recipeId` (required): Recipe ID to delete

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Recipe deleted successfully"
}
```

---

### 9. Publish Recipe

**Endpoint**: `POST /admin/recipes/:recipeId/publish`

**Description**: Publish a recipe (Admin only)

**Authentication**: Required (JWT Token with admin privileges)

**Parameters**:
- `recipeId` (required): Recipe ID to publish

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Recipe published successfully",
  "data": {
    "id": 1,
    "title": "Chocolate Cake",
    "is_published": true
  }
}
```

---

### 10. Unpublish Recipe

**Endpoint**: `POST /admin/recipes/:recipeId/unpublish`

**Description**: Unpublish a recipe (Admin only)

**Authentication**: Required (JWT Token with admin privileges)

**Parameters**:
- `recipeId` (required): Recipe ID to unpublish

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Recipe unpublished successfully",
  "data": {
    "id": 1,
    "title": "Chocolate Cake",
    "is_published": false
  }
}
```

---

### 11. Create Category

**Endpoint**: `POST /admin/categories`

**Description**: Create a recipe category (Admin only)

**Authentication**: Required (JWT Token with admin privileges)

**Request Body**:
```json
{
  "name": "Desserts",
  "description": "All dessert recipes"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": 1,
    "name": "Desserts",
    "description": "All dessert recipes",
    "created_at": "2024-01-21T12:00:00Z"
  }
}
```

---

### 12. Create Difficulty Level

**Endpoint**: `POST /admin/difficulty-levels`

**Description**: Create a difficulty level (Admin only)

**Authentication**: Required (JWT Token with admin privileges)

**Request Body**:
```json
{
  "name": "Easy",
  "description": "Easy recipes for beginners"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Difficulty level created successfully",
  "data": {
    "id": 1,
    "name": "Easy",
    "description": "Easy recipes for beginners",
    "created_at": "2024-01-21T12:00:00Z"
  }
}
```

---

### 13. Create Dietary Preference

**Endpoint**: `POST /admin/dietary-preferences`

**Description**: Create a dietary preference (Admin only)

**Authentication**: Required (JWT Token with admin privileges)

**Request Body**:
```json
{
  "name": "Vegetarian",
  "description": "Recipes without meat"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Dietary preference created successfully",
  "data": {
    "id": 1,
    "name": "Vegetarian",
    "description": "Recipes without meat",
    "created_at": "2024-01-21T12:00:00Z"
  }
}
```

---

### 14. Get Platform Statistics

**Endpoint**: `GET /admin/stats`

**Description**: Get overall platform statistics (Admin only)

**Authentication**: Required (JWT Token with admin privileges)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "users": {
      "total_users": 1000,
      "verified_users": 850,
      "banned_users": 15
    },
    "recipes": {
      "total_recipes": 500,
      "published_recipes": 480,
      "avg_views": 250
    },
    "reviews": {
      "total_reviews": 2500,
      "avg_rating": 4.3
    },
    "favorites": {
      "total_favorites": 5000
    }
  }
}
```

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "stack": "Full stack trace (only in development mode)"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request parameters |
| 401 | Unauthorized - Authentication token missing or invalid |
| 403 | Forbidden - User doesn't have permission to access resource |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists (e.g., duplicate email) |
| 500 | Internal Server Error - Server error |

### Common Error Scenarios

**Invalid Credentials**:
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Missing Authentication**:
```json
{
  "success": false,
  "message": "No token provided"
}
```

**Insufficient Permissions**:
```json
{
  "success": false,
  "message": "You do not have permission to update this recipe"
}
```

**Validation Error**:
```json
{
  "success": false,
  "message": "Password must be at least 6 characters"
}
```

---

## Response Format

All API responses include a consistent format:

```json
{
  "success": true/false,
  "message": "Optional message",
  "data": { }
}
```

- `success`: Boolean indicating if the request was successful
- `message`: Optional message providing additional information
- `data`: The actual response data (present in successful responses)

---

## Authentication Flow

1. User registers via `/api/users/register`
2. System returns JWT token
3. User includes token in `Authorization: Bearer <token>` header for protected endpoints
4. Token expires after 7 days (configurable)
5. User must register/login again to get a new token

---

## Pagination

Endpoints that return lists support pagination using `page` and `limit` query parameters:

```
GET /api/recipes/search?page=1&limit=10
```

- `page`: Current page number (1-indexed, default: 1)
- `limit`: Number of items per page (default: 10, max: 100)

---

## Rate Limiting

(To be implemented) - API will include rate limiting to prevent abuse:
- 100 requests per 15 minutes for authenticated users
- 20 requests per 15 minutes for unauthenticated users

---

## File Upload

### Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### Upload Limits
- Maximum file size: 5MB
- Images stored on AWS S3

---

## Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securePassword123",
    "confirmPassword": "securePassword123",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Login
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'

# Get Profile (requires token)
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import the API endpoints into Postman
2. Create an environment with `token` variable
3. After login, save the token: `pm.environment.set("token", pm.response.json().data.token)`
4. Use `{{token}}` in Authorization header for protected endpoints

---

## Best Practices

1. **Always use HTTPS** in production
2. **Never expose JWT secrets** in client-side code
3. **Validate all inputs** before processing
4. **Use pagination** for large datasets
5. **Handle errors gracefully** with appropriate HTTP status codes
6. **Rate limit** sensitive endpoints
7. **Log all API calls** for debugging and monitoring
8. **Keep tokens secure** and use appropriate expiration times
9. **Use environment variables** for sensitive configuration
10. **Test all endpoints** thoroughly before deployment

---

## Contact & Support

For issues or questions regarding the API, please contact the development team or create an issue on GitHub.
