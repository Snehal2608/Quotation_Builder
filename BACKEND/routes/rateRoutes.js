import express from "express";
import Rate from "../models/RateModel.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* CREATE RATE - Admin Only */
router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { itemName, rate, description, imageBase64 } = req.body;

    if (!itemName || !rate) {
      return res.status(400).json({ message: "Item name and rate are required" });
    }

    if (imageBase64 && !imageBase64.startsWith("data:image")) {
      return res.status(400).json({ message: "Invalid image format" });
    }

    const rateItem = new Rate({
      itemName,
      rate,
      description: description || "",
      imageBase64: imageBase64 || null,
      adminId: req.user._id, // Tied to the logged-in admin
    });

    await rateItem.save();
    res.status(201).json(rateItem);
  } catch (err) {
    res.status(500).json({ message: "Server error while creating rate" });
  }
});

/* GET ALL RATES - Admin and User */
// Removed verifyAdmin so Priti (User role) doesn't get a 403
router.get("/", verifyToken, async (req, res) => {
  try {
    // Logic: If Admin, show their own. If User, show their assigned Admin's items.
    const targetAdminId = req.user.role === "admin" ? req.user._id : req.user.adminId;
    
    if (!targetAdminId) {
      return res.status(400).json({ message: "No admin associated with this account" });
    }

    const rates = await Rate.find({ adminId: targetAdminId });
    res.json(rates);
  } catch (err) {
    res.status(500).json({ message: "Error fetching rates" });
  }
});

/* UPDATE RATE - Admin Only */
router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { itemName, rate, description, imageBase64 } = req.body;
    const updateData = { itemName, rate, description: description || "" };

    if (imageBase64 && imageBase64.startsWith("data:image")) {
      updateData.imageBase64 = imageBase64;
    }

    const updated = await Rate.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user._id },
      { $set: updateData },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Rate not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating rate" });
  }
});

/* DELETE RATE - Admin Only */
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const deleted = await Rate.findOneAndDelete({
      _id: req.params.id,
      adminId: req.user._id,
    });

    if (!deleted) return res.status(404).json({ message: "Rate not found" });
    res.json({ message: "Rate deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting rate" });
  }
});

export default router;