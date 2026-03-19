import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import Group from "@/app/models/Group";

// GET /api/groups/[groupId]/sessions
export async function GET(req, { params }) {
  try {
    const { groupId } = await params;
    await connectDB();

    const group = await Group.findById(groupId)
      .select("sessions")
      .populate("sessions.participants", "name email profilePicture");
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    return NextResponse.json({ sessions: group.sessions });
  } catch (err) {
    console.error("[GET_SESSIONS]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/groups/[groupId]/sessions?sessionId=xxx — owner only
export async function DELETE(req, { params }) {
  try {
    const { groupId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId query param required" }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(groupId);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    if (group.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Only the owner can remove sessions" }, { status: 403 });
    }

    group.sessions = group.sessions.filter((s) => s._id.toString() !== sessionId);
    await group.save();

    return NextResponse.json({ message: "Session removed" });
  } catch (err) {
    console.error("[DELETE_SESSION]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}