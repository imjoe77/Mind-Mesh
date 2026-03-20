import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";
import Notification from "@/app/models/Notification";

// POST /api/users/follow — Send a follow request
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { targetUserId, message } = await req.json();
    if (!targetUserId) return NextResponse.json({ error: "targetUserId required" }, { status: 400 });

    await connectDB();

    const currentUser = await User.findById(session.user.id);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already following
    if (currentUser.following.map(String).includes(targetUserId)) {
      return NextResponse.json({ error: "Already following this user" }, { status: 400 });
    }

    // Check if request already sent
    const alreadyRequested = targetUser.followRequests?.some(
      r => r.from.toString() === session.user.id
    );
    if (alreadyRequested) {
      return NextResponse.json({ error: "Request already sent" }, { status: 400 });
    }

    // Add to target user's follow requests
    targetUser.followRequests.push({
      from: currentUser._id,
      message: message || "",
    });
    await targetUser.save();

    // Create a Notification record
    await Notification.create({
      recipient: targetUserId,
      type: "FOLLOW_REQUEST",
      title: "🤝 New Connection Request",
      message: `${currentUser.name} wants to connect with you!`,
      link: "/discover?tab=requests"
    });

    // Real-time Emit if Socket is active
    if (globalThis.__io) {
      globalThis.__io.to(`user:${targetUserId}`).emit("notification", {
        type: "FOLLOW_REQUEST",
        title: "🤝 New Connection Request",
        message: `${currentUser.name} wants to connect with you!`
      });
    }

    return NextResponse.json({ message: "Follow request sent!" }, { status: 201 });
  } catch (err) {
    console.error("[SEND_FOLLOW]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
