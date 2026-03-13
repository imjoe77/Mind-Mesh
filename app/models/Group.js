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
});

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

GroupSchema.pre("save", function (next) {
  if (this.isNew && !this.members.map(String).includes(this.owner.toString())) {
    this.members.push(this.owner);
  }
  next();
});

export default mongoose.models.Group || mongoose.model("Group", GroupSchema);