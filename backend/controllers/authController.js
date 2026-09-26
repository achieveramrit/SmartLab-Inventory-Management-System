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
            department
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
            department

        });


        res.status(201).json({

            message: "Student registered successfully.",

            token: generateToken(user._id),

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId
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
                studentId: user.studentId
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


module.exports = {
    registerStudent,
    login,
    getMe
};