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
                "overdue",
                "broken",
                "lost"
            ],
            default: "pending"
        },

        returnCondition: {
            type: String,
            enum: ["good", "broken", "lost"],
            default: "good"
        },

        extensionStatus: {
            type: String,
            enum: ["none", "requested", "extended"],
            default: "none"
        },

        extensionReason: {
            type: String,
            default: ""
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
        },

        // Marks records added manually by admin for backfilling physical lab records
        isManualEntry: {
            type: Boolean,
            default: false
        },

        // Stores student details for manual entries that don't have a User document
        manualStudentInfo: {
            name:       { type: String, default: "" },
            studentId:  { type: String, default: "" },
            email:      { type: String, default: "" },
            phone:      { type: String, default: "" },
            department: { type: String, default: "" }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Request", requestSchema);