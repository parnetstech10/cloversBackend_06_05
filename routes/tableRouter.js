import express from "express";

import { addTable, bookTable, cancelBooking, checkAvailability, deleteTable, getAllTables, getTablesByType, updateTable, updateTableStatus } from "../controllers/tableController.js";

const tableRoutes = express.Router();

tableRoutes.post("/addTable", addTable);
tableRoutes.get("/getAllTables", getAllTables);
tableRoutes.get("/getTablesByType/:tableType", getTablesByType);
tableRoutes.get("/availableTables/:date/:tableType", checkAvailability);
tableRoutes.post("/bookTable", bookTable);
tableRoutes.put("/updateTableStatus", updateTableStatus);
tableRoutes.post("/cancelBooking", cancelBooking);
tableRoutes.put("/updateTable/:id", updateTable);
tableRoutes.delete("/deleteTable/:id", deleteTable);

export default tableRoutes;

