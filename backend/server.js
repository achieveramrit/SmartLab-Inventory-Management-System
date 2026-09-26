const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());


// TEST WHICH ROUTE HAS THE PROBLEM

const authRoutes = require("./routes/authRoutes");
console.log("authRoutes:", typeof authRoutes);

const componentRoutes = require("./routes/componentRoutes");
console.log("componentRoutes:", typeof componentRoutes);

const requestRoutes = require("./routes/requestRoutes");
console.log("requestRoutes:", typeof requestRoutes);


app.use("/api/auth", authRoutes);

app.use("/api/components", componentRoutes);

app.use("/api/requests", requestRoutes);


app.get("/", (req, res) => {
    res.json({
        message: "SmartLab Inventory API is running!"
    });
});


app.use((req, res) => {
    res.status(404).json({
        message: "API route not found."
    });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});