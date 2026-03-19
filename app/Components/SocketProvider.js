"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
// Removed import io from "socket.io-client" to bypass npm issues

const SocketContext = createContext({ socket: null, connected: false });

export function useSocket() {
  return useContext(SocketContext);
}

export default function SocketProvider({ children }) {
  const { data: session } = useSession();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Connect to Socket.IO server via global window.io provided by Script tag in layout
    if (typeof window === "undefined" || !window.io) {
      console.warn("[SOCKET] window.io not found, retrying...");
      return;
    }

    const socket = window.io({
      path: "/api/socketio",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[SOCKET] Connected:", socket.id);
      setConnected(true);
      // Join personal notification room
      socket.emit("join-user", session.user.id);
    });

    socket.on("disconnect", () => {
      console.log("[SOCKET] Disconnected");
      setConnected(false);
    });

    // When a session is activated, trigger a notification refresh
    socket.on("session-activated", (data) => {
      console.log("[SOCKET] Session activated!", data);
      // Dispatch a custom event that NotificationBell can listen to
      window.dispatchEvent(new CustomEvent("session-activated", { detail: data }));
    });

    // When a message is received
    socket.on("new-message", (data) => {
      console.log("[SOCKET] New message received!", data);
      window.dispatchEvent(new CustomEvent("new-message", { detail: data }));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session?.user?.id]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}
