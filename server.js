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

// ── Per-session lock state for AI / PDF features ──
// { [sessionId]: { ai: { userId, userName } | null, pdf: { userId, userName } | null } }
const sessionLocks = {};

function getSessionLocks(sessionId) {
  if (!sessionLocks[sessionId]) sessionLocks[sessionId] = { ai: null, pdf: null };
  return sessionLocks[sessionId];
}

// ── Track which user is behind each socket ──
// { [socketId]: { userId, userName, sessionId } }
const socketUserMap = {};

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
        socket._userId = userId;
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
    socket.on("join-session", ({ sessionId, userId, userName }) => {
      if (sessionId) {
        socket.join(`session:${sessionId}`);
        // Also join user-specific room for WebRTC signaling
        if (userId) {
          socket.join(`user:${userId}`);
          socket._userId = userId;
          socket._userName = userName;
          socket._sessionId = sessionId;
          socketUserMap[socket.id] = { userId, userName, sessionId };
        }
        console.log(`[SOCKET] User ${userName || socket.id} joined session:${sessionId}`);
        
        // Broadcast user list to the room (with user info)
        const clients = io.sockets.adapter.rooms.get(`session:${sessionId}`);
        const userList = [];
        if (clients) {
          clients.forEach(sid => {
            const info = socketUserMap[sid];
            userList.push({ socketId: sid, userId: info?.userId, userName: info?.userName });
          });
        }
        io.to(`session:${sessionId}`).emit("session-users", userList);
        
        // Send current lock state to the newly joined user
        const locks = getSessionLocks(sessionId);
        socket.emit("feature-lock-state", locks);
      }
    });

    // ── Group Chat — forward to all in group room ──
    socket.on("group-chat", ({ groupId, message }) => {
      // Broadcast to all OTHER sockets in the group
      socket.to(`group:${groupId}`).emit("group-chat", message);
    });

    // ── Direct Messages — forward to target user ──
    socket.on("dm-message", ({ to, message }) => {
      // Send to the target user's personal room
      io.to(`user:${to}`).emit("dm-message", message);
    });

    // ── Generic Forwarding ──
    socket.on("active-tool-sync", ({ sessionId, toolId, data }) => {
      socket.to(`session:${sessionId}`).emit("active-tool-sync", { toolId, data });
    });

    // Whiteboard Sync
    socket.on("draw-data", ({ sessionId, drawingData }) => {
      socket.to(`session:${sessionId}`).emit("draw-data", drawingData);
    });

    socket.on("canvas-clear", (sessionId) => {
      socket.to(`session:${sessionId}`).emit("canvas-clear");
    });

    // ── Pomodoro Sync ──
    socket.on("pomodoro-sync", ({ sessionId, state }) => {
      socket.to(`session:${sessionId}`).emit("pomodoro-sync", state);
    });

    // ── Pomodoro START — broadcasts to ALL (including sender) so everyone gets redirected ──
    socket.on("pomodoro-start", ({ sessionId, state }) => {
      console.log(`[POMODORO] Session started in ${sessionId}`);
      io.to(`session:${sessionId}`).emit("pomodoro-start", state);
    });

    // ── AI / PDF Feature Locking ──
    socket.on("feature-lock", ({ sessionId, feature, userId, userName }) => {
      const locks = getSessionLocks(sessionId);
      if (!locks[feature]) {
        locks[feature] = { userId, userName };
        io.to(`session:${sessionId}`).emit("feature-lock-state", locks);
        console.log(`[LOCK] ${userName} locked ${feature} in session ${sessionId}`);
      } else {
        // Already locked — inform the requester
        socket.emit("feature-lock-denied", { feature, lockedBy: locks[feature] });
      }
    });

    socket.on("feature-unlock", ({ sessionId, feature, userId }) => {
      const locks = getSessionLocks(sessionId);
      if (locks[feature]?.userId === userId) {
        locks[feature] = null;
        io.to(`session:${sessionId}`).emit("feature-lock-state", locks);
        console.log(`[LOCK] ${feature} unlocked in session ${sessionId}`);
      }
    });

    // Media / Screen Sharing signaling
    socket.on("media-status", ({ sessionId, userId, userName, type, status }) => {
      // broadcast who is sharing what (include userName for display)
      socket.to(`session:${sessionId}`).emit("media-status", { userId, userName, type, status });
    });

    socket.on("permission-request", ({ sessionId, from, type }) => {
      // Send to session owner (or everyone for now)
      socket.to(`session:${sessionId}`).emit("permission-request", { from, type });
    });

    socket.on("permission-response", ({ sessionId, to, type, allowed }) => {
      socket.to(`session:${sessionId}`).emit("permission-response", { to, type, allowed });
    });

    // AI Tutor Sync
    socket.on("ai-tutor-sync", ({ sessionId, module }) => {
      console.log(`[AI] Syncing module for session: ${sessionId}`);
      socket.to(`session:${sessionId}`).emit("ai-tutor-sync", module);
    });

    // PDF Sync
    socket.on("pdf-sync", ({ sessionId, fileName, docText }) => {
      console.log(`[PDF] Syncing doc for session: ${sessionId}`);
      socket.to(`session:${sessionId}`).emit("pdf-sync", { fileName, docText });
    });

    // PDF Content Sync (key points + Q&A messages)
    socket.on("pdf-content-sync", ({ sessionId, keyPoints, messages }) => {
      socket.to(`session:${sessionId}`).emit("pdf-content-sync", { keyPoints, messages });
    });

    // ── WebRTC Signaling (mesh) ──
    socket.on("webrtc-offer", ({ sessionId, to, offer, fromUserId, fromUserName }) => {
      io.to(to).emit("webrtc-offer", { from: socket.id, offer, fromUserId, fromUserName });
    });

    socket.on("webrtc-answer", ({ to, answer }) => {
      io.to(to).emit("webrtc-answer", { from: socket.id, answer });
    });

    socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("webrtc-ice-candidate", { from: socket.id, candidate });
    });

    // Legacy signal (keep for compat)
    socket.on("webrtc-signal", ({ sessionId, to, signal }) => {
      if (to) {
        io.to(to).emit("webrtc-signal", { from: socket.id, signal });
      } else {
        socket.to(`session:${sessionId}`).emit("webrtc-signal", { from: socket.id, signal });
      }
    });

    socket.on("disconnecting", () => {
      const info = socketUserMap[socket.id];
      socket.rooms.forEach(room => {
        if (room.startsWith("session:")) {
          const sId = room.replace("session:", "");
          // Release any locks held by this user
          const locks = getSessionLocks(sId);
          if (locks.ai?.userId === info?.userId) { locks.ai = null; io.to(room).emit("feature-lock-state", locks); }
          if (locks.pdf?.userId === info?.userId) { locks.pdf = null; io.to(room).emit("feature-lock-state", locks); }

          // get the room and subtract this user
          const clients = io.sockets.adapter.rooms.get(room);
          const userList = [];
          if (clients) {
            clients.forEach(sid => {
              if (sid !== socket.id) {
                const u = socketUserMap[sid];
                userList.push({ socketId: sid, userId: u?.userId, userName: u?.userName });
              }
            });
          }
          io.to(room).emit("session-users", userList);
        }
      });
      delete socketUserMap[socket.id];
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
