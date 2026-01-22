import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";

import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

/* ========================================================
   1️⃣ REGISTER ADMIN — SEND SIMPLE YES/NO VERIFICATION
   ======================================================== */
router.post("/register", async (req, res) => {
  const { name, phoneNo, countryCode, email, password, logoBase64 } = req.body;

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database not connected yet. Please try again.",
      });
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      return res.status(400).json({ message: "Only Gmail allowed" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const digits = (phoneNo || "").replace(/\D/g, "");
    if (digits.length !== 10)
      return res.status(400).json({ message: "Phone must be 10 digits" });

    const hashed = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      phoneNo: `${countryCode}${digits}`,
      password: hashed,
      role: "admin",
      logoBase64, // 🔥 UPDATED TO BASE64
      isVerified: false,
    });

    const yesUrl = `${process.env.FRONTEND_URL}/verify-email/${admin._id}/yes`;
    const noUrl = `${process.env.FRONTEND_URL}/verify-email/${admin._id}/no`;

    await sendEmail(
      admin.email,
      "Verify Your Account",
      `
        <h2>Is this your account?</h2>

        <a href="${yesUrl}"
           style="background:green;padding:12px 20px;color:white;border-radius:5px;text-decoration:none;">
           YES, IT'S ME
        </a>

        <br/><br/>

        <a href="${noUrl}"
           style="background:red;padding:12px 20px;color:white;border-radius:5px;text-decoration:none;">
           NO, IT'S NOT ME
        </a>
      `
    );

    return res.json({
      message: "Registered. Check your email to verify your account.",
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error during registration" });
  }
});

/* ========================================================
   2️⃣ VERIFY EMAIL — YES / NO HANDLER
   ======================================================== */
router.get("/verify-email/:userId/:choice", async (req, res) => {
  const { userId, choice } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.send("<h1>User not found ❌</h1>");

    if (choice === "yes") {
      user.isVerified = true;
      await user.save();
      return res.send("<h1>Your Email is Verified Successfully ✔</h1>");
    }

    if (choice === "no") {
      await User.findByIdAndDelete(userId);
      return res.send("<h1>Verification Cancelled ❌<br/>Account Deleted</h1>");
    }

    return res.send("<h1>Invalid Request ❗</h1>");
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return res.send("<h1>Server Error ❗</h1>");
  }
});


/* ========================================================
   3️⃣ LOGIN — Only if Verified
   ======================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    if (!user.isVerified)
      return res.status(403).json({ message: "Please verify your email first." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
        adminId: user.adminId,
        logoBase64: user.logoBase64, // 🔥 UPDATED
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

/* ========================================================
   4️⃣ FORGOT PASSWORD
   ======================================================== */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "Email not found" });

    const recentOtp = await Otp.findOne({
      email: user.email,
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
    });

    if (recentOtp) {
      return res.status(429).json({
        message: "Please wait 1 minute before requesting another OTP",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email: user.email });

    await Otp.create({
      email: user.email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      createdAt: new Date(),
    });

    await sendEmail(
      user.email,
      "Your OTP Code",
      `<p>Your OTP is: <b>${otp}</b></p>`
    );

    return res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
});

/* ========================================================
   5️⃣ VERIFY OTP
   ======================================================== */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await Otp.findOne({ email: email.toLowerCase(), otp });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    return res.json({ message: "OTP verified" });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return res.status(500).json({ message: "Server error verifying OTP" });
  }
});

/* ========================================================
   6️⃣ RESET PASSWORD
   ======================================================== */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { password: hashed }
    );
    await Otp.deleteMany({ email: email.toLowerCase() });
    return res.json({ message: "Password reset successful!" });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Server error resetting password" });
  }
});

/* ========================================================
   7️⃣ GET ADMIN LOGO
   ======================================================== */
router.get("/admin-logo/:id", async (req, res) => {
  try {
    const admin = await User.findById(req.params.id).select("logoBase64 name");
    if (!admin) return res.status(404).json({});
    res.json({ logoBase64: admin.logoBase64, name: admin.name });
  } catch {
    res.status(500).json({});
  }
});

export default router;