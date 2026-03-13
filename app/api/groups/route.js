import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/app/db/connectDB";
import Group from "@/app/models/Group";

// GET /api/groups — list all public groups, optional ?subject= filter
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");

    const query = { isPrivate: false };
    if (subject) query.subject = { $regex: subject, $options: "i" };

    const groups = await Group.find(query)
      .populate("owner", "name email profilePicture")
      .populate("members", "name email profilePicture")
      .select("-comments")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ groups });
  } catch (err) {
    console.error("[GET_GROUPS]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/groups — create a group
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, subject, description, maxMembers, isPrivate, tags } =
      await req.json();

    if (!name || !subject) {
      return NextResponse.json(
        { error: "name and subject are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const group = await Group.create({
      name,
      subject,
      description,
      maxMembers,
      isPrivate,
      tags,
      owner: session.user.id,
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (err) {
    console.error("[CREATE_GROUP]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}