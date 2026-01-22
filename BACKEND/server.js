import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import rateRoutes from "./routes/rateRoutes.js";
import puppeteerRoutes from "./routes/puppeteerRoute.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log("✅ MongoDB Connected");

    // ✅ Create default admin AFTER DB is ready
    const email = "admin@gmail.com";
    let admin = await User.findOne({ email });

    if (!admin) {
      if (!process.env.DEFAULT_ADMIN_PASSWORD) {
        throw new Error("DEFAULT_ADMIN_PASSWORD not set in .env");
      }

      const hashed = await bcrypt.hash(
        process.env.DEFAULT_ADMIN_PASSWORD,
        10
      );

      admin = new User({
        email,
        password: hashed,
        role: "admin",
        name: "Super Admin",
        isVerified: true,
      });

      await admin.save();
      console.log("✅ Default Admin Created");
    }

    // ROUTES
    app.use("/api/auth", authRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/rates", rateRoutes);
    app.use("/api/puppeteer", puppeteerRoutes);
    app.use("/api/messages", messageRoutes);

    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

startServer();
