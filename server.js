// Custom Socket.IO server that wraps Next.js
// Run with: node server.js (instead of next dev)

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 10000; // Render uses port 10000 by default
const hostname = "0.0.0.0"; // Allow external connections


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

    // User joins their personal notification room
    socket.on("join-user", (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[SOCKET] User ${userId} joined their notification room`);
      }
    });

    // User joins a group room (for group-wide broadcasts)
    socket.on("join-group", (groupId) => {
      if (groupId) {
        socket.join(`group:${groupId}`);
        console.log(`[SOCKET] Socket ${socket.id} joined group:${groupId}`);
      }
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
