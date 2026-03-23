import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import User from "@/app/models/User";
import Group from "@/app/models/Group";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, history, pdfContext, imageContext, pdfBase64, mimeType, isMittar, pathname } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OpenRouter API Key not set" }, { status: 500 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).lean();

    let messages = [];
    let systemPrompt = "You are MindMesh AI, a helpful study assistant. Answer concisely and helpfully.";
    
    // ── Decide Model (Gemini for PDF, Llama for General) ──
    const isDocumentMode = !!(pdfBase64 || pdfContext);
    const model = isDocumentMode ? "google/gemini-flash-1.5" : "meta-llama/llama-3.1-8b-instruct";

    // ── 1. PDF / Document Analysis (Gemini Mode) ──
    if (isDocumentMode) {
      const content = [];
      if (pdfBase64) {
        content.push({
          type: "image_url", // Gemini handles PDFs via image_url blocks on OpenRouter
          image_url: { url: `data:${mimeType || "application/pdf"};base64,${pdfBase64}` }
        });
      }
      content.push({ type: "text", text: message + (pdfContext ? `\n\nDocument Content:\n${pdfContext}` : "") });

      messages = [
        {
          role: "system",
          content: "You are an expert document analyst. Use the provided document to answer questions accurately and concisely."
        },
        ...(history || []),
        { role: "user", content }
      ];
    }
    // ── 2. Mittar (Llama Mode) ──
    else if (isMittar) {
      let pageContext = "";
      let databaseContext = "";

      const paths = {
        "/Home": "Home",
        "/About": "About",
        "/SDash": "Dashboard",
        "/groups": "Groups",
        "/discover": "Discover",
        "/profile": "Profile"
      };
      
      const currentPath = Object.keys(paths).find(p => pathname.startsWith(p)) || "Study Room";
      pageContext = `Location: ${pathname} (${currentPath}).`;
      
      const userContext = `User Info: ${user.name} (${user.email}). 
      Academic Progress: GPA ${user.academicMetrics?.gpa || 'N/A'}, Attendance ${user.academicMetrics?.attendance || 'N/A'}.
      Joined: ${new Date(user.createdAt).toLocaleDateString()}.`;

      systemPrompt = `You are Mittar, the MindMesh Personal AI Assistant. Your goal is to help the user navigate the platform and manage their study life.
Current Time: ${new Date().toLocaleString()}
${pageContext}
${userContext}

IMPORTANT RULES:
- Keep responses SHORT (1-3 sentences max)
- NEVER say you created a group unless you include the [CREATE_GROUP:{...}] tag
- NEVER describe group creation unless you actually use the tag
- If user asks to create a group but hasn't given enough info, ASK for the missing details

ACTION TAGS (you MUST use these to perform actions):

1. NAVIGATION: Append "[NAVIGATE:path]" to move the user to a page.
   Paths: /Home, /About, /SDash, /groups, /discover, /profile
   Example: "Let's go! [NAVIGATE:/profile]"

2. CREATE GROUP: Append "[CREATE_GROUP:{...}]" with valid JSON to create a group.
   REQUIRED: name, subject
   OPTIONAL: description, maxMembers (number, default 20), date (YYYY-MM-DD), startTime (HH:MM), endTime (HH:MM), isPrivate (boolean), passcode (4-6 digit string)
   
   CRITICAL: If user specifies a member count/size/limit (e.g. "for 5 people"), set maxMembers to EXACTLY that number.
   CRITICAL: If user wants private, they MUST provide a 4-6 digit PIN. If they haven't, ASK for it first.
   CRITICAL: You MUST include the [CREATE_GROUP:...] tag for the group to actually be created. Without it, nothing happens.
   
   Example: "Creating it now! [CREATE_GROUP:{"name":"Math Hub","subject":"Mathematics","maxMembers":5}]"
   Private example: "Done! [CREATE_GROUP:{"name":"Finals Prep","subject":"Science","isPrivate":true,"passcode":"1234","maxMembers":5}]"

Do NOT hallucinate or pretend actions happened. Only confirm an action if you used the correct tag.`;

      messages = [
        { role: "system", content: systemPrompt },
        ...(history?.slice(-6) || []),
        { role: "user", content: message }
      ];
    }
    // ── 3. Default General Chat ──
    else {
      messages = [
        { role: "system", content: systemPrompt },
        ...(history?.slice(-8) || []),
        { role: "user", content: message }
      ];
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
        "X-Title": "MindMesh"
      },
      body: JSON.stringify({
        model,
        max_tokens: 800,
        temperature: isMittar ? 0.15 : 0.4, // very low for Mittar to reduce hallucination
        messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ reply: "AI Error: " + (errorData.error?.message || "Check OpenRouter balance") }, { status: response.status });
    }

    const data = await response.json();
    let reply = data?.choices?.[0]?.message?.content || "No response.";

    // ── Auto-Actions (Mittar group creation) ──
    if (isMittar && reply.includes("[CREATE_GROUP:")) {
      try {
        // More robust JSON extraction — handle both greedy and non-greedy patterns
        let jsonStr = null;
        // Try non-greedy first (most common)
        const match1 = reply.match(/\[CREATE_GROUP:(\{.*?\})\]/s);
        if (match1?.[1]) {
          jsonStr = match1[1];
        } else {
          // Try greedy for nested braces
          const match2 = reply.match(/\[CREATE_GROUP:(\{[^\]]*\})\]/s);
          if (match2?.[1]) jsonStr = match2[1];
        }

        if (jsonStr) {
          // Fix common LLM JSON issues: single quotes, trailing commas
          jsonStr = jsonStr.replace(/'/g, '"').replace(/,\s*}/g, '}');
          const g = JSON.parse(jsonStr);
          
          if (g.name && g.subject) {
             const now = new Date();
             const defaultStartTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
             const defaultEndTime = new Date(now.getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

             // Validate PIN strictly if private (must be 4-6 digits)
             const isPrivate = !!g.isPrivate;
             const rawPin = String(g.passcode || "").trim().replace(/\D/g, "");
             const validPin = /^\d{4,6}$/.test(rawPin) ? rawPin : null;

             // Parse maxMembers — respect user's requested count, clamp to valid range
             let maxMembers = 20; // default
             if (g.maxMembers) {
               const parsed = parseInt(g.maxMembers, 10);
               if (!isNaN(parsed) && parsed >= 2 && parsed <= 100) maxMembers = parsed;
             }

             if (isPrivate && !validPin) {
               // PIN missing or invalid — ask user before creating
               reply = `I'd love to create a private room! Please give me a PIN that's strictly 4–6 digits (e.g. 1234 or 998871) and I'll set it up right away. 🔒`;
             } else {
               const newG = await Group.create({
                 name: g.name,
                 subject: g.subject,
                 description: g.description || `Study group for ${g.subject}`,
                 owner: session.user.id,
                 members: [session.user.id],
                 maxMembers: maxMembers,
                 isPrivate: isPrivate,
                 passcode: isPrivate ? validPin : null,
                 sessions: [{
                   date: new Date(g.date || Date.now()),
                   startTime: g.startTime || defaultStartTime,
                   endTime: g.endTime || defaultEndTime
                 }]
               });
               const privacy = isPrivate ? `🔒 private (PIN: ${validPin})` : "🌐 public";
               reply = `Done! Created your ${privacy} study group **"${g.name}"** (max ${maxMembers} members). Taking you there now. 🚀 [NAVIGATE:/groups/${newG._id}]`;
             }
          } else {
            // Name or subject missing — ask user
            reply = `I need at least a group name and subject to create a group. Could you specify those? For example: "Create a group called Physics Club for Physics"`;
          }
        } else {
          console.warn("[Mittar] CREATE_GROUP tag found but JSON extraction failed. Raw:", reply.slice(0, 200));
          reply = reply.replace(/\[CREATE_GROUP:.*?\]/gs, "").trim();
          reply += "\n\nI had trouble creating the group. Could you try again with something like: \"Create a group called [name] for [subject]\"?";
        }
      } catch (e) { 
        console.error("Mittar Group Creation Error:", e);
        reply = reply.replace(/\[CREATE_GROUP:.*?\]/gs, "").trim();
        reply += "\n\nI tried creating the group but ran into an issue. Please try again with clearer details like: \"Create a group called Math Study for Mathematics with 5 members\".";
      }
    }

    return NextResponse.json({ reply });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ reply: "Server error." }, { status: 500 });
  }
}
