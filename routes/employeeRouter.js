import express from "express";
import { addEmployee, deleteEmployee, editEmployee, getEmployee } from "../controllers/employeeController.js";

const employeeRoutes = express.Router();

employeeRoutes.post("/add", addEmployee);
employeeRoutes.get("/get", getEmployee);
employeeRoutes.post("/edit/:id", editEmployee);
employeeRoutes.delete('/delete/:id' , deleteEmployee)

export default employeeRoutes;
