import mongoose  from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter a name'],
    },
    email: {
      type: String,
      required: [true, 'Please enter an email'],
      unique: true,
    },
    phone:{
      type: String,
      required: [true, 'Please enter a phone'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
    },
    membershipStatus: {
      type: String,
      enum: ['Active', 'Expired', 'Pending'],
      default: 'Pending',
    },
    memberType:{
      type:String,
      // default:"Guest"
    },
    memberID:{
    type:String
    },
    membershipExpiryDate: {
      type: Date,
      // default: () => {
      //   const today = new Date(); // Get the current date
      //   today.setDate(today.getDate() + 1); // Add 1 day to the current date
      //   return today; // Return the updated date
      // },
    },
    role: {
      type: String,
      enum: ['Member', 'Employee', 'Admin'],
      default: 'Member',
    },
    // Add any additional fields needed
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
