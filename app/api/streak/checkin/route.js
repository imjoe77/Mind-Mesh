import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

function todayStr() {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD in UTC
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function generateRecoveryQuests(domains = []) {
  const topic = domains?.[0] || "Programming";
  return [
    {
      id: `quest_quiz_${Date.now()}`,
      title: `Quick Quiz: ${topic}`,
      description: `Answer 5 quick questions on ${topic} to re-sharpen your focus.`,
      type: "quiz",
      completed: false,
      xp: 60,
    },
    {
      id: `quest_flash_${Date.now() + 1}`,
      title: "Flashcard Review",
      description: "Review 10 key concept flashcards from your current subjects.",
      type: "flashcard",
      completed: false,
      xp: 40,
    },
    {
      id: `quest_session_${Date.now() + 2}`,
      title: "Join Today's Group Session",
      description: "Attend at least one study group session today to restore your streak.",
      type: "join_session",
      completed: false,
      xp: 100,
    },
  ];
}

// POST /api/streak/checkin — called on every dashboard load
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.user.id).select("streak domains").lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const today = todayStr();
    const yesterday = yesterdayStr();
    const now = new Date();

    // Safely default all streak fields for users who existed before this feature
    const streak = {
      current: user.streak?.current || 0,
      best: user.streak?.best || 0,
      lastLoginDate: user.streak?.lastLoginDate || "",
      sessionsAttended: user.streak?.sessionsAttended || 0,
      graceActive: user.streak?.graceActive || false,
      graceExpiresAt: user.streak?.graceExpiresAt || null,
      graceSavedStreak: user.streak?.graceSavedStreak || 0,
      quests: user.streak?.quests || [],
      totalXp: user.streak?.totalXp || 0,
    };
    const lastLogin = streak.lastLoginDate || "";
    let status = "unchanged"; // unchanged | extended | grace | broken | restored

    // Already checked in today → no changes needed
    if (lastLogin === today) {
      return NextResponse.json({
        status: "already_checked_in",
        streak: streak.current,
        best: streak.best,
        graceActive: streak.graceActive,
        graceExpiresAt: streak.graceExpiresAt,
        quests: streak.quests || [],
        totalXp: streak.totalXp || 0,
      });
    }

    // === CASE 1: Consecutive login (yesterday) — extend streak ===
    if (lastLogin === yesterday) {
      streak.current = (streak.current || 0) + 1;
      streak.best = Math.max(streak.best || 0, streak.current);
      streak.lastLoginDate = today;
      streak.graceActive = false;
      streak.quests = [];
      status = "extended";
    }

    // === CASE 2: Grace period is active — check if it expired ===
    else if (streak.graceActive && streak.graceExpiresAt) {
      if (now < new Date(streak.graceExpiresAt)) {
        // Grace still valid, they logged in within grace window
        // Check if all quests are complete
        const allQuestsDone = (streak.quests || []).length > 0 &&
          streak.quests.every(q => q.completed);

        if (allQuestsDone) {
          // Restore the saved streak + 1 for today
          streak.current = (streak.graceSavedStreak || 0) + 1;
          streak.best = Math.max(streak.best || 0, streak.current);
          streak.graceActive = false;
          streak.quests = [];
          status = "restored";
        } else {
          // Grace still active, quests pending
          streak.lastLoginDate = today;
          status = "grace";
        }
      } else {
        // Grace expired — streak breaks
        streak.current = 1;
        streak.graceActive = false;
        streak.quests = [];
        streak.lastLoginDate = today;
        status = "broken";
      }
    }

    // === CASE 3: Missed a day (not yesterday, no active grace) — start grace ===
    else if (lastLogin && lastLogin !== today) {
      // They missed day(s) → activate grace
      streak.graceActive = true;
      streak.graceExpiresAt = new Date(now.getTime() + 30 * 60 * 60 * 1000); // 30 hours
      streak.graceSavedStreak = streak.current || 0;
      streak.quests = generateRecoveryQuests(user.domains);
      streak.lastLoginDate = today;
      status = "grace";
    }

    // === CASE 4: Brand new user (no lastLogin) ===
    else {
      streak.current = 1;
      streak.best = 1;
      streak.lastLoginDate = today;
      streak.graceActive = false;
      streak.quests = [];
      status = "started";
    }

    await User.findByIdAndUpdate(session.user.id, { $set: { streak } });

    return NextResponse.json({
      status,
      streak: streak.current,
      best: streak.best,
      graceActive: streak.graceActive,
      graceExpiresAt: streak.graceExpiresAt,
      quests: streak.quests || [],
      totalXp: streak.totalXp || 0,
    });

  } catch (err) {
    console.error("[STREAK_CHECKIN]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
