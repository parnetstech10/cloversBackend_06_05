import TableModel from "../models/tableModel.js";


// ✅ Add a new table
export const addTable = async (req, res) => {
    try {
        const { tableNo, seat, tableType } = req.body;

        const newTable = new TableModel({ tableNo, seat, tableType });
        await newTable.save();

        res.status(201).json({ message: "Table added successfully", table: newTable });
    } catch (error) {
        res.status(500).json({ message: "Error adding table", error });
    }
};

// ✅ Get all tables
export const getAllTables = async (req, res) => {
    try {
        const tables = await TableModel.find();
        res.json(tables);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tables", error });
    }
};

// ✅ Get tables based on type (Restaurant / Bar)
export const getTablesByType = async (req, res) => {
    try {
        const { tableType } = req.params;
        
        if (!["Restaurant", "Bar"].includes(tableType)) {
            return res.status(400).json({ message: "Invalid table type" });
        }

        const tables = await TableModel.find({ tableType });
        res.json(tables);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tables by type", error });
    }
};

// ✅ Check table availability for a specific date and type
export const checkAvailability = async (req, res) => {
    try {
        const { date, tableType } = req.params;

        if (!["Restaurant", "Bar"].includes(tableType)) {
            return res.status(400).json({ message: "Invalid table type" });
        }

        // Get available tables of the given type
        const availableTables = await TableModel.find({ status: "available", tableType });

        res.json({ availableTables });
    } catch (error) {
        res.status(500).json({ message: "Error checking availability", error });
    }
};

// ✅ Book a table
export const bookTable = async (req, res) => {
    try {
        const { tableNo } = req.body;

        const table = await TableModel.findOne({ tableNo });
        if (!table) {
            return res.status(404).json({ message: "Table not found" });
        }

        if (table.status !== "available") {
            return res.status(400).json({ message: "Table is already reserved or booked" });
        }

        table.status = "booked";
        await table.save();

        res.status(200).json({ message: "Table booked successfully", table });
    } catch (error) {
        res.status(500).json({ message: "Error booking table", error });
    }
};

// ✅ Update table status (reserved/booked/available)
export const updateTableStatus = async (req, res) => {
    try {
        const { tableNo, status } = req.body;

        if (!["available", "reserved", "booked"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const table = await TableModel.findOne({ tableNo });
        if (!table) {
            return res.status(404).json({ message: "Table not found" });
        }

        table.status = status;
        await table.save();

        res.status(200).json({ message: "Table status updated successfully", table });
    } catch (error) {
        res.status(500).json({ message: "Error updating table status", error });
    }
};

// ✅ Cancel reservation
export const cancelBooking = async (req, res) => {
    try {
        const { tableNo } = req.body;

        const table = await TableModel.findOne({ tableNo });
        if (!table) {
            return res.status(404).json({ message: "Table not found" });
        }

        if (table.status === "available") {
            return res.status(400).json({ message: "Table is already available" });
        }

        table.status = "available";
        await table.save();

        res.status(200).json({ message: "Table reservation canceled", table });
    } catch (error) {
        res.status(500).json({ message: "Error canceling reservation", error });
    }
};
