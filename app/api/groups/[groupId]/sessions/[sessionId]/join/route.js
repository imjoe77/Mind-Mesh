import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import Group from "@/app/models/Group";
import mongoose from "mongoose";

// POST /api/groups/[groupId]/sessions/[sessionId]/join
export async function POST(req, { params }) {
  try {
    const { groupId, sessionId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    console.log(`[JOIN_SLOT] Attempting join: User ${userId} -> Group ${groupId} -> Slot ${sessionId}`);

    await connectDB();

    const group = await Group.findById(groupId);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    // 1. Membership check
    const memberIds = (group.members || []).map(m => String(m._id || m));
    if (!memberIds.includes(String(userId))) {
      return NextResponse.json({ error: "You must be a group member to join a slot." }, { status: 403 });
    }

    // 2. Finding the specific sub-session
    const slot = group.sessions.id(sessionId);
    if (!slot) return NextResponse.json({ error: "Session slot not found" }, { status: 404 });

    // 3. Past check
    const slotDateStr = new Date(slot.date).toISOString().split("T")[0];
    const slotEndTime = slot.endTime || "23:59";
    const slotDateTime = new Date(`${slotDateStr}T${slotEndTime}:00`);
    if (slotDateTime < new Date()) {
      return NextResponse.json({ error: "Cannot join a past session slot." }, { status: 400 });
    }

    // 4. Duplicate check
    if (!slot.participants) slot.participants = [];
    const participants = slot.participants || [];
    const alreadyIn = participants.some(p => String(p._id || p) === String(userId));
    
    if (alreadyIn) {
      console.log(`[JOIN_SLOT] User ${userId} already joined slot ${sessionId}`);
      return NextResponse.json({ message: "Already joined" });
    }

    // 5. Atomic push via Mongoose subdoc methods
    slot.participants.push(userId);
    await group.save();

    console.log(`[JOIN_SLOT] Success: User ${userId} joined slot ${sessionId}`);
    return NextResponse.json({ message: "Successfully joined the slot." });
  } catch (err) {
    console.error("[JOIN_SLOT] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/groups/[groupId]/sessions/[sessionId]/join — leave a slot
export async function DELETE(req, { params }) {
  try {
    const { groupId, sessionId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    await connectDB();

    const group = await Group.findById(groupId);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const slot = group.sessions.id(sessionId);
    if (!slot) return NextResponse.json({ error: "Session slot not found" }, { status: 404 });

    if (slot.participants) {
      slot.participants = slot.participants.filter(p => String(p._id || p) !== String(userId));
      await group.save();
    }

    return NextResponse.json({ message: "Left the slot." });
  } catch (err) {
    console.error("[LEAVE_SLOT] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
