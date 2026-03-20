import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import Message from "@/app/models/Message";
import User from "@/app/models/User";

// GET /api/messages/[userId] — fetch conversation with a user
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId } = params;
    await connectDB();

    // Verify they are connected (at least one-way following for messaging)
    const meArr = await User.findById(session.user.id).select("following followers").lean();
    
    const myFollowing = (meArr?.following || []).map(id => id.toString());
    const myFollowers = (meArr?.followers || []).map(id => id.toString());
    
    // Check if I follow them or they follow me
    const isConnected = myFollowing.includes(userId) || myFollowers.includes(userId);

    if (!isConnected) {
      console.warn(`[MESSAGES_403] User ${session.user.id} tried to message ${userId}. Following: ${myFollowing}, Followers: ${myFollowers}`);
      return NextResponse.json({ error: "Connect with this user to start messaging" }, { status: 403 });
    }

    const messages = await Message.find({
      $or: [
        { from: session.user.id, to: userId },
        { from: userId, to: session.user.id },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    // Mark messages from the other user as read
    await Message.updateMany(
      { from: userId, to: session.user.id, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("[GET_MESSAGES]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/messages/[userId] — send a message
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId } = params;
    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });

    await connectDB();

    // Verify they are connected
    const meArr = await User.findById(session.user.id).select("following followers").lean();
    const myFollowing = (meArr?.following || []).map(id => id.toString());
    const myFollowers = (meArr?.followers || []).map(id => id.toString());
    const isConnected = myFollowing.includes(userId) || myFollowers.includes(userId);

    if (!isConnected) {
      return NextResponse.json({ error: "Connect with this user to start messaging" }, { status: 403 });
    }

    const message = await Message.create({
      from: session.user.id,
      to: userId,
      content: content.trim(),
    });

    // Real-time emission via Socket.IO
    if (globalThis.__io) {
      globalThis.__io.to(`user:${userId}`).emit("new-message", {
        from: session.user.id,
        content: message.content
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error("[SEND_MESSAGE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
