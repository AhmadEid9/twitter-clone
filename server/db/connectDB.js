import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
    try {
        const con = await mongoose.connect(process.env.MONGO_URI);
        logger("success",`MongoDB connected: ${con.connection.host}`);
    } catch (error) {
        logger("error", error.message);
    }
};

export default connectDB;