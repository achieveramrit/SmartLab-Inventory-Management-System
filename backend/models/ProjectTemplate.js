const mongoose = require("mongoose");

const projectTemplateSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            default: "IoT & Smart Systems",
            trim: true
        },

        difficulty: {
            type: String,
            enum: ["Beginner", "Intermediate", "Advanced"],
            default: "Beginner"
        },

        estimatedTime: {
            type: String,
            default: "2-4 hours",
            trim: true
        },

        tags: [
            {
                type: String,
                trim: true
            }
        ],

        imageUrl: {
            type: String,
            default: "",
            trim: true
        },

        documentationUrl: {
            type: String,
            default: "",
            trim: true
        },

        components: [
            {
                component: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Component",
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                    default: 1
                }
            }
        ],

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

projectTemplateSchema.index({ title: "text", description: "text", category: "text" });
projectTemplateSchema.index({ category: 1, difficulty: 1 });
projectTemplateSchema.index({ isActive: 1 });

module.exports =
    mongoose.models.ProjectTemplate ||
    mongoose.model("ProjectTemplate", projectTemplateSchema);
