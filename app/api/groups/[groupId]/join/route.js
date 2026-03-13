import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/app/db/connectDB";
import Group from "@/app/models/Group";

// POST /api/groups/[groupId]/join
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const group = await Group.findById(params.groupId);
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