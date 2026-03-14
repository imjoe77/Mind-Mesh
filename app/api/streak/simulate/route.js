import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

// POST /api/streak/simulate  body: { scenario: "missed_day" | "reset" | "big_streak" }
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { scenario } = await req.json();

    await connectDB();

    if (scenario === "missed_day") {
      // Directly inject grace period state so it shows up immediately on next data refresh
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const graceExpiry = new Date(now.getTime() + 30 * 60 * 60 * 1000); // 30 hours from now
      const savedStreak = 7;

      const quests = [
        {
          id: `quest_quiz_${Date.now()}`,
          title: "Quick Quiz: Programming",
          description: "Answer 5 quick questions to re-sharpen your focus.",
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

      await User.findByIdAndUpdate(session.user.id, {
        $set: {
          "streak.lastLoginDate": today,
          "streak.current": savedStreak,
          "streak.best": savedStreak,
          "streak.graceActive": true,
          "streak.graceExpiresAt": graceExpiry,
          "streak.graceSavedStreak": savedStreak,
          "streak.quests": quests,
        }
      });
      return NextResponse.json({ success: true, status: "grace", streak: savedStreak, graceActive: true, graceExpiresAt: graceExpiry, quests, best: savedStreak, totalXp: 0 });
    }

    if (scenario === "big_streak") {
      // Give a 30-day streak as of yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split("T")[0];

      await User.findByIdAndUpdate(session.user.id, {
        $set: {
          "streak.lastLoginDate": dateStr,
          "streak.current": 30,
          "streak.best": 30,
          "streak.graceActive": false,
          "streak.quests": [],
          "streak.totalXp": 1500,
        }
      });
      return NextResponse.json({ success: true, message: "Simulated: 30-day streak as of yesterday. Refresh dashboard!" });
    }

    if (scenario === "reset") {
      await User.findByIdAndUpdate(session.user.id, {
        $set: {
          "streak.current": 0,
          "streak.best": 0,
          "streak.lastLoginDate": "",
          "streak.graceActive": false,
          "streak.graceExpiresAt": null,
          "streak.quests": [],
          "streak.totalXp": 0,
          "streak.graceSavedStreak": 0,
        }
      });
      return NextResponse.json({ success: true, message: "Streak reset to zero. Refresh dashboard!" });
    }

    return NextResponse.json({ error: "Unknown scenario" }, { status: 400 });

  } catch (err) {
    console.error("[STREAK_SIMULATE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
