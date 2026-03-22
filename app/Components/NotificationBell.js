"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);

    // Listen for real-time socket events
    const handleSessionActivated = () => {
      fetchNotifications();
    };
    window.addEventListener("session-activated", handleSessionActivated);

    return () => {
      clearInterval(interval);
      window.removeEventListener("session-activated", handleSessionActivated);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id = null) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id, all: !id }),
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (noti) => {
    if (!noti.read) markAsRead(noti._id);
    setIsOpen(false);
    if (noti.link) router.push(noti.link);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-indigo-600 transition-all rounded-lg hover:bg-gray-100 group"
      >
        <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-16 sm:top-auto sm:mt-2 w-auto sm:w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[200] overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAsRead()} 
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium uppercase tracking-wider"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((noti) => (
                <button
                  key={noti._id}
                  onClick={() => handleNotificationClick(noti)}
                  className={`w-full text-left p-4 border-b border-slate-800/50 transition-colors hover:bg-slate-800/50 flex gap-3 ${!noti.read ? "bg-indigo-500/5" : ""}`}
                >
                  <div className={`flex-shrink-0 w-2 h-2 mt-1.5 rounded-full ${!noti.read ? "bg-indigo-500" : "bg-transparent"}`} />
                  <div>
                    <p className={`text-sm font-semibold mb-0.5 ${!noti.read ? "text-white" : "text-slate-400"}`}>
                      {noti.title}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {noti.message}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-2">
                      {new Date(noti.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-center">
              <button className="text-xs text-slate-500 hover:text-white transition-colors">
                View all activity
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
