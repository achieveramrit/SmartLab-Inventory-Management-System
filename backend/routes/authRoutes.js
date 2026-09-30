const express = require("express");

const {
    registerStudent,
    login,
    getMe,
    updateProfile,
    resetPassword
} = require("../controllers/authController");

const {
    protect
} = require("../middleware/authMiddleware");


const router = express.Router();


router.post(
    "/register",
    registerStudent
);


router.post(
    "/login",
    login
);


router.get(
    "/me",
    protect,
    getMe
);

router.put(
    "/profile",
    protect,
    updateProfile
);

router.put(
    "/reset-password",
    protect,
    resetPassword
);


module.exports = router;