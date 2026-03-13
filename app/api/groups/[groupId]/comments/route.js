import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/app/db/connectDB";
import Group from "@/app/models/Group";

// GET /api/groups/[groupId]/comments — full discussion thread
export async function GET(req, { params }) {
  try {
    await connectDB();

    const group = await Group.findById(params.groupId)
      .select("comments")
      .populate("comments.author", "name profilePicture");

    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    return NextResponse.json({ comments: group.comments });
  } catch (err) {
    console.error("[GET_COMMENTS]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/groups/[groupId]/comments — members only
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { content } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(params.groupId);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    if (!group.members.map(String).includes(session.user.id)) {
      return NextResponse.json({ error: "Only members can comment" }, { status: 403 });
    }

    group.comments.push({ author: session.user.id, content: content.trim() });
    await group.save();

    await group.populate("comments.author", "name profilePicture");
    const newComment = group.comments[group.comments.length - 1];

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (err) {
    console.error("[POST_COMMENT]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/groups/[groupId]/comments?commentId=xxx
// author can delete own comment, group owner can delete any
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "commentId query param required" }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(params.groupId);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const comment = group.comments.id(commentId);
    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

    const isGroupOwner = group.owner.toString() === session.user.id;
    const isAuthor = comment.author.toString() === session.user.id;

    if (!isGroupOwner && !isAuthor) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    comment.deleteOne();
    await group.save();

    return NextResponse.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("[DELETE_COMMENT]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}