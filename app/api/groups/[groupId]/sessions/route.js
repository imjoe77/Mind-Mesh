import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/app/db/connectDB";
import Group from "@/app/models/Group";

// GET /api/groups/[groupId]/sessions — fetch all time slots (for calendar)
export async function GET(req, { params }) {
  try {
    await connectDB();

    const group = await Group.findById(params.groupId).select("sessions name");
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    return NextResponse.json({ sessions: group.sessions });
  } catch (err) {
    console.error("[GET_SESSIONS]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/groups/[groupId]/sessions — add a session slot (members only)
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { date, startTime, endTime, note } = await req.json();

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "date, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const group = await Group.findById(params.groupId);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    if (!group.members.map(String).includes(session.user.id)) {
      return NextResponse.json({ error: "Only members can add sessions" }, { status: 403 });
    }

    group.sessions.push({ date, startTime, endTime, note });
    await group.save();

    const newSession = group.sessions[group.sessions.length - 1];
    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (err) {
    console.error("[ADD_SESSION]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/groups/[groupId]/sessions?sessionId=xxx — owner only
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId query param required" }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(params.groupId);
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