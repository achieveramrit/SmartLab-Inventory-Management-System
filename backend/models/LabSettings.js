const mongoose = require("mongoose");

const labSettingsSchema = new mongoose.Schema(
    {
        standardIssueDays: {
            type: Number,
            default: 7,
            min: 1,
            max: 60
        },
        maxExtensionDays: {
            type: Number,
            default: 7,
            min: 1,
            max: 30
        }
    },
    {
        timestamps: true
    }
);

labSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({
            standardIssueDays: 7,
            maxExtensionDays: 7
        });
    }
    return settings;
};

module.exports = mongoose.model("LabSettings", labSettingsSchema);
