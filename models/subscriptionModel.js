// models/membershipModel.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const subScriptionModel = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    benefits: [String],
    price: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    sport: {
        type: String
    },
    type: {
        type: String,
        // enum: ['life', 'platinum', 'senior', 'corporate', 'temporary'],
        required: true,
    },
    subscriptiontype:{
        type:String
    },
    createdAt: { type: Date, default: Date.now },
});

export default model('subscription', subScriptionModel);
