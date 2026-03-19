import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import Message from "@/app/models/Message";

// GET /api/messages/unread — count unread messages per sender
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const unread = await Message.aggregate([
      { $match: { to: session.user.id, read: false } },
      { $group: { _id: "$from", count: { $sum: 1 } } },
    ]);

    // Convert to { senderId: unreadCount }
    const countMap = {};
    unread.forEach(u => { countMap[u._id.toString()] = u.count; });

    return NextResponse.json({ unread: countMap, total: unread.reduce((s, u) => s + u.count, 0) });
  } catch (err) {
    console.error("[UNREAD_MESSAGES]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
