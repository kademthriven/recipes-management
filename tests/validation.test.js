const {
  userRegistrationSchema,
  userLoginSchema,
  recipeCreateSchema,
  reviewSchema,
  searchFilterSchema,
} = require('../validators/schemas');

describe('request validation schemas', () => {
  test('accepts a valid registration payload', () => {
    const { error, value } = userRegistrationSchema.validate({
      username: 'testuser',
      email: 'test@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
      first_name: 'Test',
      last_name: 'User',
    });

    expect(error).toBeUndefined();
    expect(value.email).toBe('test@example.com');
  });

  test('rejects mismatched registration passwords', () => {
    const { error } = userRegistrationSchema.validate({
      username: 'testuser',
      email: 'test@example.com',
      password: 'secret123',
      confirmPassword: 'different123',
    });

    expect(error).toBeDefined();
  });

  test('defaults login role to user', () => {
    const { error, value } = userLoginSchema.validate({
      email: 'test@example.com',
      password: 'secret123',
    });

    expect(error).toBeUndefined();
    expect(value.role).toBe('user');
  });

  test('accepts a complete recipe payload with dietary preferences', () => {
    const { error, value } = recipeCreateSchema.validate({
      title: 'Paneer curry',
      description: 'Weeknight dinner',
      ingredients: 'Paneer, tomatoes, spices',
      instructions: 'Cook everything together.',
      cooking_time: 1200,
      preparation_time: 600,
      food_type: 'veg',
      servings: 4,
      category_id: 1,
      difficulty_level_id: 1,
      dietary_preferences: [1, 2],
    });

    expect(error).toBeUndefined();
    expect(value.dietary_preferences).toEqual([1, 2]);
  });

  test('rejects invalid review ratings', () => {
    const { error } = reviewSchema.validate({
      rating: 6,
      comment: 'Too high',
    });

    expect(error).toBeDefined();
  });

  test('accepts search filters used by recipe listing endpoints', () => {
    const { error, value } = searchFilterSchema.validate({
      search: 'curry',
      food_type: 'veg',
      sort_by: 'rating',
      page: 1,
      limit: 20,
    });

    expect(error).toBeUndefined();
    expect(value.sort_by).toBe('rating');
  });
});
