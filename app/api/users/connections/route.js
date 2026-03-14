import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

// GET /api/users/connections — Get current user's connections and pending requests
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    // Fetch user with populated following/followers — but NOT followRequests.from
    // because Mongoose's strictPopulate rejects inline subdoc paths
    const user = await User.findById(session.user.id)
      .populate({
        path: "following",
        select: "name email profilePicture bio skillsToTeach skillsToLearn skillLevel"
      })
      .populate({
        path: "followers",
        select: "name email profilePicture bio skillsToTeach skillsToLearn skillLevel"
      })
      .lean();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Manually populate followRequests.from
    const rawRequests = user.followRequests || [];
    const requesterIds = rawRequests.map(r => r.from).filter(Boolean);

    const requesterDocs = await User.find({ _id: { $in: requesterIds } })
      .select("name email profilePicture bio skillsToTeach skillsToLearn skillLevel")
      .lean();

    const requesterMap = {};
    requesterDocs.forEach(u => { requesterMap[u._id.toString()] = u; });

    const populatedRequests = rawRequests.map(r => ({
      ...r,
      from: requesterMap[r.from?.toString()] || { _id: r.from, name: "Unknown" }
    }));

    // Mutual connections = users in BOTH followers AND following
    // Filter out nulls in case some users were deleted but refs remain
    const followers = (user.followers || []).filter(f => f && f._id);
    const following = (user.following || []).filter(f => f && f._id);

    const followerIds = new Set(followers.map(f => f._id.toString()));
    const connections = following.filter(f => followerIds.has(f._id.toString()));

    return NextResponse.json({
      connections,
      pendingRequests: populatedRequests,
      followingCount: following.length,
      followersCount: followers.length,
    });
  } catch (err) {
    console.error("[GET_CONNECTIONS]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
