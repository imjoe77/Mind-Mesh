"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Minus, Loader2, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const MITTAR_AVATAR = "https://api.dicebear.com/7.x/bottts/svg?seed=Mittar&backgroundColor=b6e3f4,c0aede,d1d4f9";

export default function MittarChat() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const savedMessages = localStorage.getItem("mittar_chat_history");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to load chat history", e);
        setMessages([
          { id: 1, text: "Hi, I'm Mittar! I can help you create groups, analyze your profile, or even navigate the site. Just ask!", sender: "mittar", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);
      }
    } else {
      setMessages([
        { id: 1, text: "Hi, I'm Mittar! I can help you create groups, analyze your profile, or even navigate the site. Just ask!", sender: "mittar", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("mittar_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  const clearChat = () => {
    const initialMessage = { id: 1, text: "Hi, I'm Mittar! I can help you create groups, analyze your profile, or even navigate the site. Just ask!", sender: "mittar", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages([initialMessage]);
    localStorage.setItem("mittar_chat_history", JSON.stringify([initialMessage]));
  };
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, loading]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    if (!session) {
      setMessages(prev => [...prev, { id: Date.now(), text: "Please sign in to chat with me!", sender: "mittar" }]);
      return;
    }

    const userInput = inputValue;
    setMessages(prev => [...prev, { id: Date.now(), text: userInput, sender: "user" }]);
    setInputValue("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userInput, 
          history: messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
          pathname, 
          isMittar: true 
        })
      });

      const data = await res.json();
      let replyText = data.reply || "I'm having a bit of trouble connecting to my brain.";
      
      // ── Client Actions: Navigation ──
      if (replyText.includes("[NAVIGATE:")) {
        const match = replyText.match(/\[NAVIGATE:(.*?)\]/);
        if (match?.[1]) {
          const targetPath = match[1].trim();
          replyText = replyText.replace(/\[NAVIGATE:.*?\]/, "").trim();
          setTimeout(() => { router.push(targetPath); }, 1500);
        }
      }

      setMessages(prev => [...prev, { id: Date.now(), text: replyText, sender: "mittar" }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now(), text: "Sorry, I encountered an error.", sender: "mittar" }]);
    } finally {
      setLoading(false);
    }
  };

  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 }); // Default fallback

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  return (
    <>
      <motion.button
        drag
        dragConstraints={{ 
          left: -windowSize.width + 80, 
          right: 0, 
          top: -windowSize.height + 80, 
          bottom: 0 
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 via-sky-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-sky-500/30 text-white cursor-grab active:cursor-grabbing"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageSquare size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-24 sm:bottom-24 right-4 sm:right-6 z-[9999] w-[calc(100vw-32px)] sm:w-[400px] max-w-[400px] h-[calc(100vh-140px)] sm:h-[550px] max-h-[700px] bg-[#0d1117] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl flex flex-col backdrop-blur-xl"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.05)"
            }}
          >
            <div className="p-4 bg-gradient-to-r from-indigo-900/40 to-sky-900/40 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/[0.1] bg-white/[0.05]">
                    <img src={MITTAR_AVATAR} alt="Mittar" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0d1117]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>Mittar</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest">Active Assistant</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={clearChat} 
                  title="Clear Chat"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-white/[0.05] transition-all"
                >
                  <Trash2 size={16} />
                </button>
                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.05] transition-all">
                  <Minus size={18} />
                </button>
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
              style={{
                scrollbarWidth: "none",
                background: "radial-gradient(circle at 50% -20%, rgba(56, 189, 248, 0.03) 0%, transparent 60%)"
              }}
            >
              <style dangerouslySetInnerHTML={{ __html: `div::-webkit-scrollbar { display: none; }` }} />
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.sender === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.sender === 'mittar' && (
                      <div className="w-7 h-7 rounded-lg overflow-hidden bg-white/[0.05] border border-white/[0.1] flex-shrink-0 mt-1">
                        <img src={MITTAR_AVATAR} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <div className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-lg ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-br from-indigo-600 to-sky-600 text-white rounded-tr-sm'
                          : 'bg-white/[0.05] border border-white/[0.08] text-gray-200 rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white/[0.05] border border-white/[0.08] p-3 rounded-2xl rounded-tl-sm text-sky-400">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                </motion.div>
              )}
            </div>

            <div className="p-4 border-t border-white/[0.08] bg-white/[0.02]">
              <form onSubmit={handleSend} className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Mittar anything..."
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-2xl py-3 pl-4 pr-12 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 flex items-center justify-center transition-all disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </form>
              <p className="text-[10px] text-gray-700 text-center mt-3 font-medium uppercase tracking-[0.1em]">
                MindMesh Assistant · Awareness enabled
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
