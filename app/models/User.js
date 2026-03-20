import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        name: { type: String, default: "" },
        profilePicture: { type: String, default: "" },
        bio: { type: String, maxlength: 250, default: "" },
        branch: { type: String, default: "" },
        semester: { type: String, default: "" },
        year: { type: String, default: "" },
        rollNumber: { type: String, default: "" },
        institution: { type: String, default: "" },
        
        // --- LEARNING FIELDS ---
        domains: {
            type: [String], // e.g., ["Web Dev", "AI"]
            validate: {
                validator: function(v) {
                    return v.length === 0 || (v.length >= 3 && v.length <= 6);
                },
                message: "Select 3-6 domains"
            }
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

        // --- MATCHMAKING ---
        skillsToTeach: [{ type: String, trim: true }], // e.g., ["React", "Python"]
        skillsToLearn: [{ type: String, trim: true }], // e.g., ["Machine Learning", "AWS"]

        // --- SOCIAL & ACTIVITY ---
        followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
        following: [{ type: Schema.Types.ObjectId, ref: "User" }],
        followRequests: [{
            from: { type: Schema.Types.ObjectId, ref: "User" },
            message: { type: String, default: "" },
            createdAt: { type: Date, default: Date.now }
        }],
        recentActivities: [{
            activityType: String, // e.g., "Joined Group", "Started Project"
            description: String,
            timestamp: { type: Date, default: Date.now }
        }],

        // --- PHONE VERIFICATION ---
        phone: { type: String, default: "" },
        phoneVerified: { type: Boolean, default: false },
        phoneOtp: { type: String, default: "" },
        phoneOtpExpiry: { type: Date },

        // --- ACADEMIC PROGRESS (AI ANALYZED) ---
        academicMetrics: {
            semester: { type: String, default: "" },
            gpa: { type: String, default: "" },
            attendance: { type: String, default: "" },
            subjects: [{
                name: String,
                percent: Number,
                color: String
            }],
            upcoming: [{
                subject: String,
                task: String,
                date: String
            }],
            activity: [{
                text: String,
                bold: String,
                time: String,
                color: String
            }],
            lastAnalyzed: Date
        },

        // --- PEER RETENTION / STREAK SYSTEM ---
        streak: {
            current: { type: Number, default: 0 },
            best: { type: Number, default: 0 },
            lastLoginDate: { type: String, default: "" }, // stored as YYYY-MM-DD
            sessionsAttended: { type: Number, default: 0 },
            graceActive: { type: Boolean, default: false },
            graceExpiresAt: { type: Date },
            graceSavedStreak: { type: Number, default: 0 }, // streak value at time grace was given
            quests: [{
                id: String,
                title: String,
                description: String,
                type: { type: String, enum: ["quiz", "flashcard", "join_session", "read"] },
                completed: { type: Boolean, default: false },
                completedAt: Date,
                xp: { type: Number, default: 50 }
            }],
            totalXp: { type: Number, default: 0 }
        },

        location: { city: String, coordinates: [Number] },
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);