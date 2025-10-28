// models/FCMtoken.js
import mongoose from 'mongoose';

const fcmTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    fcmToken: {
        type: String,
        required: true,
    },
    deviceId: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        enum: ["android", "ios"],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    // Additional fields for membership notifications
    membershipId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Renewal"
    },
    notificationPreferences: {
        expiryReminders: {
            type: Boolean,
            default: true
        },
        paymentReminders: {
            type: Boolean,
            default: true
        },
        renewalConfirmations: {
            type: Boolean,
            default: true
        }
    },
    lastNotificationSent: {
        type: Date
    },
    notificationCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Index for better performance
fcmTokenSchema.index({ userId: 1, isActive: 1 });
fcmTokenSchema.index({ fcmToken: 1 });

export default mongoose.model("FCMtoken", fcmTokenSchema);
