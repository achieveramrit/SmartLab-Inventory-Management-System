const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        component: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Component",
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        purpose: {
            type: String,
            required: true
        },

        requestDate: {
            type: Date,
            default: Date.now
        },

        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected",
                "issued",
                "returned",
                "overdue"
            ],
            default: "pending"
        },

        approvedDate: {
            type: Date,
            default: null
        },

        issueDate: {
            type: Date,
            default: null
        },

        expectedReturnDate: {
            type: Date,
            default: null
        },

        actualReturnDate: {
            type: Date,
            default: null
        },

        rejectionReason: {
            type: String,
            default: ""
        },

        adminComment: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Request", requestSchema);