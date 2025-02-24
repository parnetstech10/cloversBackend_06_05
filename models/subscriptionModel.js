import mongoose from "mongoose";

const { Schema, model } = mongoose;

const subScriptionModel = new Schema({
    subscriptionID: {
        type: String,
        unique: true, // Ensure it's unique
    },
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
        required: true,
    },
    subscriptiontype: {
        type: String
    },
    createdAt: { type: Date, default: Date.now },
});

// ✅ Auto-generate subscriptionID before saving
subScriptionModel.pre("save", async function (next) {
    if (!this.subscriptionID) {
        try {
            const lastSubscription = await SubscriptionModel.findOne({}, {}, { sort: { createdAt: -1 } });

            if (lastSubscription && lastSubscription.subscriptionID) {
                const lastId = parseInt(lastSubscription.subscriptionID.replace("CCLMSUB", ""), 10);
                this.subscriptionID = `CCLMSUB${String(lastId + 1).padStart(3, "0")}`;
            } else {
                this.subscriptionID = "CCLMSUB001";
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

const SubscriptionModel = model("subscription", subScriptionModel);

export default SubscriptionModel;
