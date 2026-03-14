import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, pdfContext, imageContext } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OpenRouter API Key not set" }, { status: 500 });
    }

    let messages;

    // ── IMAGE CHAT MODE ──
    if (imageContext && imageContext.trim().length > 0) {
      const imageData = typeof imageContext === "string" ? { summary: imageContext } : imageContext;
      messages = [
        {
          role: "system",
          content: `You are an AI assistant answering questions about an analyzed image.\n\nImage Summary:\n${imageData.summary}\n\nKey Points:\n${imageData.key_points?.join("\n") || ""}\n\nAnswer questions based only on this information.`
        },
        { role: "user", content: message }
      ];
    }

    // ── DOCUMENT CHAT MODE ──
    else if (pdfContext && pdfContext.trim().length > 0) {
      messages = [
        {
          role: "system",
          content: `You are an AI assistant that answers questions about a document.\nOnly answer using the provided document.\nIf the answer does not exist say: "The document does not contain that information."\n\nDocument:\n${pdfContext}`
        },
        { role: "user", content: message }
      ];
    }

    // ── GENERAL STUDY ASSISTANT MODE ──
    else {
      messages = [
        {
          role: "system",
          content: "You are MindMesh AI, a helpful study assistant. Answer concisely and helpfully."
        },
        { role: "user", content: message }
      ];
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
        "X-Title": "MindMesh Study Room"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct",
        max_tokens: 500,
        temperature: 0.3,
        messages
      })
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "No response from AI.";
    return NextResponse.json({ reply });

  } catch (err) {
    console.error("[CHAT_AI]", err);
    return NextResponse.json({ reply: "Server error occurred." }, { status: 500 });
  }
}
