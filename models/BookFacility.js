import mongoose from "mongoose";

const BookFacilitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  facilityId: String,
  facilityName: {
    type: String,
    required: true
  },
  facilityType: {
    type: String,
    enum: ['facility', 'room', 'event'],
    required: true
  },
  bookForOthers: {
    type: Boolean,
    default: false
  },
  otherMemberDetails: {
    memberId: String,
    name: String,
    contact: String
  },
  // For facility and event bookings
  date: String,
  timeSlot: String,
  // For room bookings
  checkInDate: Date,
  checkOutDate: Date,
  // Common fields
  numberOfGuests: String,
  specialRequests: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('BookFacility', BookFacilitySchema);