import express from "express";
import { 
    createBooking, 
    getAllBookings, 
    getBookingById, 
    updateBooking, 
    deleteBooking 
} from "../controllers/roomBookController.js";

const router = express.Router();

router.post("/", createBooking);
router.get("/all", getAllBookings);
router.get("/:id", getBookingById);
router.put("/:id", updateBooking);
router.delete("/:id", deleteBooking);

export default router;
