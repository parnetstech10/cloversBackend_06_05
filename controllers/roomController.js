import mongoose from 'mongoose';
import Room, { RoomType } from '../models/roomModel.js';

export const addRoom = async (req, res) => {
    try {
        const { roomType } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(roomType)) {
            const roomTypeDoc = await RoomType.findOne({ name: roomType });
            if (roomTypeDoc) {
                req.body.roomType = roomTypeDoc._id;
            } else {
                return res.status(400).json({ 
                    error: 'Invalid room type. Please select a valid room type.' 
                });
            }
        }
        
        const room = new Room(req.body);
        console.log(req.body);

        await room.save();
        res.status(201).json({ message: 'Room added successfully', room });
    } catch (error) {
        console.log("Room creation error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find().populate('roomType', 'name').sort({ _id: -1 });
        res.status(200).json({ success: rooms });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate('roomType', 'name');
        if (!room) return res.status(404).json({ error: 'Room not found' });
        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateRoom = async (req, res) => {
    try {
        const { roomType } = req.body;
        
        if (roomType && !mongoose.Types.ObjectId.isValid(roomType)) {
            const roomTypeDoc = await RoomType.findOne({ name: roomType });
            if (roomTypeDoc) {
                req.body.roomType = roomTypeDoc._id;
            } else {
                return res.status(400).json({ 
                    error: 'Invalid room type. Please select a valid room type.' 
                });
            }
        }
        
        const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!room) return res.status(404).json({ error: 'Room not found' });
        res.status(200).json({ message: 'Room updated successfully', room });
    } catch (error) {
        console.log("Room update error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndDelete(req.params.id);
        if (!room) return res.status(404).json({ error: 'Room not found' });
        res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateStatus = async (req, res) => {
    try {
        let id = req.params.id;
        let { availability } = req.body;
        let data = await Room.findById(id);
        if (!data) return res.status(400).json({ error: "Data not found" });
        data.availability = availability;
        data = await data.save();
        console.log(data);
        
        return res.status(200).json({ success: data });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

// New Room Type Functions
// export const getRoomTypes = async (req, res) => {
//     try {
//         const roomTypes = await RoomType.find().sort({ name: 1 });
        
//         // If no room types exist, create some default ones
//         if (roomTypes.length === 0) {
//             const defaultTypes = [
//                 { name: 'Single', description: 'A room for one person' },
//                 { name: 'Double', description: 'A room with a double bed' },
//                 { name: 'Suite', description: 'A luxurious room with separate living area' },
//                 { name: 'Luxury', description: 'Premium room with all amenities' }
//             ];
            
//             await RoomType.insertMany(defaultTypes);
//             const newTypes = await RoomType.find().sort({ name: 1 });
//             return res.status(200).json({ success: newTypes });
//         }
        
//         res.status(200).json({ success: roomTypes });
//     } catch (error) {
//         console.log("Error fetching room types:", error);
//         res.status(500).json({ error: error.message });
//     }
// };
export const getRoomTypes = async (req, res) => {
    try {
        console.log("Fetching room types...");
        const roomTypes = await RoomType.find().sort({ name: 1 });
        console.log("Room types found:", roomTypes.length);
        
        // If no room types exist, create some default ones
        if (roomTypes.length === 0) {
            console.log("No room types found, creating defaults");
            const defaultTypes = [
                { name: 'Single', description: 'A room for one person' },
                { name: 'Double', description: 'A room with a double bed' },
                { name: 'Suite', description: 'A luxurious room with separate living area' },
                { name: 'Luxury', description: 'Premium room with all amenities' }
            ];
            
            try {
                await RoomType.insertMany(defaultTypes);
                console.log("Default types created successfully");
                const newTypes = await RoomType.find().sort({ name: 1 });
                return res.status(200).json({ success: newTypes });
            } catch (insertError) {
                console.error("Error creating default types:", insertError);
                // Still return an empty array rather than failing
                return res.status(200).json({ success: [] });
            }
        }
        
        res.status(200).json({ success: roomTypes });
    } catch (error) {
        console.error("Error in getRoomTypes:", error);
        res.status(500).json({ error: error.message });
    }
};
export const createRoomType = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        // Check if room type already exists
        const existingType = await RoomType.findOne({ name });
        if (existingType) {
            return res.status(400).json({ error: 'Room type already exists' });
        }
        
        const roomType = await RoomType.create({ name, description });
        res.status(201).json({ message: 'Room type added successfully', roomType });
    } catch (error) {
        console.log("Error creating room type:", error);
        res.status(500).json({ error: error.message });
    }
};
