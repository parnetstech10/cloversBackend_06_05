import Room from '../models/roomModel.js';

export const addRoom = async (req, res) => {
    try {
        const room = new Room(req.body);
        console.log(req.body);

        await room.save();
        res.status(201).json({ message: 'Room added successfully', room });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find().sort({ _id: -1 });
        res.status(200).json({ success: rooms });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ error: 'Room not found' });
        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!room) return res.status(404).json({ error: 'Room not found' });
        res.status(200).json({ message: 'Room updated successfully', room });
    } catch (error) {
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
        let { availability } = req.body
        let data = await Room.findById(id);
        if (!data) return res.status(400).json({ error: "Data not found" });
        data.availability = availability;
        data = await data.save();
        console.log(data);
        
        return res.status(200).json({ success: data });
    } catch (error) {
        console.log(error);
    }
}
