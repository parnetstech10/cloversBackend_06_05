import Menu from '../models/menuModel.js'; // Ensure this path matches your project structure

export const getCategoryMapping = async () => {
  try {
    const menu = await Menu.find(); // Fetch all menu categories
    const mapping = {};

    menu.forEach((category) => {
      category.subCategories.forEach((subCategory) => {
        subCategory.items.forEach((item) => {
          mapping[item.name] = category.category.toLowerCase(); // Map item name to its category
        });
      });
    });

    return mapping;
  } catch (err) {
    console.error('Error fetching category mapping:', err);
    throw new Error('Failed to fetch category mapping');
  }
};
