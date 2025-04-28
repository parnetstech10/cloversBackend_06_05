import TableModel from "../models/tableModel.js";


// export const addTable = async (req, res) => {
//     try {
//         const { tableNo, seat, tableType } = req.body;

//         const newTable = new TableModel({ tableNo, seat, tableType });
//         await newTable.save();

//         res.status(201).json({ message: "Table added successfully", table: newTable });
//     } catch (error) {
//         res.status(500).json({ message: "Error adding table", error });
//     }
// };

// ✅ Get all tables
export const addTable = async (req, res) => {
    try {
        const { tableNo, seat, tableType } = req.body;

        // Validate table type
        if (tableType && !["Restaurant", "Bar", "Lounge Area", "Outdoor"].includes(tableType)) {
            return res.status(400).json({ 
                message: "Invalid table type. Must be one of: Restaurant, Bar, Lounge Area, Outdoor" 
            });
        }

        // Check if table number already exists
        const existingTable = await TableModel.findOne({ tableNo });
        if (existingTable) {
            return res.status(400).json({ message: "Table number already exists" });
        }

        const newTable = new TableModel({ tableNo, seat, tableType });
        await newTable.save();

        res.status(201).json({ message: "Table added successfully", table: newTable });
    } catch (error) {
        console.error("Error adding table:", error);
        res.status(500).json({ 
            message: "Error adding table", 
            error: error.message,
            details: error.errors ? Object.values(error.errors).map(e => e.message) : []
        });
    }
};

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
        
        if (!["Restaurant", "Bar", "Lounge Area", "Outdoor"].includes(tableType)) {
            return res.status(400).json({ 
                message: "Invalid table type. Must be one of: Restaurant, Bar, Lounge Area, Outdoor" 
            });
        }

        const tables = await TableModel.find({ tableType });
        res.json(tables);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tables by type", error });
    }
};

export const checkAvailability = async (req, res) => {
    try {
        const { date, tableType } = req.params;

        if (!["Restaurant", "Bar", "Lounge Area", "Outdoor"].includes(tableType)) {
            return res.status(400).json({ 
                message: "Invalid table type. Must be one of: Restaurant, Bar, Lounge Area, Outdoor" 
            });
        }

        const availableTables = await TableModel.find({ status: "available", tableType });

        res.json({ availableTables });
    } catch (error) {
        res.status(500).json({ message: "Error checking availability", error });
    }
};

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

// Update table details
export const updateTable = async (req, res) => {
    try {
        const { id } = req.params;
        const { tableNo, seat, tableType, status } = req.body;

        // Validate table type if provided
        if (tableType && !["Restaurant", "Bar", "Lounge Area", "Outdoor"].includes(tableType)) {
            return res.status(400).json({ 
                message: "Invalid table type. Must be one of: Restaurant, Bar, Lounge Area, Outdoor" 
            });
        }

        // Validate status if provided
        if (status && !["available", "reserved", "booked"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const updatedTable = await TableModel.findByIdAndUpdate(
            id,
            { tableNo, seat, tableType, status },
            { new: true, runValidators: true }
        );

        if (!updatedTable) {
            return res.status(404).json({ message: "Table not found" });
        }

        res.status(200).json({ message: "Table updated successfully", table: updatedTable });
    } catch (error) {
        res.status(500).json({ message: "Error updating table", error: error.message });
    }
};

// Delete table
export const deleteTable = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedTable = await TableModel.findByIdAndDelete(id);
        
        if (!deletedTable) {
            return res.status(404).json({ message: "Table not found" });
        }
        
        res.status(200).json({ message: "Table deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting table", error: error.message });
    }
};
