import mongoose from 'mongoose';

// Add RoomType schema in the same file
const RoomTypeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  }
}, { timestamps: true });

const RoomSchema = new mongoose.Schema({
    roomName: { type: String, required: true },
    roomType: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'RoomType',
      required: true 
    },
    price: { type: Number, required: true },
    roomNumber: { type: Number, required: true, unique: true },
    availability: { type: String },
    capacity: {
      type: Number,
    },
});

// Export both models from the same file
export const RoomType = mongoose.model('RoomType', RoomTypeSchema);
export default mongoose.model('Room', RoomSchema);