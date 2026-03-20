import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";
import Notification from "@/app/models/Notification";

// POST /api/users/follow/respond — Accept or Reject a follow request
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { requesterId, action } = await req.json(); // action: "accept" or "reject"
    if (!requesterId || !["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "requesterId and action (accept/reject) required" }, { status: 400 });
    }

    await connectDB();

    const currentUser = await User.findById(session.user.id);
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Find and remove the request from the array
    const requestIndex = (currentUser.followRequests || []).findIndex(
      r => (r.from?._id || r.from).toString() === requesterId
    );
    
    // We remove it from the array first
    if (requestIndex !== -1) {
      currentUser.followRequests.splice(requestIndex, 1);
    }

    if (action === "accept") {
      const requester = await User.findById(requesterId);
      if (!requester) return NextResponse.json({ error: "Requester not found" }, { status: 404 });

      // Mutual follow: both follow each other (like a connection)
      const requesterIdStr = requesterId.toString();
      const myIdStr = session.user.id.toString();

      if (!currentUser.followers.map(String).includes(requesterIdStr)) {
        currentUser.followers.push(requesterId);
      }
      if (!currentUser.following.map(String).includes(requesterIdStr)) {
        currentUser.following.push(requesterId);
      }
      if (!requester.followers.map(String).includes(myIdStr)) {
        requester.followers.push(session.user.id);
      }
      if (!requester.following.map(String).includes(myIdStr)) {
        requester.following.push(session.user.id);
      }

      await requester.save();
      await currentUser.save();

      // Create a Notification record for the requester
      await Notification.create({
        recipient: requesterId,
        type: "FOLLOW_ACCEPTED",
        title: "🎉 Connection Accepted",
        message: `${currentUser.name} accepted your request. You can now chat and study together!`,
        link: "/discover?tab=connections"
      });

      // Real-time Emit if Socket is active
      if (globalThis.__io) {
        globalThis.__io.to(`user:${requesterId}`).emit("notification", {
          type: "FOLLOW_ACCEPTED",
          title: "🎉 Connection Accepted",
          message: `${currentUser.name} accepted your request!`
        });
      }

      return NextResponse.json({ message: "Connection accepted! You can now create groups together." });
    } else {
      // Reject: save the removed request state
      await currentUser.save();
      return NextResponse.json({ message: "Request declined." });
    }
  } catch (err) {
    console.error("[RESPOND_FOLLOW]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
