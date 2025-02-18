import express from "express";
import { addItem } from "../controllers/menuController.js";

const barInventoryRoutes = express.Router();    

barInventoryRoutes.post('/add',addItem)
// barInventoryRoutes.get('/get',getBarInventory)
// barInventoryRoutes.post('/edit/:id',editBarInventory)
// barInventoryRoutes.delete('/delete/:id',deleteBarInventory)

export default barInventoryRoutes