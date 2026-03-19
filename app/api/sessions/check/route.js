import { NextResponse } from "next/server";
import connectDB from "@/db/connectDB";
import Group from "@/app/models/Group";
import Notification from "@/app/models/Notification";
import User from "@/app/models/User";
import { sendSessionEmail } from "@/app/lib/email";

// GET /api/sessions/check — Check and activate/complete sessions based on current time
// This should be called periodically (e.g. every minute via cron or client-side polling)
export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Find all groups with sessions today
    const todayStart = new Date(todayStr + "T00:00:00");
    const todayEnd = new Date(todayStr + "T23:59:59");

    const groups = await Group.find({
      "sessions.date": { $gte: todayStart, $lte: todayEnd },
    }).populate("members", "_id name").lean();

    let activatedCount = 0;
    let completedCount = 0;
    const notificationsToSend = [];

    for (const group of groups) {
      for (const session of group.sessions) {
        const sessionDateStr = new Date(session.date).toISOString().split("T")[0];
        if (sessionDateStr !== todayStr) continue;

        const currentStatus = session.status || "scheduled";

        // Check if session should become active
        if (currentStatus === "scheduled" && nowTime >= session.startTime && nowTime < session.endTime) {
          // Activate this session
          await Group.updateOne(
            { _id: group._id, "sessions._id": session._id },
            { $set: { "sessions.$.status": "active" } }
          );
          activatedCount++;

          // Create notifications for all group members
          for (const member of group.members) {
            notificationsToSend.push({
              recipient: member._id,
              type: "GROUP_ADDED",
              title: "📢 Session is LIVE!",
              message: `Your "${group.name}" study session is now live! Topic: ${group.subject}. Join now!`,
              link: `/groups/${group._id}`,
              groupName: group.name, // Added for socket context
            });

            // Simulate SMS notification for verified numbers
            const userFull = await User.findById(member._id).select("phone phoneVerified email");
            if (userFull?.phoneVerified && userFull?.phone) {
              console.log(`[SMS] Sending alert to ${userFull.phone}: Your ${group.name} session is live! Join here: http://localhost:3000/groups/${group._id}`);
            }

            // Send Email Notification
            if (userFull?.email) {
              await sendSessionEmail({
                to: userFull.email,
                groupName: group.name,
                subject: group.subject,
                link: `/groups/${group._id}`
              });
            }
          }
        }

        // Check if session should be completed
        if ((currentStatus === "active" || currentStatus === "scheduled") && nowTime >= session.endTime) {
          await Group.updateOne(
            { _id: group._id, "sessions._id": session._id },
            { $set: { "sessions.$.status": "completed" } }
          );
          completedCount++;
        }
      }
    }

    // Bulk insert notifications
    if (notificationsToSend.length > 0) {
      await Notification.insertMany(notificationsToSend);
    }

    return NextResponse.json({
      checked: groups.length,
      activated: activatedCount,
      completed: completedCount,
      notified: notificationsToSend.length,
      notifications: notificationsToSend, // Return details for socket targeting
      time: nowTime,
    });
  } catch (err) {
    console.error("[SESSION_CHECK]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
