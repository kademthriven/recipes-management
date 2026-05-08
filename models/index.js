const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const baseOptions = tableName => ({
  tableName,
  timestamps: false,
  freezeTableName: true,
});

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  first_name: DataTypes.STRING(100),
  last_name: DataTypes.STRING(100),
  bio: DataTypes.TEXT,
  profile_picture_url: DataTypes.STRING(500),
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_admin: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_banned: { type: DataTypes.BOOLEAN, defaultValue: false },
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, baseOptions('users'));

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: DataTypes.TEXT,
  created_at: DataTypes.DATE,
}, baseOptions('categories'));

const DietaryPreference = sequelize.define('DietaryPreference', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: DataTypes.TEXT,
  created_at: DataTypes.DATE,
}, baseOptions('dietary_preferences'));

const DifficultyLevel = sequelize.define('DifficultyLevel', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  description: DataTypes.TEXT,
  created_at: DataTypes.DATE,
}, baseOptions('difficulty_levels'));

const Recipe = sequelize.define('Recipe', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: DataTypes.TEXT,
  ingredients: { type: DataTypes.TEXT, allowNull: false },
  instructions: { type: DataTypes.TEXT, allowNull: false },
  cooking_time: DataTypes.INTEGER,
  preparation_time: DataTypes.INTEGER,
  food_type: { type: DataTypes.ENUM('veg', 'non_veg'), defaultValue: 'veg' },
  servings: DataTypes.INTEGER,
  difficulty_level_id: DataTypes.INTEGER,
  category_id: DataTypes.INTEGER,
  featured_image_url: DataTypes.STRING(500),
  is_published: { type: DataTypes.BOOLEAN, defaultValue: false },
  view_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, baseOptions('recipes'));

const RecipeDietaryPreference = sequelize.define('RecipeDietaryPreference', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  recipe_id: { type: DataTypes.INTEGER, allowNull: false },
  dietary_preference_id: { type: DataTypes.INTEGER, allowNull: false },
  created_at: DataTypes.DATE,
}, baseOptions('recipe_dietary_preferences'));

const RecipeImage = sequelize.define('RecipeImage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  recipe_id: { type: DataTypes.INTEGER, allowNull: false },
  image_url: { type: DataTypes.STRING(500), allowNull: false },
  created_at: DataTypes.DATE,
}, baseOptions('recipe_images'));

const Favorite = sequelize.define('Favorite', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  recipe_id: { type: DataTypes.INTEGER, allowNull: false },
  created_at: DataTypes.DATE,
}, baseOptions('favorites'));

const Collection = sequelize.define('Collection', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  description: DataTypes.TEXT,
  is_public: { type: DataTypes.BOOLEAN, defaultValue: false },
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, baseOptions('collections'));

const CollectionRecipe = sequelize.define('CollectionRecipe', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  collection_id: { type: DataTypes.INTEGER, allowNull: false },
  recipe_id: { type: DataTypes.INTEGER, allowNull: false },
  created_at: DataTypes.DATE,
}, baseOptions('collection_recipes'));

const Review = sequelize.define('Review', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  recipe_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: DataTypes.TEXT,
  is_verified_purchase: { type: DataTypes.BOOLEAN, defaultValue: false },
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, baseOptions('reviews'));

const Follow = sequelize.define('Follow', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  follower_id: { type: DataTypes.INTEGER, allowNull: false },
  following_id: { type: DataTypes.INTEGER, allowNull: false },
  created_at: DataTypes.DATE,
}, baseOptions('follows'));

const ActivityFeed = sequelize.define('ActivityFeed', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  actor_id: { type: DataTypes.INTEGER, allowNull: false },
  activity_type: { type: DataTypes.STRING(50), allowNull: false },
  recipe_id: DataTypes.INTEGER,
  created_at: DataTypes.DATE,
}, baseOptions('activity_feed'));

User.hasMany(Recipe, { foreignKey: 'user_id', as: 'recipes' });
Recipe.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

Category.hasMany(Recipe, { foreignKey: 'category_id', as: 'recipes' });
Recipe.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
DifficultyLevel.hasMany(Recipe, { foreignKey: 'difficulty_level_id', as: 'recipes' });
Recipe.belongsTo(DifficultyLevel, { foreignKey: 'difficulty_level_id', as: 'difficulty_level' });

Recipe.belongsToMany(DietaryPreference, {
  through: RecipeDietaryPreference,
  foreignKey: 'recipe_id',
  otherKey: 'dietary_preference_id',
  as: 'dietary_preferences',
});
DietaryPreference.belongsToMany(Recipe, {
  through: RecipeDietaryPreference,
  foreignKey: 'dietary_preference_id',
  otherKey: 'recipe_id',
  as: 'recipes',
});

Recipe.hasMany(RecipeImage, { foreignKey: 'recipe_id', as: 'images' });
RecipeImage.belongsTo(Recipe, { foreignKey: 'recipe_id', as: 'recipe' });

User.belongsToMany(Recipe, {
  through: Favorite,
  foreignKey: 'user_id',
  otherKey: 'recipe_id',
  as: 'favorite_recipes',
});
Recipe.belongsToMany(User, {
  through: Favorite,
  foreignKey: 'recipe_id',
  otherKey: 'user_id',
  as: 'favorited_by',
});

User.hasMany(Collection, { foreignKey: 'user_id', as: 'collections' });
Collection.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
Collection.belongsToMany(Recipe, {
  through: CollectionRecipe,
  foreignKey: 'collection_id',
  otherKey: 'recipe_id',
  as: 'recipes',
});
Recipe.belongsToMany(Collection, {
  through: CollectionRecipe,
  foreignKey: 'recipe_id',
  otherKey: 'collection_id',
  as: 'collections',
});

Recipe.hasMany(Review, { foreignKey: 'recipe_id', as: 'reviews' });
Review.belongsTo(Recipe, { foreignKey: 'recipe_id', as: 'recipe' });
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.belongsToMany(User, {
  through: Follow,
  as: 'following',
  foreignKey: 'follower_id',
  otherKey: 'following_id',
});
User.belongsToMany(User, {
  through: Follow,
  as: 'followers',
  foreignKey: 'following_id',
  otherKey: 'follower_id',
});

ActivityFeed.belongsTo(User, { foreignKey: 'user_id', as: 'recipient' });
ActivityFeed.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' });
ActivityFeed.belongsTo(Recipe, { foreignKey: 'recipe_id', as: 'recipe' });

module.exports = {
  sequelize,
  User,
  Category,
  DietaryPreference,
  DifficultyLevel,
  Recipe,
  RecipeDietaryPreference,
  RecipeImage,
  Favorite,
  Collection,
  CollectionRecipe,
  Review,
  Follow,
  ActivityFeed,
};
