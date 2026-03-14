import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import Group from "@/app/models/Group";

// POST /api/groups/[groupId]/leave
export async function POST(req, { params }) {
  try {
    const { groupId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const group = await Group.findById(groupId);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const userId = session.user.id;

    if (group.owner.toString() === userId) {
      return NextResponse.json(
        { error: "Owner cannot leave. Delete the group instead." },
        { status: 400 }
      );
    }

    if (!group.members.map(String).includes(userId)) {
      return NextResponse.json({ error: "Not a member" }, { status: 400 });
    }

    group.members = group.members.filter((m) => m.toString() !== userId);

    // Also remove from all session slots within this group
    if (group.sessions && group.sessions.length > 0) {
      group.sessions.forEach(slot => {
        if (slot.participants) {
          slot.participants = slot.participants.filter(p => p.toString() !== userId);
        }
      });
    }

    await group.save();

    return NextResponse.json({ message: "Left group and all associated slots successfully" });
  } catch (err) {
    console.error("[LEAVE_GROUP]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}