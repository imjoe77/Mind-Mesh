import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import Group from "@/app/models/Group";
import Notification from "@/app/models/Notification";
import User from "@/app/models/User";

// GET /api/groups — list all public groups, optional ?subject= ?date= filters
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const mine = searchParams.get("mine") === "true";
    const dateParam = searchParams.get("date"); // e.g. "2024-03-15"

    let query = { isPrivate: false };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Date filter: only groups with at least one session on that exact date
    if (dateParam) {
      const filterDate = new Date(dateParam);
      filterDate.setHours(0, 0, 0, 0);
      
      // If the searched date is in the past, return NO groups (Future Only mode)
      if (filterDate < today) {
        return NextResponse.json({ groups: [] });
      }

      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query["sessions.date"] = { $gte: filterDate, $lt: nextDay };
    } else {
      // DEFAULT: Only show groups that have at least one session from today onwards
      query["sessions.date"] = { $gte: today };
    }

    if (subject) query.subject = { $regex: subject, $options: "i" };

    // Checks if user logged in (Filters to 'my' groups)
    if (mine) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Preserve existing filters (date and subject) inside the $and for 'mine' view
      const dateConstraint = query["sessions.date"];
      const subjectConstraint = query.subject;

      query = {
        $and: [
          { "sessions.date": dateConstraint },
          {
            $or: [
              { owner: session.user.id },
              { members: session.user.id }
            ]
          }
        ],
        isPrivate: false
      };

      if (subjectConstraint) {
        query.$and.push({ subject: subjectConstraint });
      }
    }

    //  Log created in DB
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

    const { name, subject, description, maxMembers, isPrivate, tags, sessions, inviteMembers } =
      await req.json();

    if (!name || !subject) {
      return NextResponse.json(
        { error: "name and subject are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Build initial members list: owner + any invited connections
    const initialMembers = [session.user.id];
    if (Array.isArray(inviteMembers)) {
      inviteMembers.forEach(id => {
        if (id && id !== session.user.id && !initialMembers.includes(id)) {
          initialMembers.push(id);
        }
      });
    }

    const group = await Group.create({
      name,
      subject,
      description,
      maxMembers,
      isPrivate: false,
      tags,
      sessions,
      owner: session.user.id,
      members: initialMembers,
    });

    // Create notifications for invited members
    if (Array.isArray(inviteMembers) && inviteMembers.length > 0) {
      const ownerUser = await User.findById(session.user.id).select("name");
      const notificationPromises = inviteMembers.map(async (targetId) => {
        if (targetId && targetId !== session.user.id) {
          return Notification.create({
            recipient: targetId,
            sender: session.user.id,
            type: "GROUP_ADDED",
            title: "Added to Study Group",
            message: `${ownerUser?.name || "Someone"} added you to the group "${name}" to study ${subject}.`,
            link: `/groups/${group._id}`,
          });
        }
      });
      await Promise.all(notificationPromises);
    }

    console.log(`Group created: ${group._id} with ${initialMembers.length} initial member(s)`);
    return NextResponse.json({ group }, { status: 201 });
  } catch (err) {
    console.error("[CREATE_GROUP] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}