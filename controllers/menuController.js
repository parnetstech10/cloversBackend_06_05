import Menu from "../models/menuModel.js";

// GET /api/menu
export const getMenu = async (req, res) => {
  try {
    const menu = await Menu.find({});
    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// POST /api/menu
export const addMenuCategory = async (req, res) => {
  const { categoryName } = req.body;
  if (!categoryName) {
    return res.status(400).json({ message: "Category name is required" });
  }
  try {
    const existingCategory = await Menu.findOne({ category: categoryName });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = new Menu({ category: categoryName, subCategories: [] });
    const saved = await newCategory.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

//fetch category

export const getCategory = async (req, res) => {
  try {
    const category = await Menu.find({});
    if (!category) {
      return res.status(400).json({ message: "Category not found" });
    }
    return res.status(200).json({
      message: "Category is fetched successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const editCategory = async (req, res) => {
  try {
    const { categoryName, id } = req.body; // Assuming category name is passed in the request body

    const category = await Menu.findById(id);
    if (!category) {
      return res.status(400).json({ message: "Category not found" });
    }

    category.category = categoryName;
    await category.save();

    return res.status(200).json({
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const deleteCategory = await Menu.findByIdAndDelete(id);
    if (!deleteCategory) {
      return res.status(400).json({ message: "Category not found" });
    }
    return res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const editSubCategory = async (req, res) => {
  try {
    const { name, id, subCategoryId } = req.body; // Assuming subcategory id is passed in the request body

    const menu = await Menu.findById(id);
    if (!menu) {
      return res.status(400).json({ message: "Menu not found" });
    }

    const subCategory = menu.subCategories.id(subCategoryId);
    if (!subCategory) {
      return res.status(400).json({ message: "Sub Category not found" });
    }

    subCategory.name = name;
    await menu.save();

    return res.status(200).json({
      message: "Category updated successfully",
      data: subCategory,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// POST /api/menu/:categoryId/subcategory
export const addSubCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { subCategoryName } = req.body;
  
  if (!subCategoryName) {
    return res.status(400).json({ message: "Subcategory name is required" });
  }

  try {
    const menu = await Menu.findById(categoryId);
    if (!menu) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check for duplicate subcategory
    if (
      menu.subCategories.some(
        (subCat) => subCat.name.toLowerCase() === subCategoryName.toLowerCase()
      )
    ) {
      return res.status(400).json({ message: "Subcategory already exists" });
    }

    // Add new subcategory
    const newSubCategory = {
      name: subCategoryName,
      items: [],
    };
    menu.subCategories.push(newSubCategory);
    const updatedMenu = await menu.save();

    res.status(200).json(updatedMenu);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// POST /api/menu/:categoryId/subcategory/:subCategoryId/item
export const addItem = async (req, res) => {
  const { categoryId, subCategoryId } = req.params;


  const { name, price, measures, description } = req.body;



  if (!name) {
    return res.status(400).json({ message: "Item name is required" });
  }

  try {
    const menu = await Menu.findById(categoryId);
    if (!menu) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    const subCategory = menu.subCategories.id(subCategoryId);
    if (!subCategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    // Check for duplicate item (case-insensitive match if desired)
    if (
      subCategory.items.some(
        (item) => item.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      return res.status(400).json({ message: "Item already exists" });
    }

    // Add new item. If measures are provided, store them. If price is provided, store it.
    // If you want price to be optional for items with measures, that's fine. 
    const newItem = { name };
    if (typeof price !== "undefined") {
      newItem.price = price; // Single price or default price
    }

    if (req.files && req.files.length > 0) {
      let arr = req.files;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].fieldname === "image") {
          newItem["image"] = arr[i].filename;
        }
      }
    }

    if (Array.isArray(measures) && measures.length > 0) {

      newItem.measures = measures;
    } else {
      newItem.measures = [];
    }

    if (description) {
      newItem.description = description;
    }

    

    subCategory.items.push(newItem);

   

   

    const updatedMenu = await menu.save();
    res.status(200).json(updatedMenu);
  } catch (error) {
    res.status(500).json({ message: "Server error", error:error.message });
  }
};

// DELETE subcategory
// DELETE /api/menu/:categoryId/subcategory/:subCategoryId
export const deleteSubCategory = async (req, res) => {
  const { categoryId, subCategoryId } = req.params;

  try {
    const menu = await Menu.findById(categoryId);
    if (!menu) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subCategoryIndex = menu.subCategories.findIndex(
      (subCat) => subCat._id.toString() === subCategoryId
    );

    if (subCategoryIndex === -1) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    // Remove the subcategory
    menu.subCategories.splice(subCategoryIndex, 1);
    await menu.save();

    res.status(200).json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// DELETE item
// DELETE /api/menu/:categoryId/subcategory/:subCategoryId/:itemId
export const deleteItem = async (req, res) => {
  const { categoryId, subCategoryId, itemId } = req.params;

  try {
    const menu = await Menu.findById(categoryId);
    if (!menu) {
      return res.status(404).json({ message: "Category not found" });
    }

    const subCategory = menu.subCategories.id(subCategoryId);
    if (!subCategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    const itemIndex = subCategory.items.findIndex(
      (item) => item._id.toString() === itemId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found" });
    }

    subCategory.items.splice(itemIndex, 1);
    await menu.save();

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
