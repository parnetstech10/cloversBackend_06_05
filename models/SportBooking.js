import mongoose from "mongoose";
const ObjectID = mongoose.Schema.Types.ObjectId;

const sportBooking = new mongoose.Schema(
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
        facilityId: {
            type: ObjectID,
            ref: "subscription"
        },
        // facilityName: {
        //     type: String,
        //     required: [true, "Facility name is required"],
        //     // enum: ["conference_room", "banquet_hall", "sports_arena"], // Add your facilities here
        // },
        bookingDate: {
            type: Date,
            required: [true, "Booking date is required"],
        },
        startTime: {
            type: String,
            required: [true, "Start time is required"],
            validate: {
                validator: function (value) {
                    return /^\d{2}:\d{2}$/.test(value); // Validates time in HH:mm format
                },
                message: "Invalid start time format. Use HH:mm",
            },
        },

        endTime: {
            type: String,
            required: [true, "End time is required"],
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

export default mongoose.model("SportBooking", sportBooking);
