import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
    roomName: { type: String, required: true },
    roomType: { type: String, required: true },
    price: { type: Number, required: true },
    roomNumber: { type: Number, required: true ,unique:true},
    availability: { type:String}
  });
  
  export default mongoose.model('Room', RoomSchema);