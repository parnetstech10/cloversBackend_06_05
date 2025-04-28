import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
    tableNo: {
        type: String,
        required: true,
        unique: true, // Ensures table numbers are unique
    },
    seat: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["available", "reserved", "booked"], // Restricts values
        default: "available", // Default status
    },
    tableType:{
        type: String,
        enum: ["Restaurant", "Bar","Lounge Area","Outdoor"], // Restricts values
        default: "Restaurant", // Default status
    }
});

// Model
const TableModel = mongoose.model("Table", tableSchema);
export default TableModel;
