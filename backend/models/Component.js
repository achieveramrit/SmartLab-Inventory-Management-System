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
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.models.Component ||
    mongoose.model("Component", componentSchema);