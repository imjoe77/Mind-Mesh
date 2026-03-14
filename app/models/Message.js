import mongoose from "mongoose";

const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for fast conversation lookups
MessageSchema.index({ from: 1, to: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
