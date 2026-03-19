import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import Notification from "@/app/models/Notification";

// GET /api/notifications — fetch user's notifications
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const notifications = await Notification.find({ recipient: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const unreadCount = await Notification.countDocuments({ 
      recipient: session.user.id, 
      read: false 
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("[GET_NOTIFICATIONS]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/notifications — mark all or specific as read
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { notificationId, all } = await req.json();
    await connectDB();

    if (all) {
      await Notification.updateMany(
        { recipient: session.user.id, read: false },
        { $set: { read: true } }
      );
    } else if (notificationId) {
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: session.user.id },
        { $set: { read: true } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH_NOTIFICATIONS]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
