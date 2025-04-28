import MenuBar from "../models/barMenuModel.js";

// GET /api/menuBar
export const getBarMenu = async (req, res) => {
  try {
    const menu = await MenuBar.find({});
    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// POST /api/menuBar/category
export const addBarMenuCategory = async (req, res) => {
  const { categoryName } = req.body;
  if (!categoryName) {
    return res.status(400).json({ message: "Category name is required" });
  }
  try {
    const existingCategory = await MenuBar.findOne({ category: categoryName });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = new MenuBar({
      category: categoryName,
      brand: [], // Initialize with empty brand array
    });
    const saved = await newCategory.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/menuBar/getCategory
export const getCategory = async (req, res) => {
  try {
    const category = await MenuBar.find({});
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

// POST /api/menuBar/editCategory
export const editCategory = async (req, res) => {
  try {
    const { categoryName, id } = req.body;

    const category = await MenuBar.findById(id);
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

// DELETE /api/menuBar/deleteCategory/:id
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const deleteCategory = await MenuBar.findByIdAndDelete(id);
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

// PUT /api/menuBar/editSubCategory
export const editBrand = async (req, res) => {
  try {
    const { name, id, brandId } = req.body;

    const menu = await MenuBar.findById(id);
    if (!menu) {
      return res.status(400).json({ message: "Menu not found" });
    }

    const brand = menu.brand.id(brandId);
    if (!brand) {
      return res.status(400).json({ message: "Brand not found" });
    }

    brand.name = name;
    await menu.save();

    return res.status(200).json({
      message: "Brand updated successfully",
      data: brand,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// POST /api/menuBar/:categoryId/brand
export const addBrand = async (req, res) => {
  const { categoryId } = req.params;
  const { brandName } = req.body;

  if (!brandName) {
    return res.status(400).json({ message: "Brand name is required" });
  }

  try {
    const menu = await MenuBar.findById(categoryId);
    if (!menu) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check for duplicate brand
    if (
      menu.brand.some(
        (brand) => brand.name.toLowerCase() === brandName.toLowerCase()
      )
    ) {
      return res.status(400).json({ message: "Brand already exists" });
    }

    // Add new brand
    const newBrand = {
      name: brandName,
      items: [],
    };
    menu.brand.push(newBrand);
    const updatedMenu = await menu.save();

    res.status(200).json(updatedMenu);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// POST /api/menuBar/:categoryId/brand/:brandId/item
export const addItem = async (req, res) => {
  const { categoryId, brandId } = req.params;
  const { name, price, measures, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: "Item name is required" });
  }
  
  try {
    const menu = await MenuBar.findById(categoryId);
    if (!menu) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    const brand = menu.brand.id(brandId);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Check for duplicate item
    if (
      brand.items.some((item) => item.name.toLowerCase() === name.toLowerCase())
    ) {
      return res.status(400).json({ message: "Item already exists" });
    }

    // Add new item
    const newItem = { name, description };
    if (typeof price !== "undefined") {
      newItem.price = price;
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

    brand.items.push(newItem);
    const updatedMenu = await menu.save();
    
    res.status(200).json(updatedMenu);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE /api/menuBar/deleteSubCategory/:categoryId/:subCategoryId
export const deleteSubCategory = async (req, res) => {
  const { categoryId, subCategoryId } = req.params;

  try {
    const menu = await MenuBar.findById(categoryId);
    if (!menu) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Find the brand index (using brand instead of subCategories)
    const brandIndex = menu.brand.findIndex(
      (brand) => brand._id.toString() === subCategoryId
    );

    if (brandIndex === -1) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Remove the brand
    menu.brand.splice(brandIndex, 1);
    await menu.save();

    res.status(200).json({ message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// DELETE /api/menuBar/:categoryId/subcategory/:subCategoryId/item/:itemId
export const deleteItem = async (req, res) => {
  const { categoryId, subCategoryId, itemId } = req.params;

  try {
    const menu = await MenuBar.findById(categoryId);
    if (!menu) {
      return res.status(404).json({ message: "Category not found" });
    }

    const brand = menu.brand.id(subCategoryId);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const itemIndex = brand.items.findIndex(
      (item) => item._id.toString() === itemId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found" });
    }

    brand.items.splice(itemIndex, 1);
    await menu.save();

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};