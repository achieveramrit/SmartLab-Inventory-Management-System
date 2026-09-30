const mongoose = require("mongoose");

const componentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        componentId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        imageUrl: {
            type: String,
            default: "",
            trim: true
        },

        totalQuantity: {
            type: Number,
            required: true,
            min: 0
        },

        availableQuantity: {
            type: Number,
            required: true,
            min: 0
        },

        location: {
            type: String,
            default: ""
        },

        lowStockLimit: {
            type: Number,
            default: 2
        },

        // Admin-appended manual history notes (procurement, repair, decommission, etc.)
        manualHistory: [
            {
                title: { type: String, required: true, trim: true },
                description: { type: String, default: "", trim: true },
                eventDate: { type: Date, default: Date.now },
                type: {
                    type: String,
                    enum: ["procurement", "repair", "maintenance", "decommission", "note", "upgrade", "other"],
                    default: "note"
                },
                createdAt: { type: Date, default: Date.now }
            }
        ]
    },
    {
        timestamps: true
    }
);

// ── Indexes for high-performance search and filtering ──────────
// Compound text index for full-text search
componentSchema.index({
    name: "text",
    description: "text",
    category: "text",
    componentId: "text"
});

// Single & compound field indexes for exact/prefix/range queries
componentSchema.index({ category: 1, name: 1 });
componentSchema.index({ availableQuantity: 1 });
componentSchema.index({ createdAt: -1 });

module.exports =
    mongoose.models.Component ||
    mongoose.model("Component", componentSchema);