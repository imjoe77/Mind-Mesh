import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

// PATCH /api/users/profile — Update current user's skills for matchmaking
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      skillsToTeach, skillsToLearn, bio, subjects, domains, skillLevel, goal,
      branch, semester, year, rollNumber, institution
    } = await req.json();

    await connectDB();

    const updateFields = {};
    if (skillsToTeach !== undefined) updateFields.skillsToTeach = skillsToTeach;
    if (skillsToLearn !== undefined) updateFields.skillsToLearn = skillsToLearn;
    if (bio !== undefined) updateFields.bio = bio;
    if (subjects !== undefined) updateFields.subjects = subjects;
    if (domains !== undefined) updateFields.domains = domains;
    if (skillLevel !== undefined) updateFields.skillLevel = skillLevel;
    if (goal !== undefined) updateFields.goal = goal;
    if (branch !== undefined) updateFields.branch = branch;
    if (semester !== undefined) updateFields.semester = semester;
    if (year !== undefined) updateFields.year = year;
    if (rollNumber !== undefined) updateFields.rollNumber = rollNumber;
    if (institution !== undefined) updateFields.institution = institution;

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateFields },
      { returnDocument: "after" }
    ).select("name email profilePicture bio domains subjects skillLevel skillsToTeach skillsToLearn goal phone phoneVerified academicMetrics branch semester year rollNumber institution");

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err) {
    console.error("[UPDATE_PROFILE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/users/profile — Get current user's profile
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const user = await User.findById(session.user.id)
      .select("name email profilePicture bio domains subjects skillLevel skillsToTeach skillsToLearn goal phone phoneVerified academicMetrics branch semester year rollNumber institution")
      .lean();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err) {
    console.error("[GET_PROFILE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
