const pool = require('../config/database');

// Initial data to populate
const initialData = {
  categories: [
    { name: 'Appetizers', description: 'Starter dishes' },
    { name: 'Snacks', description: 'Quick bites and evening snacks' },
    { name: 'Main Course', description: 'Main meal dishes' },
    { name: 'Desserts', description: 'Sweet treats' },
    { name: 'Breakfast', description: 'Morning meals' },
    { name: 'Lunch', description: 'Lunch meals' },
    { name: 'Dinner', description: 'Dinner meals' },
    { name: 'Beverages', description: 'Drinks' },
    { name: 'Soups', description: 'Soup dishes' },
    { name: 'Salads', description: 'Salad dishes' },
    { name: 'Baked Goods', description: 'Bread, pastries, etc.' },
  ],
  difficultyLevels: [
    { name: 'Easy', description: 'Easy recipes for beginners' },
    { name: 'Medium', description: 'Medium difficulty recipes' },
    { name: 'Hard', description: 'Challenging recipes' },
  ],
  dietaryPreferences: [
    { name: 'Vegetarian', description: 'No meat' },
    { name: 'Vegan', description: 'No animal products' },
    { name: 'Gluten-Free', description: 'No gluten' },
    { name: 'Dairy-Free', description: 'No dairy products' },
    { name: 'Paleo', description: 'Paleo diet' },
    { name: 'Keto', description: 'Keto diet' },
    { name: 'Organic', description: 'Organic ingredients' },
    { name: 'Non-GMO', description: 'Non-GMO ingredients' },
    { name: 'Low-Carb', description: 'Low carbohydrate' },
    { name: 'Low-Sugar', description: 'Low sugar content' },
  ],
};

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Insert categories
    console.log('Inserting categories...');
    for (const category of initialData.categories) {
      await pool.query(
        'INSERT IGNORE INTO categories (name, description) VALUES ($1, $2)',
        [category.name, category.description]
      );
    }
    console.log(`Inserted ${initialData.categories.length} categories`);

    // Insert difficulty levels
    console.log('Inserting difficulty levels...');
    for (const level of initialData.difficultyLevels) {
      await pool.query(
        'INSERT IGNORE INTO difficulty_levels (name, description) VALUES ($1, $2)',
        [level.name, level.description]
      );
    }
    console.log(`Inserted ${initialData.difficultyLevels.length} difficulty levels`);

    // Insert dietary preferences
    console.log('Inserting dietary preferences...');
    for (const pref of initialData.dietaryPreferences) {
      await pool.query(
        'INSERT IGNORE INTO dietary_preferences (name, description) VALUES ($1, $2)',
        [pref.name, pref.description]
      );
    }
    console.log(`Inserted ${initialData.dietaryPreferences.length} dietary preferences`);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
