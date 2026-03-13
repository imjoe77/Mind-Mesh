import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/app/db/connectDB";
import Group from "@/app/models/Group";

// GET /api/groups/[groupId]
export async function GET(req, { params }) {
  try {
    await connectDB();

    const group = await Group.findById(params.groupId)
      .populate("owner", "name email profilePicture")
      .populate("members", "name email profilePicture")
      .populate("comments.author", "name profilePicture");

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (err) {
    console.error("[GET_GROUP]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/groups/[groupId] — owner only
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const group = await Group.findById(params.groupId);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    if (group.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Only the owner can edit this group" }, { status: 403 });
    }

    const updates = await req.json();
    const allowed = ["name", "subject", "description", "maxMembers", "isPrivate", "tags"];
    allowed.forEach((field) => {
      if (updates[field] !== undefined) group[field] = updates[field];
    });

    await group.save();
    return NextResponse.json({ group });
  } catch (err) {
    console.error("[PATCH_GROUP]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/groups/[groupId] — owner only
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const group = await Group.findById(params.groupId);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    if (group.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: "Only the owner can delete this group" }, { status: 403 });
    }

    await group.deleteOne();
    return NextResponse.json({ message: "Group deleted" });
  } catch (err) {
    console.error("[DELETE_GROUP]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}