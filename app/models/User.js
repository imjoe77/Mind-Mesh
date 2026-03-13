import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        name: { type: String, default: "" },
        profilePicture: { type: String, default: "" },
        bio: { type: String, maxlength: 250, default: "" },
        
        // --- LEARNING FIELDS ---
        domains: {
            type: [String], // e.g., ["Web Dev", "AI"]
            validate: [v => v.length >= 3 && v.length <= 6, "Select 3-6 domains"]
        },
        subjects: [String], // e.g., ["React", "Node.js", "Python"]
        skillLevel: { 
            type: String, 
            enum: ["Beginner", "Intermediate", "Advanced"], 
            default: "Beginner" 
        },
        goal: { type: String, default: "" }, // e.g., "Build a Portfolio"

        credits: { type: Number, default: 100 },
        
        // --- AVAILABILITY ---
        // Storing as an array of days or a more structured object
        availability: [{ 
            day: { type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
            timeSlot: String // e.g., "18:00 - 20:00"
        }],

        // --- SOCIAL & ACTIVITY ---
        followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
        following: [{ type: Schema.Types.ObjectId, ref: "User" }],
        recentActivities: [{
            activityType: String, // e.g., "Joined Group", "Started Project"
            description: String,
            timestamp: { type: Date, default: Date.now }
        }],

        location: { city: String, coordinates: [Number] },
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);