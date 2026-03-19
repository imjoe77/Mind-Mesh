import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

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

    // Find and remove the request
    const requestIndex = currentUser.followRequests.findIndex(
      r => r.from.toString() === requesterId
    );
    if (requestIndex === -1) {
      return NextResponse.json({ error: "No pending request from this user" }, { status: 404 });
    }

    currentUser.followRequests.splice(requestIndex, 1);

    if (action === "accept") {
      const requester = await User.findById(requesterId);
      if (!requester) return NextResponse.json({ error: "Requester not found" }, { status: 404 });

      // Mutual follow: both follow each other (like a connection)
      if (!currentUser.followers.map(String).includes(requesterId)) {
        currentUser.followers.push(requesterId);
      }
      if (!currentUser.following.map(String).includes(requesterId)) {
        currentUser.following.push(requesterId);
      }
      if (!requester.followers.map(String).includes(session.user.id)) {
        requester.followers.push(session.user.id);
      }
      if (!requester.following.map(String).includes(session.user.id)) {
        requester.following.push(session.user.id);
      }

      await requester.save();
      await currentUser.save();

      return NextResponse.json({ message: "Connection accepted! You can now create groups together." });
    } else {
      // Reject: just remove the request (already done above)
      await currentUser.save();
      return NextResponse.json({ message: "Request declined." });
    }
  } catch (err) {
    console.error("[RESPOND_FOLLOW]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
