const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const generateToken = (id) => {

    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};


// ========================
// REGISTER STUDENT
// ========================

const registerStudent = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            studentId,
            department,
            phone
        } = req.body;


        if (!name || !email || !password || !studentId) {

            return res.status(400).json({
                message: "Please provide all required fields."
            });

        }


        const existingUser = await User.findOne({
            email
        });


        if (existingUser) {

            return res.status(400).json({
                message: "User already exists."
            });

        }


        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        const user = await User.create({

            name,
            email,
            password: hashedPassword,
            role: "student",
            studentId,
            department,
            phone: phone || ""

        });


        res.status(201).json({

            message: "Student registered successfully.",

            token: generateToken(user._id),

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                department: user.department,
                phone: user.phone || ""
            }

        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};


// ========================
// LOGIN
// ========================

const login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({
                message: "Email and password are required."
            });

        }


        const user = await User.findOne({
            email
        });


        if (!user) {

            return res.status(401).json({
                message: "Invalid email or password."
            });

        }


        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );


        if (!passwordMatch) {

            return res.status(401).json({
                message: "Invalid email or password."
            });

        }


        res.status(200).json({

            message: "Login successful.",

            token: generateToken(user._id),

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                department: user.department,
                phone: user.phone || ""
            }

        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};


// ========================
// GET CURRENT USER
// ========================

const getMe = async (req, res) => {

    res.status(200).json({
        user: req.user
    });

};


// ========================
// UPDATE PROFILE
// ========================
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const { name, department, studentId, phone } = req.body;
        if (name && name.trim()) user.name = name.trim();
        if (department && department.trim()) user.department = department.trim();
        if (studentId !== undefined && user.role === "student") user.studentId = studentId ? studentId.trim() : null;
        if (phone !== undefined) user.phone = phone ? phone.trim() : "";

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                department: user.department,
                phone: user.phone || ""
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ========================
// RESET / CHANGE PASSWORD
// ========================
const resetPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters long."
            });
        }

        // Fetch user with password field
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Current password does not match."
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({
            message: "Password updated successfully."
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
    registerStudent,
    login,
    getMe,
    updateProfile,
    resetPassword
};