import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

// POST /api/streak/xp — Add XP to user
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amount, reason } = await req.json();
    if (typeof amount !== "number") {
      return NextResponse.json({ error: "Amount must be a number" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Update XP and Level
    const currentXP = user.academicMetrics?.xp || 0;
    const newXP = currentXP + amount;
    
    // Simple leveling: 100 XP per level
    const newLevel = Math.floor(newXP / 100) + 1;

    await User.updateOne(
      { _id: session.user.id },
      { 
        $set: { 
          "academicMetrics.xp": newXP,
          "academicMetrics.level": newLevel
        }
      }
    );

    console.log(`[XP] User ${user.name} gained ${amount} XP for ${reason || 'activity'}. New total: ${newXP}`);

    return NextResponse.json({ 
      message: "XP updated successfully", 
      xpGained: amount, 
      totalXP: newXP, 
      level: newLevel 
    });
  } catch (err) {
    console.error("[XP_UPDATE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
