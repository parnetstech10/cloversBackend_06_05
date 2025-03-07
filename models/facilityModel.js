import mongoose from "mongoose";


const featureSchema = new mongoose.Schema({
    
    name: {
        type: String,
        required: [true, "Facility  name is required"],
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        required: [true, "Status is required"],
    },
    type: {
        type: String,
        // enum: ["dining", "event", "other"],
        required: [true, "Type is required"],
    },
    capacity: {
        type: Number,
        required: [true, "Capacity is required"],
        min: [1, "Capacity must be at least 1"],
    },
    price:{
        type:Number,
        default:0,
    },
}, { timestamps: true });

export default mongoose.model("Facility", featureSchema);
