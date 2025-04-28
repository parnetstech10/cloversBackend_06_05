// models/FacilityCategory.js
import mongoose from 'mongoose';

const facilityCategorySchema = new mongoose.Schema({
    facilityname: {
        type: String,
        // trim: true
    },
    // parentType: {
    //     type: String, 
    //     required: true,
    //     // enum: ['Sports', 'Event', 'Restaurant', 'Bar', 'Room']
    // },
    // description: {
    //     type: String,
    //     trim: true
    // },
    // isActive: {
    //     type: Boolean,
    //     default: true
    
}, { timestamps: true });

export default mongoose.model('FacilityCategory', facilityCategorySchema);