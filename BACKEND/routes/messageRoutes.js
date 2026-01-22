import express from "express";
import Message from "../models/Message.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   USER: SEND COMPLAINT
   ===================================================== */
router.post("/send", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Only users can send complaints" });
    }

    if (!req.user.adminId) {
      return res.status(400).json({ message: "Admin not linked to user" });
    }

    const { category, title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        message: "Title and message are required",
      });
    }

    const complaint = new Message({
      userId: req.user._id,
      adminId: req.user.adminId,
      type: "complaint",
      category: category || "General",
      title,
      message,
      status: "unread",
    });

    await complaint.save();

    res.json({ message: "Complaint sent successfully" });
  } catch (err) {
    console.error("Complaint error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   USER: SEND QUOTATION NOTIFICATION (REAL DATA)
   ===================================================== */
router.post("/quotation-notify", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Only users allowed" });
    }

    if (!req.user.adminId) {
      return res.status(400).json({ message: "Admin not linked to user" });
    }

    // Accepting real data: items array and grandTotal
    const { items, grandTotal } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0 || grandTotal === undefined) {
      return res.status(400).json({
        message: "Incomplete or invalid quotation data",
      });
    }

    // Map items to match correct field names for the schema
    const formattedItems = items.map(item => ({
      name: item.name || item.itemName,
      length: item.length,
      height: item.height,
      rate: item.rate,
      total: item.total || item.totalPrice,
    }));

    await Message.create({
      userId: req.user._id,
      adminId: req.user.adminId,
      type: "quotation",
      title: "New Quotation Generated",
      message: `${req.user.name || "User"} generated a quotation with ${items.length} items`,
      quotation: {
        items: formattedItems, 
        grandTotal,
        generatedAt: new Date(),
      },
      status: "unread",
    });

    res.json({ message: "Quotation notification sent" });
  } catch (err) {
    console.error("Quotation notify error:", err);
    res.status(500).json({ message: "Notification failed" });
  }
});

/* =====================================================
   USER: VIEW OWN MESSAGES (SAFE)
   ===================================================== */
router.get("/my-messages", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.json([]); 
    }

    const msgs = await Message.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(msgs);
  } catch (err) {
    console.error("Fetch user messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   ADMIN: GET ALL COMPLAINTS
   ===================================================== */
router.get("/admin/messages", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const msgs = await Message.find({
      adminId: req.user._id,
      type: "complaint",
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(msgs);
  } catch (err) {
    console.error("Admin messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   ADMIN: REPLY TO COMPLAINT
   ===================================================== */
router.put("/reply/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({ message: "Reply required" });
    }

    const updated = await Message.findByIdAndUpdate(
      req.params.id,
      { reply, status: "answered" },
      { new: true }
    );

    res.json({ message: "Reply sent", updated });
  } catch (err) {
    console.error("Reply error:", err);
    res.status(500).json({ message: "Reply failed" });
  }
});

/* =====================================================
   ADMIN: DELETE COMPLAINT MESSAGE
   ===================================================== */
router.delete("/delete/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const deleted = await Message.findOneAndDelete({
      _id: req.params.id,
      adminId: req.user._id,
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Message not found or unauthorized" });
    }

    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   ADMIN: GET QUOTATION NOTIFICATIONS
   ===================================================== */
router.get(
  "/admin/quotations",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const notifications = await Message.find({
        adminId: req.user._id,
        type: "quotation",
      })
        .populate("userId", "name email")
        .sort({ createdAt: -1 });

      res.json(notifications);
    } catch (err) {
      console.error("Quotation fetch error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* =====================================================
   ADMIN: MARK QUOTATION AS READ
   ===================================================== */
router.put(
  "/admin/quotations/read/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      await Message.findByIdAndUpdate(req.params.id, {
        status: "read",
      });

      res.json({ message: "Marked as read" });
    } catch (err) {
      console.error("Mark read error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* =====================================================
   ADMIN: DELETE QUOTATION NOTIFICATION
   ===================================================== */
router.delete(
  "/admin/quotations/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      // Security: Ensure admin can only delete notifications belonging to them
      const deleted = await Message.findOneAndDelete({
        _id: req.params.id,
        adminId: req.user._id,
        type: "quotation",
      });

      if (!deleted) {
        return res
          .status(404)
          .json({ message: "Quotation notification not found" });
      }

      res.json({ message: "Quotation notification deleted" });
    } catch (err) {
      console.error("Quotation delete error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;