import express from "express";
import { addBenefit, deleteBenefit, editBenefit, getBenefit } from "../controllers/benefitController.js";

const benefitRoutes = express.Router();

benefitRoutes.post('/add',addBenefit)
benefitRoutes.get('/get',getBenefit)
benefitRoutes.post('/edit/:id',editBenefit)
benefitRoutes.delete('/delete/:id',deleteBenefit)

export default benefitRoutes