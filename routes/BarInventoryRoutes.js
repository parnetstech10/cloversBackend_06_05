import express from "express";
import { 
  addItem, getAllItems, getItemById, updateItem, deleteItem, updateStock,
  addBarRecipe, getAllBarRecipes, deductFromBarOrder 
} from "../controllers/BarInventoryController.js";

const barInventoryRoutes = express.Router();

barInventoryRoutes.post("/add", addItem);
barInventoryRoutes.get("/get", getAllItems);
barInventoryRoutes.get("/:id", getItemById);
barInventoryRoutes.put("/:id", updateItem);
barInventoryRoutes.delete("/:id", deleteItem);
barInventoryRoutes.put("/stock/:id", updateStock);

barInventoryRoutes.post("/recipes", addBarRecipe);
barInventoryRoutes.get("/recipes", getAllBarRecipes);
barInventoryRoutes.post("/deduct-from-order", deductFromBarOrder);

export default barInventoryRoutes;
