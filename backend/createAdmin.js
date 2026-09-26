const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const User = require("./models/User");

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const existingAdmin = await User.findOne({
            email: "admin@smartlab.com"
        });

        if (existingAdmin) {
            console.log("Admin already exists.");
            process.exit();
        }

        const hashedPassword = await bcrypt.hash("admin123", 10);

        const admin = await User.create({
            name: "Lab Admin",
            email: "admin@smartlab.com",
            password: hashedPassword,
            role: "admin",
            department: "Computer Engineering"
        });

        console.log("Admin created successfully!");
        console.log("Email: admin@smartlab.com");
        console.log("Password: admin123");

        process.exit();
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
};

createAdmin();