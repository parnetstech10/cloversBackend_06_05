import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import liveOrderRoutes from "./routes/liveOrderRoutes.js";
import membershipRoutes from "./routes/membershipRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import facilityBookingRoutes from "./routes/facilitBookingRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import roomBookRoutes from "./routes/roomBookRoutes.js";
import authRouts from "./routes/adminRoutes.js";
import morgan from "morgan";
import employeeRoutes from "./routes/employeeRouter.js";
import benefitRoutes from "./routes/benefitRoutes.js";
import barInventoryRoutes from "./routes/BarInventoryRoutes.js";
import bodyParser from "body-parser";
import router from "./routes/barMenuRoutes.js";
import ResturentInventory from "./routes/ResturentInventory.js";
import restaurantReservationRoutes from "./routes/restaurantReservationRoutes.js";
import attendanceRouter from "./controllers/employeeAttendanceController.js";
import subAdminRoutes from "./routes/subAdminRoutes.js";
import tableRoutes from "./routes/tableRouter.js";
import Transaction from './routes/transactionRoutes.js';
import Wallet from './routes/walletRoute.js';
import SportBookingRoutes from "./routes/sportBooking.js";
import generalInventoryRoutes from './routes/generalinventoryRoutes.js';
// <<<<<<< HEAD
import BookfacilityRoutes from "./routes/BookFacility.js"
import recipeRoutes from './routes/recipeRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js'


import facilityCategoryRoutes  from './routes/facilityCategories.js';

dotenv.config();

// Connect to database
connectDB();

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.static("public"));
// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use("/api/users", userRoutes);
app.use("/api/admin", authRouts);
// Menu route
app.use("/api/menu", menuRoutes);
app.use("/api/menuBar", router);

app.use("/api/orders", orderRoutes);
app.use("/api/live-orders", liveOrderRoutes);
app.use("/api/facility", facilityRoutes);
app.use("/api/facility/booking", facilityBookingRoutes);

app.use("/api/memberships", membershipRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/room/booking", roomBookRoutes);

app.use("/api/employee", employeeRoutes);
app.use("/api/benefit", benefitRoutes);

app.use("/api/barInventory", barInventoryRoutes);
app.use("/api/resturentinventory", ResturentInventory);

app.use('/api/subAdmins', subAdminRoutes)

app.use('/api/restaurant/reservation' , restaurantReservationRoutes)

app.use('/api/employee/attendance' , attendanceRouter )

app.use('/api/restaurant/table' , tableRoutes )
app.use("/api/user/transaction",Transaction);
app.use("/api/user/wallet",Wallet);
app.use("/api/sportbooking",SportBookingRoutes);
app.use('/api/restaurant', recipeRoutes);
app.use('/api/facility-categories', facilityCategoryRoutes);
app.use("/api/general-inventory", generalInventoryRoutes);
app.use("/api/users",BookfacilityRoutes)
app.use('/api/payroll',payrollRoutes)
// >>>>>>> 924daf026b58d82e80af24cfa0b4db1a4905733c
// app.use("/", (req, res) => {
//   res.status(200).json("Welcom to clovers");
// });
// Add this additional line in server.js to handle existing frontend code
app.use("/api/general-categories", (req, res) => {
  res.redirect("/api/general-inventory/categories");
});
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
