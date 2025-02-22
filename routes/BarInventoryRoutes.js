import express from "express";
import { addItem, getAllItems } from "../controllers/BarInventoryController.js";

const barInventoryRoutes = express.Router();

barInventoryRoutes.post("/add", addItem);
barInventoryRoutes.get("/get", getAllItems);
// barInventoryRoutes.post('/edit/:id',editBarInventory)
// barInventoryRoutes.delete('/delete/:id',deleteBarInventory)

export default barInventoryRoutes;
