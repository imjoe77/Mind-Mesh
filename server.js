// Custom Socket.IO server that wraps Next.js
// Run with: node server.js (instead of next dev)

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Global io instance — accessible from API routes via globalThis.__io
let io;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.IO
  io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    cors: { origin: "*" },
    addTrailingSlash: false,
  });

  // Expose io globally so API routes can emit events
  globalThis.__io = io;

  // Socket.IO connection handling
  io.on("connection", (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    // ── User Specific Rooms ──
    socket.on("join-user", (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[SOCKET] User ${userId} joined their notification room`);
      }
    });

    socket.on("join-group", (groupId) => {
      if (groupId) {
        socket.join(`group:${groupId}`);
        console.log(`[SOCKET] Socket ${socket.id} joined group:${groupId}`);
      }
    });

    // ── Classroom / Room Signaling ──
    socket.on("join-session", (sessionId) => {
      if (sessionId) {
        socket.join(`session:${sessionId}`);
        console.log(`[SOCKET] User ${socket.id} joined session:${sessionId}`);
      }
    });

    // Whiteboard Sync
    socket.on("draw-data", ({ sessionId, drawingData }) => {
      socket.to(`session:${sessionId}`).emit("draw-data", drawingData);
    });

    socket.on("canvas-clear", (sessionId) => {
      socket.to(`session:${sessionId}`).emit("canvas-clear");
    });

    // Pomodoro Sync
    socket.on("pomodoro-sync", ({ sessionId, state }) => {
      socket.to(`session:${sessionId}`).emit("pomodoro-sync", state);
    });

    // Media / Screen Sharing signaling
    socket.on("media-status", ({ sessionId, userId, type, status }) => {
      // broadcast who is sharing what
      socket.to(`session:${sessionId}`).emit("media-status", { userId, type, status });
    });

    socket.on("permission-request", ({ sessionId, from, type }) => {
      // Send to session owner (or everyone for now)
      socket.to(`session:${sessionId}`).emit("permission-request", { from, type });
    });

    socket.on("permission-response", ({ sessionId, to, type, allowed }) => {
      socket.to(`session:${sessionId}`).emit("permission-response", { to, type, allowed });
    });

    // Real-time Chat
    socket.on("send-message", ({ sessionId, message }) => {
      socket.to(`session:${sessionId}`).emit("new-message", message);
    });

    socket.on("disconnect", () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
  });

  // ── Session checker: runs every 60 seconds ──
  setInterval(async () => {
    try {
      // Hit our own API endpoint to check/activate sessions
      const res = await fetch(`http://${hostname}:${port}/api/sessions/check`);
      const data = await res.json();

      if (data.activated > 0) {
        console.log(`[CRON] Activated ${data.activated} sessions, notified ${data.notified} users`);
        
        // Emit targeted socket events to specific users
        data.notifications.forEach(noti => {
          io.to(`user:${noti.recipient}`).emit("session-activated", {
            title: noti.title,
            message: noti.message,
            link: noti.link,
            groupName: noti.groupName
          });
        });
      }
    } catch (err) {
      // Silently ignore — server may not be ready yet
    }
  }, 60_000); // every 60 seconds

  httpServer.listen(port, () => {
    console.log(`\n✨ MindMesh server ready at http://${hostname}:${port}`);
    console.log(`📡 Socket.IO ready at ws://${hostname}:${port}/api/socketio`);
    console.log(`⏰ Session checker running every 60 seconds\n`);
  });
});
