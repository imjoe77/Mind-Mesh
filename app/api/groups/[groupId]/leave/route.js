import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/app/db/connectDB";
import Group from "@/app/models/Group";

// POST /api/groups/[groupId]/leave
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const group = await Group.findById(params.groupId);
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
    await group.save();

    return NextResponse.json({ message: "Left group successfully" });
  } catch (err) {
    console.error("[LEAVE_GROUP]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}