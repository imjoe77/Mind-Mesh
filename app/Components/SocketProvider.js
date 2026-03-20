"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
// Removed import io from "socket.io-client" to bypass npm issues

const SocketContext = createContext({ socket: null, connected: false });

export function useSocket() {
  return useContext(SocketContext);
}

export default function SocketProvider({ children }) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Connect to Socket.IO server via global window.io provided by Script tag in layout
    if (typeof window === "undefined" || !window.io) {
      console.warn("[SOCKET] window.io not found, retrying...");
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    const s = window.io(backendUrl, {
      path: "/api/socketio",
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      console.log("[SOCKET] Connected:", s.id);
      setConnected(true);
      // Join personal notification room
      s.emit("join-user", session.user.id);
    });

    s.on("disconnect", () => {
      console.log("[SOCKET] Disconnected");
      setConnected(false);
    });

    // When a session is activated, trigger a notification refresh
    s.on("session-activated", (data) => {
      console.log("[SOCKET] Session activated!", data);
      window.dispatchEvent(new CustomEvent("session-activated", { detail: data }));
    });

    // When a message is received
    s.on("new-message", (data) => {
      console.log("[SOCKET] New message received!", data);
      window.dispatchEvent(new CustomEvent("new-message", { detail: data }));
    });

    // When a direct message is received
    s.on("dm-message", (data) => {
      console.log("[SOCKET] DM received!", data);
      window.dispatchEvent(new CustomEvent("new-message", { detail: data }));
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [session?.user?.id]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}
