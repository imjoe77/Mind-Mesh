import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import Group from "@/app/models/Group";

// POST /api/groups/[groupId]/join
export async function POST(req, { params }) {
  try {
    const { groupId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const group = await Group.findById(groupId);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const userId = session.user.id;

    if (group.members.map(String).includes(userId)) {
      return NextResponse.json({ error: "Already a member" }, { status: 409 });
    }

    if (group.members.length >= group.maxMembers) {
      return NextResponse.json({ error: "Group is full" }, { status: 400 });
    }

    group.members.push(userId);
    await group.save();

    return NextResponse.json({ message: "Joined successfully" });
  } catch (err) {
    console.error("[JOIN_GROUP]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}