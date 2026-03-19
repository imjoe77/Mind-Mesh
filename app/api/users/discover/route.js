import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";

// GET /api/users/discover — Find users with matching skills (ability-based matchmaking)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // People the current user already follows or has pending requests with
    const excludeIds = [
      currentUser._id,
      ...(currentUser.following || []),
      ...(currentUser.followers || []),
    ].map(String);

    // Also exclude people who already sent a request to this user
    const pendingFromIds = (currentUser.followRequests || []).map(r => r.from.toString());
    const allExclude = [...new Set([...excludeIds, ...pendingFromIds])];

    // Build a smart query: prioritize users whose "skillsToTeach" match current user's "skillsToLearn" and vice versa
    const myWants = currentUser.skillsToLearn || [];
    const myOffers = currentUser.skillsToTeach || [];

    // Base query: exclude already connected/blocked users
    let matchQuery = {
      _id: { $nin: allExclude },
    };

    console.log(`[DISCOVER] Finding users for ${session.user.id}, excluding ${allExclude.length} IDs`);

    let users = await User.find(matchQuery)
      .select("name email profilePicture bio domains subjects skillLevel skillsToTeach skillsToLearn goal")
      .limit(50)
      .lean();

    if (users.length === 0) {
      console.log(`[DISCOVER] No direct matches found for query:`, matchQuery);
      // If no users found with current exclusions, maybe there's only the current user?
      // Or everyone is already followed.
    }

    // Calculate a match score for sorting
    const scored = users.map(u => {
      let score = 0;
      // They teach what I want to learn
      const teachList = u.skillsToTeach || [];
      const learnList = u.skillsToLearn || [];
      const userSubjects = u.subjects || [];
      const userDomains = u.domains || [];

      teachList.forEach(s => { if (myWants.includes(s)) score += 5; });
      learnList.forEach(s => { if (myOffers.includes(s)) score += 5; });
      userSubjects.forEach(s => { if ((currentUser.subjects || []).includes(s)) score += 2; });
      userDomains.forEach(d => { if ((currentUser.domains || []).includes(d)) score += 1; });

      return { ...u, matchScore: score };
    });

    // Sort by score descending (best matches first)
    scored.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ 
      users: scored, 
      mySkills: { teach: myOffers, learn: myWants, domains: currentUser.domains || [] } 
    });
  } catch (err) {
    console.error("[DISCOVER_USERS] CRITICAL ERROR:", err);
    return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 });
  }
}
