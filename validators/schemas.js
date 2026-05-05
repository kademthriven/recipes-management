const Joi = require('joi');

// User validation schemas
const userRegistrationSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  first_name: Joi.string().max(100),
  last_name: Joi.string().max(100),
});

const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid('user', 'admin').default('user'),
});

const userProfileUpdateSchema = Joi.object({
  first_name: Joi.string().max(100),
  last_name: Joi.string().max(100),
  bio: Joi.string().max(500),
  username: Joi.string().alphanum().min(3).max(50),
});

// Recipe validation schemas
const recipeCreateSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(1000),
  ingredients: Joi.string().required(),
  instructions: Joi.string().required(),
  cooking_time: Joi.number().integer().min(0),
  preparation_time: Joi.number().integer().min(0),
  food_type: Joi.string().valid('veg', 'non_veg'),
  servings: Joi.number().integer().min(1),
  difficulty_level_id: Joi.number().integer(),
  category_id: Joi.number().integer(),
  dietary_preferences: Joi.array().items(Joi.number().integer()),
  featured_image_url: Joi.string().max(500),
});

const recipeUpdateSchema = Joi.object({
  title: Joi.string().min(3).max(255),
  description: Joi.string().max(1000),
  ingredients: Joi.string(),
  instructions: Joi.string(),
  cooking_time: Joi.number().integer().min(0),
  preparation_time: Joi.number().integer().min(0),
  food_type: Joi.string().valid('veg', 'non_veg'),
  servings: Joi.number().integer().min(1),
  difficulty_level_id: Joi.number().integer(),
  category_id: Joi.number().integer(),
  dietary_preferences: Joi.array().items(Joi.number().integer()),
  featured_image_url: Joi.string().max(500),
});

// Review validation schemas
const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000),
});

// Collection validation schemas
const collectionSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000),
  is_public: Joi.boolean(),
});

// Search and filter schema
const searchFilterSchema = Joi.object({
  search: Joi.string().max(100),
  category_id: Joi.number().integer(),
  difficulty_level_id: Joi.number().integer(),
  food_type: Joi.string().valid('veg', 'non_veg'),
  dietary_preference_id: Joi.number().integer(),
  min_preparation_time: Joi.number().integer().min(0),
  max_preparation_time: Joi.number().integer().min(0),
  sort_by: Joi.string().valid('recent', 'rating', 'popularity'),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
});

module.exports = {
  userRegistrationSchema,
  userLoginSchema,
  userProfileUpdateSchema,
  recipeCreateSchema,
  recipeUpdateSchema,
  reviewSchema,
  collectionSchema,
  searchFilterSchema,
};
