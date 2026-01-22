import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    type: {
      type: String,
      enum: ["complaint", "quotation"],
      required: true,
    },

    category: {
      type: String,
      default: "General",
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    quotation: {
      items: [
        {
          name: { type: String },
          length: { type: Number },
          height: { type: Number },
          rate: { type: Number },
          total: { type: Number },
        },
      ],
      grandTotal: { type: Number },
      generatedAt: { type: Date, default: Date.now },
    },

    reply: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["unread", "read", "answered"],
      default: "unread",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Message", messageSchema);