import express from "express";
import Rate from "../models/RateModel.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* CREATE RATE */
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { itemName, rate, description, imageBase64 } = req.body;

      // 1. Validate mandatory fields
      if (!itemName || !rate) {
        return res.status(400).json({ message: "Item name and rate are required" });
      }

      // 2. Validate image format ONLY if an image is actually provided
      if (imageBase64 && !imageBase64.startsWith("data:image")) {
        return res.status(400).json({ message: "Invalid image format" });
      }

      const rateItem = new Rate({
        itemName,
        rate,
        description: description || "", // Default to empty string
        imageBase64: imageBase64 || null, // Allow null if no image
        adminId: req.user._id,
      });

      await rateItem.save();
      res.status(201).json(rateItem);
    } catch (err) {
      console.error("Create Rate Error:", err);
      res.status(500).json({ message: "Server error while creating rate" });
    }
  }
);

/* GET ALL RATES */
// TEMPORARY TEST: This will show ALL rates to EVERYONE
router.get("/", verifyToken, async (req, res) => {
  try {
    const rates = await Rate.find({}); // Remove the { adminId } filter
    res.json(rates);
  } catch (err) {
    res.status(500).json({ message: "Error fetching rates" });
  }
});

/* UPDATE RATE */
router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { itemName, rate, description, imageBase64 } = req.body;
      
      const updateData = {
        itemName,
        rate,
        description: description || "",
      };

      // Only update image if a new base64 string is provided
      if (imageBase64) {
        if (!imageBase64.startsWith("data:image")) {
          return res.status(400).json({ message: "Invalid image format" });
        }
        updateData.imageBase64 = imageBase64;
      }

      const updated = await Rate.findOneAndUpdate(
        { _id: req.params.id, adminId: req.user._id },
        { $set: updateData },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ message: "Rate not found or unauthorized" });
      }

      res.json(updated);
    } catch (err) {
      console.error("Update Rate Error:", err);
      res.status(500).json({ message: "Server error while updating rate" });
    }
  }
);

/* DELETE RATE */
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const deleted = await Rate.findOneAndDelete({
      _id: req.params.id,
      adminId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Rate not found or unauthorized" });
    }

    res.json({ message: "Rate deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting rate" });
  }
});

export default router;