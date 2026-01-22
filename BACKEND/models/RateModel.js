import mongoose from "mongoose";

const rateSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    rate: { type: Number, required: true },

    description: { type: String, default: "" },

    // 🔥 BASE64 IMAGE
    imageBase64: {
      type: String,
      default: null,
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Rate", rateSchema);
