import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

const SessionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  note: { type: String, default: "", maxlength: 300 },
  status: { 
    type: String, 
    enum: ["scheduled", "active", "completed"], 
    default: "scheduled" 
  },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { strictPopulate: false });

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    subject: { type: String, required: true, trim: true },
    description: { type: String, default: "", maxlength: 500 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    maxMembers: { type: Number, default: 20, min: 2, max: 100 },
    isPrivate: { type: Boolean, default: false },
    sessions: [SessionSchema],
    comments: [CommentSchema],
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

GroupSchema.pre("save", function () {
  if (this.isNew && this.owner) {
    const ownerId = this.owner.toString();
    const memberIds = this.members.map(m => m.toString());
    if (!memberIds.includes(ownerId)) {
      this.members.push(this.owner);
    }
  }
});

export default mongoose.models.Group || mongoose.model("Group", GroupSchema);