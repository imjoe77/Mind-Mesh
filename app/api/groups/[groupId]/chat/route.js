import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/auth";
import connectDB from "@/db/connectDB";
import mongoose from "mongoose";

// Simple in-memory chat store per group (resets on server restart)
// For production, persist in MongoDB with a Message model
const chatStore = {};

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = params;
  const messages = chatStore[groupId] || [];
  return NextResponse.json({ messages });
}

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = params;
  const { text } = await req.json();

  if (!text?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  if (!chatStore[groupId]) chatStore[groupId] = [];

  const msg = {
    _id: Date.now().toString(),
    sender: { _id: session.user.id, name: session.user.name || "Member" },
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  chatStore[groupId].push(msg);

  // Emit via Socket.IO if available
  if (globalThis.__io) {
    globalThis.__io.to(`group:${groupId}`).emit("group-chat", msg);
    // Also emit as new-message for session-based chat panels
    globalThis.__io.to(`group:${groupId}`).emit("new-message", msg);
  }

  // Keep last 100 messages
  if (chatStore[groupId].length > 100) chatStore[groupId].shift();

  return NextResponse.json({ success: true, message: msg });
}
