# Backend and Database Notes

## Sequelize Basics

The project uses Sequelize as the SQL ORM layer in `config/sequelize.js` and `models/index.js`.

- `config/sequelize.js` creates the MySQL Sequelize connection from the existing environment config.
- `models/index.js` defines the application tables as Sequelize models.
- `config/database.js` keeps the old `pool.query(sql, values)` interface, but now executes raw SQL through `sequelize.query`.

## Model Associations

Main relationships:

- `User.hasMany(Recipe)` and `Recipe.belongsTo(User)`
- `Category.hasMany(Recipe)` and `DifficultyLevel.hasMany(Recipe)`
- `Recipe.belongsToMany(DietaryPreference)` through `recipe_dietary_preferences`
- `User.belongsToMany(Recipe)` through `favorites`
- `Collection.belongsToMany(Recipe)` through `collection_recipes`
- `Recipe.hasMany(Review)` and `User.hasMany(Review)`
- `User.belongsToMany(User)` through `follows` for followers/following
- `ActivityFeed.belongsTo(User)` for both recipient and actor, plus optional `Recipe`

## Transactions Used in the Project

Transactions are used where one API action changes multiple related tables and should either fully succeed or fully roll back:

- `RecipeService.createRecipe`
  Creates the recipe, inserts dietary preferences, and writes follower activity in one transaction.
- `RecipeService.updateRecipe`
  Updates recipe fields and replaces dietary preferences atomically.
- `FavoriteService.addFavorite`
  Creates the favorite and follower activity atomically.
- `ReviewService.createReview`
  Creates or updates a review and writes follower activity atomically.

## Raw SQL with Sequelize

The app still uses raw SQL for read-heavy and reporting-style queries where SQL is clearer than ORM includes:

- Recipe search with `JOIN`, `GROUP BY`, `AVG`, and dynamic filters.
- Admin recipe lists with review counts.
- Review statistics with aggregate functions.
- User/follow/favorite list queries.

These calls go through `config/database.js`, which normalizes `$1` placeholders and executes the SQL with `sequelize.query`.

## Database Design

Core tables:

- `users`: account profile, password hash, admin/verification/ban flags.
- `recipes`: recipe content, owner, category, difficulty, visibility, view count.
- `categories`, `difficulty_levels`, `dietary_preferences`: recipe lookup/reference data.
- `recipe_dietary_preferences`: many-to-many recipe dietary tags.
- `recipe_images`: extra images attached to recipes.
- `favorites`: saved recipes per user.
- `collections` and `collection_recipes`: user-created recipe collections.
- `reviews`: one review per user per recipe.
- `follows`: user-to-user following.
- `activity_feed`: follower feed events.

The schema is in `database/schema.sql`; the Sequelize model definitions mirror that schema without calling `sync`, so migrations/schema setup stay explicit.
