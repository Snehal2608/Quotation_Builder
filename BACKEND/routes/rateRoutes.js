import express from "express";
import Rate from "../models/RateModel.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* CREATE */
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { itemName, rate, description, imageBase64 } = req.body;

      if (!imageBase64 || !imageBase64.startsWith("data:image")) {
        return res.status(400).json({ message: "Invalid image format" });
      }

      const rateItem = new Rate({
        itemName,
        rate,
        description,
        imageBase64, // 🔥 BASE64
        adminId: req.user._id,
      });

      await rateItem.save();
      res.json(rateItem);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* GET */
router.get("/", verifyToken, async (req, res) => {
  const adminId = req.user.role === "admin" ? req.user._id : req.user.adminId;
  const rates = await Rate.find({ adminId });
  res.json(rates);
});

/* UPDATE */
router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { itemName, rate, description, imageBase64 } = req.body;
      
      const update = {
        itemName,
        rate,
        description,
      };

      if (imageBase64) {
        if (!imageBase64.startsWith("data:image")) {
          return res.status(400).json({ message: "Invalid image format" });
        }
        update.imageBase64 = imageBase64;
      }

      const updated = await Rate.findOneAndUpdate(
        { _id: req.params.id, adminId: req.user._id },
        { $set: update },
        { new: true }
      );

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* DELETE */
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  await Rate.findOneAndDelete({
    _id: req.params.id,
    adminId: req.user._id,
  });
  res.json({ message: "Deleted" });
});

export default router;