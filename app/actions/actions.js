"use server";
import User from "@/app/models/User";



//Function to make follow request
export const followUser = async (req, res) => {
    const { targetUserId } = req.body; // The person being followed
    const currentUserId = req.user.id; // From your Auth middleware

    if (currentUserId === targetUserId) {
        return res.status(400).json({ message: "You cannot follow yourself." });
    }

    try {
        // 1. Add targetUserId to Current User's 'following'
        await User.findByIdAndUpdate(currentUserId, {
            $addToSet: { following: targetUserId }
        });

        // 2. Add currentUserId to Target User's 'followers'
        await User.findByIdAndUpdate(targetUserId, {
            $addToSet: { followers: currentUserId },
            $push: {
                recentActivities: {
                    activityType: "New Follower",
                    description: `Someone started following you!`
                }
            }
        });

        res.status(200).json({ message: "Followed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Function to unfollow user
export const unfollowUser = async (req, res) => {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id;

    try {
        // Remove from following
        await User.findByIdAndUpdate(currentUserId, {
            $pull: { following: targetUserId }
        });

        // Remove from followers
        await User.findByIdAndUpdate(targetUserId, {
            $pull: { followers: currentUserId }
        });

        res.status(200).json({ message: "Unfollowed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Function to get user info and display
export const getFollowersList = async (req, res) => {
    try {
        const userData = await User.findById(req.user.id)
            .populate("followers", "name profilePicture subjects skillLevel")
            .populate("following", "name profilePicture subjects skillLevel");

        res.status(200).json({
            success: true,
            followers: userData.followers,
            following: userData.following
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};