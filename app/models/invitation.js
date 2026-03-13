import mongoose from "mongoose";
const { Schema, model } = mongoose;

const InvitationSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    status: { 
        type: String, 
        enum: ["pending", "accepted", "rejected"], 
        default: "pending" 
    }
}, { timestamps: true });

const Invitation = mongoose.models.Invitation || model("Invitation", InvitationSchema);
export default Invitation;