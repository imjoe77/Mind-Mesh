import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

// POST /api/streak/complete-quest  body: { questId }
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { questId } = await req.json();
    if (!questId) return NextResponse.json({ error: "Missing questId" }, { status: 400 });

    await connectDB();
    const user = await User.findById(session.user.id).select("streak").lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const streak = {
      current: user.streak?.current || 0,
      best: user.streak?.best || 0,
      graceActive: user.streak?.graceActive || false,
      graceExpiresAt: user.streak?.graceExpiresAt || null,
      graceSavedStreak: user.streak?.graceSavedStreak || 0,
      quests: user.streak?.quests || [],
      totalXp: user.streak?.totalXp || 0,
    };

    const quest = streak.quests.find(q => q.id === questId);
    if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    if (quest.completed) return NextResponse.json({ message: "Already completed" });

    // Mark quest as completed
    quest.completed = true;
    quest.completedAt = new Date();
    streak.totalXp = (streak.totalXp || 0) + (quest.xp || 50);

    // Check if ALL quests now complete → restore streak immediately
    const allDone = streak.quests.every(q => q.completed);
    let streakRestored = false;
    if (allDone && streak.graceActive) {
      streak.current = (streak.graceSavedStreak || 0) + 1;
      streak.best = Math.max(streak.best || 0, streak.current);
      streak.graceActive = false;
      streakRestored = true;
    }

    await User.findByIdAndUpdate(session.user.id, {
      $set: {
        "streak.quests": streak.quests,
        "streak.totalXp": streak.totalXp,
        "streak.graceActive": streak.graceActive,
        "streak.current": streak.current,
        "streak.best": streak.best,
      }
    });

    return NextResponse.json({
      success: true,
      xpEarned: quest.xp,
      totalXp: streak.totalXp,
      allQuestsCompleted: allDone,
      streakRestored,
      newStreak: streak.current,
    });

  } catch (err) {
    console.error("[COMPLETE_QUEST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
