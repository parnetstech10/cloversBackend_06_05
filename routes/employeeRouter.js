import express from "express";
import { addEmployee, deleteEmployee, editEmployee, getEmployee, getEmployeeById } from "../controllers/employeeController.js";

const employeeRoutes = express.Router();

import multer from 'multer';

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/employee");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer();


employeeRoutes.post("/add", upload.any()  , addEmployee);
employeeRoutes.get("/get", getEmployee);
employeeRoutes.post("/edit/:id", upload.any(), editEmployee);
employeeRoutes.delete('/delete/:id' , deleteEmployee)
employeeRoutes.get('/getById/:id', getEmployeeById);
export default employeeRoutes;
