import mongoose from "mongoose";
const ObjectID = mongoose.Schema.Types.ObjectId;

const roomBooking = new mongoose.Schema(
    {
        memberId: {
            type: ObjectID,
            ref: "User"
        },

        person: [{
            name: {
                type: String
            },
            gender: {
                type: String
            },
            age: {
                type: String
            },
        }],
        
        roomId: {
            type: ObjectID,
            ref: "Room"
        },

        roomName: {
            type: String,
            required: [true, "Room name is required"],
            // enum: ["conference_room", "banquet_hall", "sports_arena"], // Add your facilities here
        },
        checkInDate: {
            type: Date,
        },

        checkOutDate: {
            type: Date,
        },

        checkInTime: {
            type: String,

            validate: {
                validator: function (value) {
                    return /^\d{2}:\d{2}$/.test(value); // Validates time in HH:mm format
                },
                message: "Invalid start time format. Use HH:mm",
            },
        },

        checkOutTime: {
            type: String,

            validate: {
                validator: function (value) {
                    return /^\d{2}:\d{2}$/.test(value); // Validates time in HH:mm format
                },
                message: "Invalid end time format. Use HH:mm",
            },
        },
        people: {
            type: Number,
            required: [true, "Number of guests is required"],
            min: [1, "Number of guests must be at least 1"],
        },
        specialRequests: {
            type: String,
            trim: true,
        },
        price: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        tax: {
            type: Number,
            default: 0
        },
        paymentType: {
            type: String
        },
        paymentsStatus: {
            type: String,
            default: "inprogress"
        },
        status: {
            type: String,
            default: "pending"
        },

    },
    { timestamps: true }
);

export default mongoose.model("roombooking", roomBooking);
