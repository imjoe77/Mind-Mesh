"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  PenLine, MessageSquare, FileText, Brain,
  Video, Timer, Music2, X, Monitor, Camera,
  Play, Pause, RotateCcw, Trash2, Send,
  ChevronRight, BookOpen, Map, HelpCircle,
  Link2, Zap, ArrowRight, RefreshCw, ShieldCheck, Menu, Lock,
} from "lucide-react";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

/* ══════════════════════════════════════════════════════════════════
   POMODORO
══════════════════════════════════════════════════════════════════ */
function PomodoroPanel({ socket, sessionId }) {
  const MODES  = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const LABELS = { work: "Focus", short: "Short Break", long: "Long Break" };
  const [mode, setMode]       = useState("work");
  const [secs, setSecs]       = useState(MODES.work);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles]   = useState(0);
  const intervalRef           = useRef(null);

  useEffect(() => {
    if (!socket) return;
    const onSync = (state) => {
      setMode(state.mode);
      setSecs(state.secs);
      setRunning(state.running);
      if (state.cycles !== undefined) setCycles(state.cycles);
    };
    socket.on("pomodoro-sync", onSync);
    return () => socket.off("pomodoro-sync", onSync);
  }, [socket]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setCycles(c => c + 1);
            if (typeof window !== "undefined") new Audio("/notify.mp3").play().catch(() => {});
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const emitSync = (updates) => {
    if (!socket) return;
    socket.emit("pomodoro-sync", {
      sessionId,
      state: { mode, secs, running, cycles, ...updates }
    });
  };

  const switchMode = (m) => {
    setRunning(false);
    setMode(m);
    setSecs(MODES[m]);
    emitSync({ running: false, mode: m, secs: MODES[m] });
  };

  const toggleRunning = () => {
    const nextVal = !running;
    setRunning(nextVal);
    if (nextVal) {
      // Starting the timer — broadcast to ALL so everyone gets redirected
      if (socket) socket.emit("pomodoro-start", { sessionId, state: { mode, secs, running: true, cycles } });
    }
    emitSync({ running: nextVal });
  };

  const resetTimer = () => {
    setRunning(false);
    setSecs(MODES[mode]);
    emitSync({ running: false, secs: MODES[mode] });
  };

  const mins  = String(Math.floor(secs / 60)).padStart(2, "0");
  const sec2  = String(secs % 60).padStart(2, "0");
  const pct   = ((MODES[mode] - secs) / MODES[mode]) * 100;
  const stroke = mode === "work" ? "#38bdf8" : "#34d399";

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.07]">
        {Object.keys(MODES).map(m => (
          <button key={m} onClick={() => switchMode(m)}
            className={`text-xs px-4 py-2 rounded-lg font-bold transition-all ${
              mode === m ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md" : "text-gray-500 hover:text-gray-300"
            }`}>{LABELS[m]}</button>
        ))}
      </div>
      <div className="relative w-52 h-52">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle cx="50" cy="50" r="44" fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
            className="transition-all duration-1000"
            style={{ filter: `drop-shadow(0 0 6px ${stroke})` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-white font-mono tracking-tighter">{mins}:{sec2}</span>
          <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">{LABELS[mode]}</span>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={toggleRunning}
          className={`flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm transition-all ${
            running ? "bg-amber-500/10 border border-amber-500/30 text-amber-400" : "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20"
          }`}>
          {running ? <><Pause style={{ width: 15, height: 15 }} />Pause</> : <><Play style={{ width: 15, height: 15 }} />Start</>}
        </button>
        <button onClick={resetTimer}
          className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white transition-all">
          <RotateCcw style={{ width: 14, height: 14 }} />
        </button>
      </div>
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-8 py-4 text-center">
        <div className="text-3xl font-black text-sky-400">{cycles}</div>
        <div className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">Sessions Completed</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   WHITEBOARD
══════════════════════════════════════════════════════════════════ */
function WhiteboardPanel({ socket, sessionId }) {
  const canvasRef = useRef(null);
  const [tool, setTool]   = useState("pen");
  const [color, setColor] = useState("#38bdf8");
  const [size, setSize]   = useState(3);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  const drawOnCanvas = useCallback((data) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.lineWidth = data.tool === "eraser" ? data.size * 5 : data.size;
    ctx.strokeStyle = data.tool === "eraser" ? "#060810" : data.color;
    ctx.beginPath();
    ctx.moveTo(data.from.x, data.from.y);
    ctx.lineTo(data.to.x, data.to.y);
    ctx.stroke();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("draw-data", drawOnCanvas);
    socket.on("canvas-clear", () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#060810";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    return () => {
      socket.off("draw-data");
      socket.off("canvas-clear");
    };
  }, [socket, drawOnCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#060810";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    if (e.touches) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const startDraw = (e) => { drawing.current = true; lastPos.current = getPos(e, canvasRef.current); };
  const draw = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    const drawData = { from: lastPos.current, to: pos, color, size, tool };
    drawOnCanvas(drawData);
    if (socket) socket.emit("draw-data", { sessionId, drawingData: drawData });
    lastPos.current = pos;
  };
  const stopDraw = () => { drawing.current = false; };
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#060810";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (socket) socket.emit("canvas-clear", sessionId);
  };
  const COLORS = ["#38bdf8","#818cf8","#34d399","#f59e0b","#f87171","#e879f9","#ffffff"];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02] flex-wrap flex-shrink-0">
        {[["pen","Pen"],["eraser","Eraser"]].map(([t,label]) => (
          <button key={t} onClick={() => setTool(t)}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
              tool === t ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white" : "bg-white/[0.04] border border-white/[0.07] text-gray-500 hover:text-gray-300"
            }`}>{label}</button>
        ))}
        <div className="flex gap-1.5 items-center">
          {COLORS.map(c => (
            <button key={c} onClick={() => { setColor(c); setTool("pen"); }}
              className={`w-5 h-5 rounded-full transition-transform ${color === c && tool === "pen" ? "scale-125 ring-2 ring-white/40" : "hover:scale-110"}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <input type="range" min="1" max="20" value={size} onChange={e => setSize(+e.target.value)} className="w-20 accent-sky-500" />
        <button onClick={clearCanvas}
          className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-rose-500/[0.07] border border-rose-500/20 text-rose-400 hover:bg-rose-500/15 transition">
          <Trash2 style={{ width: 12, height: 12 }} /> Clear
        </button>
      </div>
      <canvas ref={canvasRef} className="flex-1 w-full cursor-crosshair touch-none"
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PDF PANEL
══════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════
   PDF PANEL
   Step 1: Upload → /api/pdf → pdfreader extracts real text
   Step 2: Q&A → /api/chat → OpenRouter Llama with full doc context
══════════════════════════════════════════════════════════════════ */
function PDFPanel({ socket, sessionId, syncedData, syncedContent, featureLocks, session }) {
  const [fileName,   setFileName]   = useState("");
  const [docText,    setDocText]    = useState("");
  const [uploading,  setUploading]  = useState(false);

  useEffect(() => {
    if (syncedData?.docText) {
      setFileName(syncedData.fileName);
      setDocText(syncedData.docText);
    }
  }, [syncedData]);

  const [question,   setQuestion]   = useState("");
  const [messages,   setMessages]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [keyPoints,  setKeyPoints]  = useState(null);
  const [error,      setError]      = useState("");
  const [dragging,   setDragging]   = useState(false);
  const [ocrUsed,    setOcrUsed]    = useState(false);

  // Restore content from global sync if available (eg. on joining session)
  useEffect(() => {
    if (syncedContent) {
      if (syncedContent.keyPoints) setKeyPoints(syncedContent.keyPoints);
      if (syncedContent.messages) setMessages(syncedContent.messages);
    }
  }, [syncedContent]);

  // Listen for synced PDF content (keyPoints + Q&A) from other users while panel is open
  useEffect(() => {
    if (!socket) return;
    const onContentSync = (data) => {
      if (data.keyPoints) setKeyPoints(data.keyPoints);
      if (data.messages) setMessages(data.messages);
    };
    socket.on("pdf-content-sync", onContentSync);
    return () => socket.off("pdf-content-sync", onContentSync);
  }, [socket]);
  const fileRef   = useRef(null);
  const bottomRef = useRef(null);

  const pdfLock = featureLocks?.pdf;
  const isLockedByOther = pdfLock && pdfLock.userId !== session?.user?.id;
  const isLockedByMe = pdfLock && pdfLock.userId === session?.user?.id;

  const acquireLock = () => {
    if (!socket || isLockedByMe) return true;
    if (isLockedByOther) { toast.error(`\ud83d\udd12 PDF is being used by ${pdfLock.userName}`); return false; }
    socket.emit("feature-lock", { sessionId, feature: "pdf", userId: session?.user?.id, userName: session?.user?.name });
    return true;
  };
  const releaseLock = () => {
    if (socket && isLockedByMe) socket.emit("feature-unlock", { sessionId, feature: "pdf", userId: session?.user?.id });
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const handleFile = async (file) => {
    if (!file) return;
    if (!acquireLock()) return;
    setMessages([]); setKeyPoints(null); setError(""); setDocText(""); setFileName(file.name);
    setExtracting(true);
    try {
      let text = "";
      if (file.type === "text/plain") {
        text = (await file.text()).slice(0, 12000);
      } else {
        const form = new FormData();
        form.append("file", file);
        const res  = await fetch("/api/pdf", { method: "POST", body: form });
        const data = await res.json();
        if (data.isScanned) {
          // Scanned PDF — guide user to use txt instead
          throw new Error("scanned");
        }
        if (data.error) throw new Error(data.error);
        text = data.documentText || "";
        setOcrUsed(false);
        if (!text.trim()) throw new Error("PDF appears empty. Try a different file.");
      }
      setDocText(text);
      setOcrUsed(false);
      // Emit sync for other users
      if (socket) {
        socket.emit("pdf-sync", { sessionId, fileName: file.name, docText: text });
      }
      await autoExtract(text);
    } catch (e) {
      console.error("[PDF_UPLOAD]", e);
      if (e.message === "scanned") {
        setError("⚠️ This PDF is a scanned image — no text layer found. Export it as a text PDF, or copy-paste the content into a .txt file and upload that.");
      } else {
        setError(e.message || "Failed to read file.");
      }
    } finally { setExtracting(false); }
  };

  const autoExtract = async (text) => {
    try {
      const prompt = `Analyze this document for a student. Return ONLY raw JSON with no markdown:
{"topic":"one sentence about the document","points":["key point 1","key point 2","key point 3","key point 4","key point 5"],"predictions":["reasoned inference 1","reasoned inference 2"]}

Document:
${text.slice(0, 5000)}`;
      const res  = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: prompt }) });
      const data = await res.json();
      const raw  = (data.reply || "").replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/,"").trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setKeyPoints(parsed);
        // Sync key points to all users
        if (socket) socket.emit("pdf-content-sync", { sessionId, keyPoints: parsed, messages: [] });
      }
    } catch (e) { console.error("[PDF_AUTOEXTRACT]", e); }
  };

  const sendQuestion = async () => {
    const q = question.trim();
    if (!q || loading || !docText) return;
    setLoading(true); setError("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setQuestion("");
    try {
      const historyCtx = messages.slice(-6).map(m => `${m.role === "user" ? "Student" : "AI"}: ${m.text}`).join("\n");
      const fullPrompt = `You are an expert document analyst. A student uploaded a document and is asking questions.

DOCUMENT:
${docText.slice(0, 7000)}

${historyCtx ? `CONVERSATION:\n${historyCtx}\n` : ""}STUDENT QUESTION: ${q}

Answer based on the document. If predicting beyond what is stated, prefix with "Based on the document, I can infer...". If not in the document, say so honestly.`;
      const res  = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: fullPrompt }) });
      const data = await res.json();
      const newMsg = { role: "assistant", text: data.reply || "No response received." };
      setMessages(prev => {
        const updated = [...prev, newMsg];
        // Sync Q&A to all users
        if (socket) socket.emit("pdf-content-sync", { sessionId, keyPoints, messages: updated });
        return updated;
      });
    } catch (e) {
      console.error("[PDF_QA]", e);
      setError("Failed to get response. Try again.");
      setMessages(prev => prev.slice(0, -1));
    } finally { setLoading(false); }
  };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };
  const reset  = () => { setDocText(""); setFileName(""); setMessages([]); setKeyPoints(null); setError(""); setOcrUsed(false); releaseLock(); };
  const hasDoc = !!docText;

  return (
    <div className="flex flex-col h-full">
      {isLockedByOther && (
        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
          <Lock className="text-amber-400" style={{ width: 14, height: 14 }} />
          <p className="text-xs text-amber-400 font-semibold">{pdfLock.userName} is using PDF Analysis — view only mode</p>
        </div>
      )}
      {!hasDoc && !extracting && (
        <div className="flex flex-col gap-4 p-5 h-full justify-center">
          <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => fileRef.current?.click()}
            className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${dragging ? "border-sky-400 bg-sky-500/[0.05]" : "border-white/[0.1] bg-white/[0.02] hover:border-sky-500/40 hover:bg-sky-500/[0.03]"}`}>
            <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            <FileText className="mx-auto text-gray-600 mb-3" style={{ width: 32, height: 32 }} />
            <p className="text-sm font-bold text-gray-300">Drop your document here</p>
            <p className="text-xs text-gray-600 mt-1">PDF · TXT</p>
            <p className="text-[10px] text-gray-700 mt-3">Full text extracted via pdfreader — AI reads every word</p>
          </div>
          {error && <p className="text-xs text-rose-400 text-center px-4">{error}</p>}
        </div>
      )}
      {extracting && (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-sky-500/20 border-t-sky-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.7s" }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white">Extracting document text...</p>
            <p className="text-xs text-gray-600 mt-1">Reading every page</p>
          </div>
        </div>
      )}
      {hasDoc && (
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <FileText className="text-indigo-400" style={{ width: 13, height: 13 }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-300 truncate">{fileName}</p>
              <p className="text-[10px] text-gray-600">{docText.length.toLocaleString()} chars extracted · {ocrUsed ? <span className="text-amber-400 font-semibold">Vision OCR used</span> : "OpenRouter Llama"}</p>
            </div>
            <button onClick={reset} className="text-gray-600 hover:text-rose-400 transition-colors text-xs font-semibold flex-shrink-0">✕ Remove</button>
          </div>
          {keyPoints && (
            <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.01] flex-shrink-0 max-h-56 overflow-y-auto space-y-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-1">📌 Topic</p>
                <p className="text-xs text-gray-300 font-semibold leading-relaxed">{keyPoints.topic}</p>
              </div>
              {keyPoints.points?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1.5">🔑 Key Points</p>
                  <div className="space-y-1">{keyPoints.points.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
                      <span className="text-indigo-500 text-[10px] flex-shrink-0 mt-0.5 font-bold">{i+1}.</span>
                      <p className="text-xs text-gray-400 leading-relaxed">{pt}</p>
                    </div>
                  ))}</div>
                </div>
              )}
              {keyPoints.predictions?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1.5">🔮 AI Inferences</p>
                  <div className="space-y-1">{keyPoints.predictions.map((pr, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/[0.05] border border-amber-500/10">
                      <span className="text-amber-500 text-[10px] flex-shrink-0 mt-0.5">◈</span>
                      <p className="text-xs text-amber-300/80 italic leading-relaxed">{pr}</p>
                    </div>
                  ))}</div>
                </div>
              )}
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-600 text-xs mb-3">Ask anything about this document</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["Summarize this document","What are the main conclusions?","What can you predict from this?","List all important definitions","What topics should I study more?"].map(chip => (
                    <button key={chip} onClick={() => setQuestion(chip)} className="text-[10px] px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-gray-500 hover:text-gray-300 hover:border-sky-500/25 transition-all">{chip}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 ${m.role === "user" ? "bg-sky-600 text-white" : "bg-indigo-500/20 border border-indigo-500/20 text-indigo-400"}`}>
                  {m.role === "user" ? "Y" : "AI"}
                </div>
                <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${m.role === "user" ? "bg-sky-600/20 border border-sky-500/20 text-gray-200" : "bg-white/[0.04] border border-white/[0.07] text-gray-300"}`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 flex-shrink-0">AI</div>
                <div className="px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                  <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
                </div>
              </div>
            )}
            {error && <p className="text-xs text-rose-400 text-center">{error}</p>}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 border-t border-white/[0.06] flex gap-2 flex-shrink-0">
            <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendQuestion()} placeholder="Ask about the document or request a prediction..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500 transition" />
            <button onClick={sendQuestion} disabled={loading || !question.trim()} className="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity">
              <Send style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MEDIA PANEL — WebRTC mesh for multi-user video/screen
══════════════════════════════════════════════════════════════════ */
const ICE_CFG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

// Robust helper component for individual remote streams to ensure srcObject attachment
function RemoteVideo({ sid, stream, userName }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        console.log(`[RTC] Stream attached for ${userName} (${sid})`);
      }
    }
  }, [stream, sid, userName]);

  return (
    <div key={sid} className="relative aspect-video rounded-2xl overflow-hidden border border-emerald-500/20 bg-[#0d1117] group">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/60 text-[10px] text-white font-bold flex items-center gap-1 group-hover:bg-black/80 transition-all border border-white/[0.05]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {userName}
      </div>
    </div>
  );
}

// Detect mobile devices
const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

function MediaPanel({ socket, sessionId, camStream, setCamStream, screenStream, setScreenStream, session, activeSharers, sessionUsers }) {
  const camVideoRef    = useRef(null);
  const screenVideoRef = useRef(null);
  const peersRef       = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});

  // Refs for stale closure prevention
  const socketRef  = useRef(socket);
  const sessionRef = useRef(session);
  const usersRef   = useRef(sessionUsers);
  const camRef     = useRef(camStream);
  const screenRef  = useRef(screenStream);
  
  useEffect(() => { 
    socketRef.current = socket; 
    sessionRef.current = session;
    usersRef.current = sessionUsers;
    camRef.current = camStream;
    screenRef.current = screenStream;
  }, [socket, session, sessionUsers, camStream, screenStream]);

  // Force attach local streams to refs
  useEffect(() => { if (camVideoRef.current && camStream) camVideoRef.current.srcObject = camStream; }, [camStream]);
  useEffect(() => { if (screenVideoRef.current && screenStream) screenVideoRef.current.srcObject = screenStream; }, [screenStream]);

  // ── Create/Register a Peer ──
  const makePeer = (targetSocketId, initiator, targetName) => {
    let pc = peersRef.current[targetSocketId];
    
    // Create new ONLY if none exists or closed
    if (!pc || pc.signalingState === "closed") {
      pc = new RTCPeerConnection(ICE_CFG);
      peersRef.current[targetSocketId] = pc;
    }

    // Attach ALL current local tracks (Audio + Video)
    if (camStream) {
      camStream.getTracks().forEach(track => {
        const alreadyAdded = pc.getSenders().find(s => s.track === track);
        if (!alreadyAdded) { try { pc.addTrack(track, camStream); } catch (e) {}}
      });
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        const alreadyAdded = pc.getSenders().find(s => s.track === track);
        if (!alreadyAdded) { try { pc.addTrack(track, screenStream); } catch (e) {}}
      });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("webrtc-ice-candidate", { to: targetSocketId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      console.log(`[RTC] Track received from ${targetName} (${e.track.kind})`);
      setRemoteStreams(prev => {
        const existing = prev[targetSocketId];
        let stream = e.streams[0];
        
        // Reconstruct stream if missing (common in some Firefox/Safari versions)
        if (!stream) {
          if (existing?.stream) {
            existing.stream.addTrack(e.track);
            stream = existing.stream;
          } else {
            stream = new MediaStream([e.track]);
          }
        }
        
        return {
          ...prev,
          [targetSocketId]: { stream, userName: targetName || existing?.userName || "Peer" }
        };
      });
    };

    pc.oniceconnectionstatechange = () => {
      if (["failed", "closed"].includes(pc.iceConnectionState)) {
        console.log(`[RTC] Peer ${targetSocketId} connection state: ${pc.iceConnectionState}`);
        pc.close();
        delete peersRef.current[targetSocketId];
        setRemoteStreams(prev => { const n = { ...prev }; delete n[targetSocketId]; return n; });
      }
    };

    if (initiator) {
      pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          socketRef.current?.emit("webrtc-offer", {
            sessionId, to: targetSocketId, offer: pc.localDescription,
            fromUserId: sessionRef.current?.user?.id, fromUserName: sessionRef.current?.user?.name
          });
        }).catch(e => console.error("[RTC] offer error:", e));
    }

    return pc;
  };

  // ── Connection Lifecycle (Signaling) ──
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ from, offer, fromUserName }) => {
      const pc = makePeer(from, false, fromUserName);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { to: from, answer: pc.localDescription });
      } catch (e) { console.error("[RTC] answer err:", e); }
    };

    const handleAnswer = async ({ from, answer }) => {
      const pc = peersRef.current[from];
      if (pc && pc.signalingState === "have-local-offer") {
        try { await pc.setRemoteDescription(new RTCSessionDescription(answer)); }
        catch (e) { console.error("[RTC] answer set err:", e); }
      }
    };

    const handleIce = async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (pc && pc.remoteDescription) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
      }
    };

    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIce);

    return () => {
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIce);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // Sync connections whenever media or user-list changes
  useEffect(() => {
    if (!socket) return;
    const hasMedia = !!(camStream || screenStream);
    
    const syncAll = () => {
      (sessionUsers || []).forEach(u => {
        if (u.socketId && u.socketId !== socket.id) {
          const pc = peersRef.current[u.socketId];
          const isRemoteSharing = activeSharers["camera"]?.userId === u.userId || activeSharers["screen"]?.userId === u.userId;
          
          // If we share, we must ensure an offer is sent
          if (hasMedia) {
             makePeer(u.socketId, true, u.userName);
          } 
          // If they share and we aren't connected, we initiate to receive
          else if (isRemoteSharing && !pc) {
             makePeer(u.socketId, true, u.userName);
          }
        }
      });
    };

    const timer = setTimeout(syncAll, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camStream, screenStream, socket, sessionUsers, activeSharers]);

  const toggleCam = async () => {
    if (camStream) {
      camStream.getTracks().forEach(t => t.stop());
      setCamStream(null);
      socket?.emit("media-status", { sessionId, userId: session?.user?.id, userName: session?.user?.name, type: "camera", status: "off" });
    } else {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
        setCamStream(s);
        socket?.emit("media-status", { sessionId, userId: session?.user?.id, userName: session?.user?.name, type: "camera", status: "on" });
      } catch { toast.error("Camera access denied."); }
    }
  };

  const toggleScreen = async () => {
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
      socket?.emit("media-status", { sessionId, userId: session?.user?.id, userName: session?.user?.name, type: "screen", status: "off" });
    } else {
      if (isMobileDevice()) { toast.info("📱 Screen sharing is unavailable on mobile."); return; }
      try {
        const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(s);
        socket?.emit("media-status", { sessionId, userId: session?.user?.id, userName: session?.user?.name, type: "screen", status: "on" });
        s.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
          socket?.emit("media-status", { sessionId, userId: session?.user?.id, userName: session?.user?.name, type: "screen", status: "off" });
        };
      } catch {}
    }
  };

  const remoteEntries = Object.entries(remoteStreams);
  const total = (camStream ? 1 : 0) + (screenStream ? 1 : 0) + remoteEntries.length;
  const grid = total <= 1 ? "grid-cols-1" : total <= 4 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-2 md:grid-cols-3";

  return (
    <div className="flex flex-col gap-4 p-3 md:p-5 h-full overflow-y-auto">
      <div className="flex gap-3 justify-center">
        <button onClick={toggleCam} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${camStream ? "bg-rose-500/20 border-rose-500/30 text-rose-400" : "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20"}`}>
          <Camera style={{ width: 14, height: 14 }} /> {camStream ? "Stop Camera" : "Start Camera"}
        </button>
        <button onClick={toggleScreen} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${screenStream ? "bg-rose-500/20 border-rose-500/30 text-rose-400" : "bg-white/[0.05] border border-white/[0.08] text-gray-300 hover:bg-white/[0.08]"}`}>
          <Monitor style={{ width: 14, height: 14 }} /> {screenStream ? "Stop Sharing" : "Share Screen"}
        </button>
      </div>

      <div className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest">
        {sessionUsers.length} in session • {remoteEntries.length} connected
      </div>

      <div className={`grid ${grid} gap-3`}>
        {camStream && (
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d1117]">
            <video ref={camVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/60 text-[10px] text-white font-bold border border-white/[0.05]">You (Camera)</div>
          </div>
        )}
        {screenStream && (
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-sky-500/30 bg-[#0d1117]">
            <video ref={screenVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/60 text-[10px] text-white font-bold border border-white/[0.05]">You (Screen)</div>
          </div>
        )}
        {remoteEntries.map(([sid, { stream, userName }]) => (
          <RemoteVideo key={sid} sid={sid} stream={stream} userName={userName} />
        ))}
      </div>

      {total === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-40">
          <Video className="text-gray-400 mb-3" style={{ width: 40, height: 40 }} />
          <p className="text-sm font-bold text-gray-500">Live study room is active</p>
          <p className="text-xs text-gray-600">Start your camera to see others</p>
        </div>
      )}

      <div className="mt-auto p-4 rounded-xl border border-sky-500/15 bg-sky-500/[0.04] text-center">
        <p className="text-[10px] text-gray-500 max-w-xs mx-auto">
          Connected via Peer-to-Peer WebRTC. High quality video depends on your network stability.
        </p>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════
   MUSIC PANEL
══════════════════════════════════════════════════════════════════ */
const GENRES = [
  { id:"lofi",label:"Lo-Fi",emoji:"🎵",tag:"lofi"},{id:"jazz",label:"Jazz",emoji:"🎷",tag:"jazz"},
  {id:"classical",label:"Classical",emoji:"🎻",tag:"classical"},{id:"electronic",label:"Electronic",emoji:"⚡",tag:"electronic"},
  {id:"ambient",label:"Ambient",emoji:"🌌",tag:"ambient"},{id:"relaxation",label:"Chill",emoji:"🌿",tag:"relaxation"},
];
const CURATED = [
  {title:"Lo-fi Hip Hop",emoji:"🎵",url:"https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0"},
  {title:"Deep Focus",emoji:"🧘",url:"https://www.youtube.com/embed/WPni755-Krg?autoplay=0"},
  {title:"Jazz Coffee",emoji:"☕",url:"https://www.youtube.com/embed/Dx5qFachd3A?autoplay=0"},
  {title:"Nature Sounds",emoji:"🌿",url:"https://www.youtube.com/embed/q76bMs-NwRk?autoplay=0"},
];
function getPlaylistEmbed(url) {
  try {
    if (url.includes("spotify.com")) { const m = url.match(/spotify\.com\/(playlist|album|track|artist)\/([a-zA-Z0-9]+)/); if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`; }
    if (url.includes("soundcloud.com")) return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%2338bdf8&auto_play=false&visual=true`;
    if (url.includes("youtube.com") || url.includes("youtu.be")) { const l = url.match(/[?&]list=([a-zA-Z0-9_-]+)/); const v = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/); if (l) return `https://www.youtube.com/embed/videoseries?list=${l[1]}`; if (v) return `https://www.youtube.com/embed/${v[1]}`; }
    return null;
  } catch { return null; }
}

function MusicPanel() {
  const [tab,setTab]=useState("genres");const [genre,setGenre]=useState(null);const [tracks,setTracks]=useState([]);const [loadingTracks,setLoadingTracks]=useState(false);const [currentTrack,setCurrentTrack]=useState(null);const [playlistUrl,setPlaylistUrl]=useState("");const [embedUrl,setEmbedUrl]=useState(null);const [curatedTrack,setCuratedTrack]=useState(null);const [noKey,setNoKey]=useState(false);
  const JAMENDO_ID = process.env.NEXT_PUBLIC_JAMENDO_CLIENT_ID || "b6747d04";
  const fetchByGenre = async (g) => {
    setGenre(g);setTracks([]);setCurrentTrack(null);setLoadingTracks(true);
    try { const res=await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_ID}&format=json&limit=10&fuzzytags=${g.tag}&include=musicinfo&audioformat=mp32`);const data=await res.json();if(data.results?.length){setTracks(data.results);setCurrentTrack(data.results[0]);}else setTracks([]); } catch { setNoKey(true); } finally { setLoadingTracks(false); }
  };
  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-white/[0.06] flex-shrink-0">
        {[["genres","Browse"],["import","Import"],["curated","Curated"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${tab===id?"border-sky-500 text-sky-400 bg-sky-500/[0.04]":"border-transparent text-gray-600 hover:text-gray-300"}`}>{label}</button>
        ))}
      </div>
      {tab==="genres"&&<div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-2">{GENRES.map(g=><button key={g.id} onClick={()=>fetchByGenre(g)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm transition ${genre?.id===g.id?"bg-sky-500/10 border-sky-500/40 text-sky-300":"bg-white/[0.03] border-white/[0.07] text-gray-500 hover:border-sky-500/25 hover:text-gray-300"}`}><span className="text-xl">{g.emoji}</span><span className="text-xs font-semibold">{g.label}</span></button>)}</div>
        {loadingTracks&&<div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"/></div>}
        {noKey&&<div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 text-xs text-amber-400">Jamendo API unreachable. Use Curated tab.</div>}
        {currentTrack&&<div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3"><p className="text-[10px] text-sky-400 uppercase tracking-widest font-bold mb-2">▶ Now Playing</p><p className="text-sm font-bold text-white truncate">{currentTrack.name}</p><p className="text-xs text-gray-500 truncate">{currentTrack.artist_name}</p><audio controls className="w-full mt-2 h-8" style={{colorScheme:"dark"}} src={currentTrack.audio} key={currentTrack.id} autoPlay /></div>}
        {tracks.length>0&&<div className="space-y-1 overflow-y-auto">{tracks.map(t=><button key={t.id} onClick={()=>setCurrentTrack(t)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition ${currentTrack?.id===t.id?"bg-sky-500/[0.08] border border-sky-500/25":"hover:bg-white/[0.04] border border-transparent"}`}><div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.05]"><img src={t.album_image||t.image} alt="" className="w-full h-full object-cover" onError={e=>e.target.style.display="none"}/></div><div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-200 truncate">{t.name}</p><p className="text-[10px] text-gray-600 truncate">{t.artist_name}</p></div>{currentTrack?.id===t.id&&<span className="text-sky-400 text-xs">▶</span>}</button>)}</div>}
        {!loadingTracks&&!genre&&<div className="text-center py-10 text-gray-600 text-sm"><Music2 className="mx-auto mb-2 text-gray-700" style={{width:28,height:28}}/>Pick a genre to load real tracks</div>}
      </div>}
      {tab==="import"&&<div className="flex flex-col gap-4 p-4 flex-1">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-xs font-bold text-gray-400 mb-0.5">Paste a playlist URL</p><p className="text-[10px] text-gray-600 mb-3">Supports Spotify · SoundCloud · YouTube</p><input value={playlistUrl} onChange={e=>setPlaylistUrl(e.target.value)} placeholder="https://open.spotify.com/playlist/..." className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500 mb-3"/><button onClick={()=>setEmbedUrl(getPlaylistEmbed(playlistUrl))} className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-sm font-bold rounded-xl">Load Playlist</button></div>
        {embedUrl?<div className="rounded-xl overflow-hidden border border-white/[0.07] flex-1"><iframe src={embedUrl} width="100%" height="380" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen loading="lazy" className="block"/></div>:<div className="rounded-xl border border-dashed border-white/[0.07] p-10 text-center text-gray-600 text-sm flex flex-col items-center gap-2"><Music2 style={{width:28,height:28}}/>Paste a URL</div>}
      </div>}
      {tab==="curated"&&<div className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-2 gap-2">{CURATED.map((t,i)=><button key={i} onClick={()=>setCuratedTrack(curatedTrack?.title===t.title?null:t)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition ${curatedTrack?.title===t.title?"bg-sky-500/10 border-sky-500/40 text-sky-300":"bg-white/[0.03] border-white/[0.07] text-gray-500 hover:border-sky-500/25"}`}><span className="text-2xl">{t.emoji}</span><span className="text-xs font-semibold">{t.title}</span></button>)}</div>
        {curatedTrack?<div className="rounded-xl overflow-hidden border border-white/[0.07]"><iframe src={curatedTrack.url} width="100%" height="200" allow="autoplay; encrypted-media" allowFullScreen className="block"/></div>:<div className="rounded-xl border border-dashed border-white/[0.07] p-8 text-center text-gray-600 text-sm">Pick a stream to start studying</div>}
      </div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   GROUP CHAT
══════════════════════════════════════════════════════════════════ */
function ChatPanel({ socket, sessionId, groupId, session }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const seenIds = useRef(new Set());

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/chat`);
      if (res.ok) {
        const d = await res.json();
        const msgs = d.messages || [];
        msgs.forEach(m => seenIds.current.add(m._id));
        setMessages(msgs);
      }
    } catch {}
  }, [groupId]);

  useEffect(() => {
    fetchMessages();
    if (!socket) return;

    // Join the group room so we receive group-chat events
    const joinGroup = () => socket.emit("join-group", groupId);
    if (socket.connected) joinGroup();
    socket.on("connect", joinGroup);

    const onGroupChat = (msg) => {
      // Deduplicate — don't add if we already have this message (optimistic add)
      if (seenIds.current.has(msg._id)) return;
      seenIds.current.add(msg._id);
      setMessages(prev => [...prev, msg]);
    };
    socket.on("group-chat", onGroupChat);
    socket.on("new-message", onGroupChat);
    return () => {
      socket.off("connect", joinGroup);
      socket.off("group-chat", onGroupChat);
      socket.off("new-message", onGroupChat);
    };
  }, [fetchMessages, socket, groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    // Optimistic add — show message immediately (WhatsApp-style)
    const optimisticMsg = {
      _id: "opt_" + Date.now(),
      sender: { _id: session?.user?.id, name: session?.user?.name || "You" },
      text,
      createdAt: new Date().toISOString()
    };
    seenIds.current.add(optimisticMsg._id);
    setMessages(prev => [...prev, optimisticMsg]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const data = await res.json();
        const msg = data.message;
        seenIds.current.add(msg._id);
        // Replace optimistic message with real one
        setMessages(prev => prev.map(m => m._id === optimisticMsg._id ? msg : m));
        // Emit via socket so OTHER users in the group room receive it in real-time
        // (globalThis.__io doesn't work in Next.js 16 API route workers)
        if (socket) {
          socket.emit("group-chat", { groupId, message: msg });
        }
      }
    } catch {}
    finally { setSending(false); }
  };

  const me = session?.user?.id || session?.user?.email;
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-600 text-sm">
            <MessageSquare className="mx-auto mb-2 text-gray-700" style={{ width: 24, height: 24 }} />
            No messages yet — say hi!
          </div>
        )}
        {messages.map((m, i) => {
          const isMe = String(m.sender?._id || m.sender) === String(me);
          return (
            <div key={m._id || i} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500/40 to-indigo-600/40 border border-white/[0.08] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {(m.sender?.name || "?")[0].toUpperCase()}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${isMe ? "bg-sky-600 text-white rounded-tr-sm" : "bg-white/[0.06] text-gray-200 rounded-tl-sm"}`}>
                {!isMe && <p className="text-[10px] text-sky-400 font-bold mb-0.5">{m.sender?.name || "Member"}</p>}
                <p className="leading-relaxed">{m.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-white/[0.06] flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} placeholder="Type a message..."
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500 transition" />
        <button onClick={send} disabled={sending} className="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40">
          <Send style={{ width: 15, height: 15 }} />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   AI TUTOR PANEL
   Tabs: Intro · Roadmap · Mastery Q&A · Resources · Flashcards
   Single API call, token-efficient prompt
══════════════════════════════════════════════════════════════════ */

/* ── Resource link builder — real Google/YouTube/MDN/W3S search URLs ── */
function buildResourceLinks(topic) {
  const q = encodeURIComponent(topic);
  return [
    {
      title: `Search "${topic}" on Google`,
      url:   `https://www.google.com/search?q=${q}+tutorial`,
      type:  "search", icon: "🔍",
      desc:  "Google search results for tutorials and guides",
    },
    {
      title: `YouTube: ${topic} tutorials`,
      url:   `https://www.youtube.com/results?search_query=${q}+tutorial+for+beginners`,
      type:  "video", icon: "▶",
      desc:  "Free video tutorials on YouTube",
    },
    {
      title: `MDN Web Docs — ${topic}`,
      url:   `https://developer.mozilla.org/en-US/search?q=${q}`,
      type:  "docs", icon: "📄",
      desc:  "Official MDN documentation and references",
    },
    {
      title: `W3Schools — ${topic}`,
      url:   `https://www.w3schools.com/search/search_result.php?search=${q}`,
      type:  "practice", icon: "💻",
      desc:  "Interactive exercises and examples",
    },
    {
      title: `GeeksForGeeks — ${topic}`,
      url:   `https://www.geeksforgeeks.org/search/?q=${q}`,
      type:  "article", icon: "📰",
      desc:  "Articles, explanations and interview questions",
    },
    {
      title: `Stack Overflow — ${topic}`,
      url:   `https://stackoverflow.com/search?q=${q}`,
      type:  "community", icon: "💬",
      desc:  "Community Q&A and real-world problem solutions",
    },
  ];
}

const RESOURCE_CHIP = {
  search:    "bg-sky-500/10    text-sky-400    border-sky-500/20",
  video:     "bg-rose-500/10   text-rose-400   border-rose-500/20",
  docs:      "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  practice:  "bg-amber-500/10  text-amber-400  border-amber-500/20",
  article:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  community: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

/* ── Mastery Q&A — expandable important questions ── */
function MasteryQA({ questions }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-2">
      {questions.map((item, i) => (
        <div key={i}
          className={`rounded-xl border transition-all duration-200 overflow-hidden ${
            open === i ? "border-sky-500/30 bg-sky-500/[0.04]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]"
          }`}>
          {/* question row */}
          <button
            className="w-full flex items-start gap-3 p-4 text-left"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 ${
              open === i ? "bg-sky-500 text-white" : "bg-white/[0.06] text-gray-500"
            }`}>{i + 1}</span>
            <p className="flex-1 text-sm font-semibold text-gray-200 leading-snug">{item.q}</p>
            <ChevronRight
              style={{ width: 14, height: 14 }}
              className={`text-gray-600 flex-shrink-0 mt-0.5 transition-transform duration-200 ${open === i ? "rotate-90 text-sky-400" : ""}`}
            />
          </button>
          {/* answer */}
          {open === i && (
            <div className="px-4 pb-4 pt-0">
              <div className="ml-9 pl-3 border-l-2 border-sky-500/30">
                <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
                {item.tip && (
                  <p className="mt-2 text-xs text-amber-400 bg-amber-500/[0.07] border border-amber-500/20 rounded-lg px-3 py-2">
                    💡 {item.tip}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Flashcards ── */
function FlashcardDeck({ cards }) {
  const [idx,     setIdx]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known,   setKnown]   = useState(new Set());

  const current  = cards[idx];
  const progress = Math.round((known.size / cards.length) * 100);

  const next = (markKnown) => {
    if (markKnown) setKnown(k => new Set([...k, idx]));
    setFlipped(false);
    setTimeout(() => setIdx(i => (i + 1) % cards.length), 150);
  };

  const restart = () => { setIdx(0); setFlipped(false); setKnown(new Set()); };

  return (
    <div className="flex flex-col items-center gap-5 h-full justify-center px-4">
      {/* progress */}
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
          <span>{idx + 1} / {cards.length}</span>
          <span className="text-emerald-400 font-semibold">{known.size} known</span>
        </div>
        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* card */}
      <div
        onClick={() => setFlipped(f => !f)}
        className={`w-full max-w-md min-h-[200px] rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col items-center justify-center p-8 text-center select-none ${
          flipped
            ? "border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-indigo-500/10"
            : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]"
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-600">
          {flipped ? "Answer" : "Question — tap to reveal"}
        </p>
        <p className={`text-base font-bold leading-relaxed ${flipped ? "text-sky-200" : "text-gray-200"}`}>
          {flipped ? current.back : current.front}
        </p>
      </div>

      {/* actions */}
      {flipped ? (
        <div className="flex gap-3 w-full max-w-md">
          <button onClick={() => next(false)}
            className="flex-1 py-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.07] text-rose-400 text-sm font-bold hover:bg-rose-500/15 transition">
            Still Learning
          </button>
          <button onClick={() => next(true)}
            className="flex-1 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-400 text-sm font-bold hover:bg-emerald-500/15 transition">
            Got It ✓
          </button>
        </div>
      ) : (
        <button onClick={() => setFlipped(true)}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-sm font-bold shadow-lg shadow-sky-500/20">
          Reveal Answer
        </button>
      )}

      {known.size === cards.length && (
        <div className="text-center space-y-2">
          <p className="text-emerald-400 font-bold text-sm">🎉 You know all cards!</p>
          <button onClick={restart} className="text-xs text-gray-500 hover:text-white transition underline">Restart deck</button>
        </div>
      )}
    </div>
  );
}

/* ── Roadmap step ── */
function RoadmapStep({ step, index, total }) {
  const TYPE_COLORS = {
    concept:  { dot: "bg-sky-500",     badge: "bg-sky-500/10 text-sky-400 border-sky-500/20"      },
    practice: { dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    project:  { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  };
  const tc = TYPE_COLORS[step.type] || TYPE_COLORS.concept;
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-8 h-8 rounded-full ${tc.dot} flex items-center justify-center text-white text-xs font-black shadow-md`}>{step.step}</div>
        {index < total - 1 && <div className="w-px flex-1 bg-white/[0.08] mt-1" />}
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="text-sm font-bold text-white">{step.title}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tc.badge}`}>{step.type}</span>
          {step.duration && <span className="text-[10px] text-gray-600">{step.duration}</span>}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
      </div>
    </div>
  );
}

/* ── Tutor prompt — single call, returns all 5 sections ── */
const TUTOR_PROMPT = (topic) => `Expert AI tutor. Topic: "${topic}". Return ONLY valid JSON, no markdown:
{
  "intro": "2-3 sentences: what it is and why it matters",
  "roadmap": [{"step":1,"title":"","desc":"one sentence","duration":"","type":"concept|practice|project"}],
  "mastery": [{"q":"Important question to master this topic?","a":"Clear concise answer","tip":"optional pro tip or common mistake"}],
  "flashcards": [{"front":"Term or concept","back":"Definition or explanation"}],
  "aiResources": [{"title":"","desc":"one line"}]
}
Rules: roadmap=6 steps, mastery=8 questions covering beginner to advanced, flashcards=8 cards with key terms, aiResources=3 additional specific resources with names. Be concise to save tokens.`;

const TUTOR_TABS = [
  { id: "intro",     label: "Intro",     icon: BookOpen   },
  { id: "roadmap",   label: "Roadmap",   icon: Map        },
  { id: "mastery",   label: "Mastery Q&A", icon: HelpCircle },
  { id: "flashcards",label: "Flashcards",icon: Zap        },
  { id: "resources", label: "Resources", icon: Link2      },
];

function QuizPanel({ socket, sessionId, syncedModule, featureLocks, session }) {
  const [topic,     setTopic]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [module,    setModule]    = useState(null);
  const [activeTab, setActiveTab] = useState("intro");
  const [error,     setError]     = useState("");

  const aiLock = featureLocks?.ai;
  const isLockedByOther = aiLock && aiLock.userId !== session?.user?.id;
  const isLockedByMe = aiLock && aiLock.userId === session?.user?.id;

  useEffect(() => {
    if (syncedModule) {
      setModule(syncedModule);
      setTopic(syncedModule.topic || "");
    }
  }, [syncedModule]);

  const generate = async () => {
    const t = topic.trim();
    if (!t) return;
    // Acquire lock
    if (isLockedByOther) {
      toast.error(`\ud83d\udd12 AI Tutor is being used by ${aiLock.userName}`);
      return;
    }
    if (socket && !isLockedByMe) {
      socket.emit("feature-lock", { sessionId, feature: "ai", userId: session?.user?.id, userName: session?.user?.name });
    }
    setLoading(true); setError(""); setModule(null);
    try {
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: TUTOR_PROMPT(t) }),
      });
      const data = await res.json();
      const raw  = (data.reply || "").trim()
        .replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/,"").trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Bad format");
      const parsed = JSON.parse(jsonMatch[0]);
      parsed._realLinks = buildResourceLinks(t);
      parsed.topic = t;
      setModule(parsed);
      setActiveTab("intro");

      if (socket) {
        socket.emit("ai-tutor-sync", { sessionId, module: parsed });
      }
      // Release lock after output is produced
      if (socket) socket.emit("feature-unlock", { sessionId, feature: "ai", userId: session?.user?.id });
    } catch (err) {
      console.error("[TutorAI]", err);
      setError("Couldn't generate module. Try a more specific topic or retry.");
      if (socket) socket.emit("feature-unlock", { sessionId, feature: "ai", userId: session?.user?.id });
    } finally { setLoading(false); }
  };

  /* ── Search screen ── */
  if (!module && !loading) return (
    <div className="flex flex-col items-center justify-center gap-8 h-full p-8">
      {isLockedByOther && (
        <div className="w-full max-w-lg px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
          <Lock className="text-amber-400" style={{ width: 14, height: 14 }} />
          <p className="text-xs text-amber-400 font-semibold">{aiLock.userName} is using AI Tutor — please wait</p>
        </div>
      )}
      <div className="text-center space-y-3 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-600/20 border border-sky-500/20 flex items-center justify-center mx-auto">
          <Brain className="text-sky-400" style={{ width: 32, height: 32 }} />
        </div>
        <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>AI Study Tutor</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Enter any topic — get a full learning path with intro, roadmap, mastery Q&A, flashcards, and resources.
        </p>
      </div>
      <div className="w-full max-w-lg space-y-3">
        <div className="flex gap-2">
          <input value={topic} onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === "Enter" && generate()}
            placeholder="e.g. React Hooks, Binary Trees, OS Scheduling..."
            className="flex-1 bg-white/[0.05] border border-white/[0.09] rounded-xl px-5 py-3.5 text-gray-200 placeholder-gray-600 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 transition" />
          <button onClick={generate} disabled={!topic.trim()}
            className="px-6 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-xl font-bold text-sm disabled:opacity-40 shadow-lg shadow-sky-500/20 flex items-center gap-2 whitespace-nowrap">
            <Zap style={{ width: 14, height: 14 }} /> Learn
          </button>
        </div>
        {error && <p className="text-xs text-rose-400 px-1">{error}</p>}
      </div>
      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
        {["React Hooks","Binary Search","SQL Joins","OS Scheduling","Recursion","HTTP/HTTPS","Linked Lists","Async/Await"].map(ex => (
          <button key={ex} onClick={() => setTopic(ex)}
            className="px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-gray-500 text-xs hover:text-gray-300 hover:border-sky-500/25 transition-all">
            {ex}
          </button>
        ))}
      </div>
    </div>
  );

  /* ── Loading ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center gap-5 h-full">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-sky-500/20 border-t-sky-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" style={{ animationDirection:"reverse", animationDuration:"0.8s" }} />
        <Brain className="absolute inset-0 m-auto text-sky-400" style={{ width: 24, height: 24 }} />
      </div>
      <div className="text-center">
        <p className="text-white font-bold text-sm">Building your study module...</p>
        <p className="text-gray-600 text-xs mt-1">Intro · Roadmap · Mastery Q&A · Flashcards · Resources</p>
      </div>
    </div>
  );

  /* ── Module view ── */
  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="px-5 pt-4 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-0.5">AI Study Module</p>
            <h3 className="text-lg font-black text-white capitalize" style={{ fontFamily: "'Syne', sans-serif" }}>{topic}</h3>
          </div>
          <button onClick={() => { setModule(null); setTopic(""); }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition flex-shrink-0 mt-1">
            <RefreshCw style={{ width: 12, height: 12 }} /> New Topic
          </button>
        </div>
        {/* tabs — scrollable on small screens */}
        <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 overflow-x-auto">
          {TUTOR_TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === id ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md" : "text-gray-500 hover:text-gray-300"
              }`}>
              <Icon style={{ width: 11, height: 11 }} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">

        {/* INTRO */}
        {activeTab === "intro" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.05] p-5">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="text-sky-400" style={{ width: 14, height: 14 }} />
                <p className="text-xs font-black text-sky-400 uppercase tracking-widest">What is {topic}?</p>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{module.intro}</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Steps",      value: module.roadmap?.length    || 0, color: "text-sky-400"     },
                { label: "Questions",  value: module.mastery?.length    || 0, color: "text-indigo-400"  },
                { label: "Flashcards", value: module.flashcards?.length || 0, color: "text-amber-400"   },
                { label: "Resources",  value: (module._realLinks?.length || 0) + (module.aiResources?.length || 0), color: "text-emerald-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
                  <div className={`text-xl font-black ${color}`}>{value}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveTab("roadmap")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.08] text-gray-400 text-sm font-semibold hover:bg-white/[0.04] hover:text-white transition">
              View Learning Roadmap <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        )}

        {/* ROADMAP */}
        {activeTab === "roadmap" && (
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Map style={{ width: 13, height: 13 }} className="text-sky-400" /> Learning Path
            </p>
            {(module.roadmap || []).map((step, i) => (
              <RoadmapStep key={i} step={step} index={i} total={module.roadmap.length} />
            ))}
            <button onClick={() => setActiveTab("mastery")}
              className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl border border-white/[0.08] text-gray-400 text-sm font-semibold hover:bg-white/[0.04] hover:text-white transition">
              Test Your Knowledge <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        )}

        {/* MASTERY Q&A */}
        {activeTab === "mastery" && (
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <HelpCircle style={{ width: 13, height: 13 }} className="text-indigo-400" />
              Must-Know Questions to Master {topic}
            </p>
            <MasteryQA questions={module.mastery || []} />
          </div>
        )}

        {/* FLASHCARDS */}
        {activeTab === "flashcards" && (
          <div className="h-full">
            {(module.flashcards || []).length > 0
              ? <FlashcardDeck cards={module.flashcards} />
              : <p className="text-center text-gray-600 text-sm py-10">No flashcards generated.</p>
            }
          </div>
        )}

        {/* RESOURCES */}
        {activeTab === "resources" && (
          <div className="space-y-4">
            {/* Real auto-generated links */}
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Link2 style={{ width: 13, height: 13 }} className="text-amber-400" /> Find Resources Online
            </p>
            <div className="grid grid-cols-1 gap-2">
              {(module._realLinks || []).map((res, i) => (
                <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-sky-500/25 hover:bg-white/[0.05] transition-all group">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-base flex-shrink-0 ${RESOURCE_CHIP[res.type] || RESOURCE_CHIP.article}`}>
                    {res.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors truncate">{res.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5 truncate">{res.desc}</p>
                  </div>
                  <ArrowRight className="text-gray-600 group-hover:text-sky-400 flex-shrink-0 transition-colors" style={{ width: 14, height: 14 }} />
                </a>
              ))}
            </div>

            {/* AI-suggested specific resources */}
            {module.aiResources?.length > 0 && (
              <>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mt-2">
                  <Brain style={{ width: 13, height: 13 }} className="text-sky-400" /> AI-Recommended for {topic}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {module.aiResources.map((res, i) => (
                    <a key={i}
                      href={`https://www.google.com/search?q=${encodeURIComponent(res.title)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.04] hover:border-indigo-500/30 hover:bg-indigo-500/[0.07] transition-all group">
                      <div className="w-9 h-9 rounded-xl border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs font-black flex-shrink-0">
                        AI
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{res.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 truncate">{res.desc}</p>
                      </div>
                      <ArrowRight className="text-gray-600 group-hover:text-indigo-400 flex-shrink-0 transition-colors" style={{ width: 14, height: 14 }} />
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN STUDY ROOM
══════════════════════════════════════════════════════════════════ */
const TOOLS = [
  { id: "whiteboard", icon: PenLine,       label: "Whiteboard" },
  { id: "chat",       icon: MessageSquare, label: "Chat"       },
  { id: "pdf",        icon: FileText,      label: "PDF AI"     },
  { id: "quiz",       icon: Brain,         label: "AI Tutor"   },
  { id: "media",      icon: Video,         label: "Media"      },
  { id: "pomodoro",   icon: Timer,         label: "Pomodoro"   },
  { id: "music",      icon: Music2,        label: "Music"      },
];

export default function StudyRoomPage() {
  const { groupId, sessionId }  = useParams();
  const { data: session }      = useSession();
  const router                 = useRouter();
  const [activeTool,   setActiveTool]   = useState("whiteboard");
  const [group,        setGroup]        = useState(null);
  const [elapsedSecs,  setElapsedSecs]  = useState(0);
  const [camStream,    setCamStream]    = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [socket,       setSocket]       = useState(null);
  const [activeSharers, setActiveSharers] = useState({});
  const [sessionUsers, setSessionUsers] = useState([]);
  const [permissionRequest, setPermissionRequest] = useState(null);
  const [remoteModule, setRemoteModule] = useState(null);
  const [remotePdf, setRemotePdf] = useState({ fileName: "", docText: "" });
  const [remotePdfContent, setRemotePdfContent] = useState(null);
  const [featureLocks, setFeatureLocks] = useState({ ai: null, pdf: null });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
    const s = io(backendUrl, {
      path: "/api/socketio",
      transports: ["websocket", "polling"],
    });
    setSocket(s);

    s.on("permission-request", ({ from, type }) => {
      setPermissionRequest({ from, type });
      toast.info(`📢 ${from.name} requested to use ${type}`, { autoClose: 10000 });
    });

    s.on("permission-response", ({ to, type, allowed }) => {
      if (to === session?.user?.id) {
        if (allowed) {
          toast.success(`✅ Permission granted for ${type}!`);
          window.dispatchEvent(new CustomEvent("permission-granted", { detail: { type } }));
        } else {
          toast.error(`❌ Permission denied for ${type}.`);
        }
      }
    });

    s.on("ai-tutor-sync", (mod) => {
      setRemoteModule(mod);
      toast.info("🧠 AI Tutor module updated by sync!");
    });

    s.on("pdf-sync", (data) => {
      setRemotePdf(data);
      toast.info(`📄 PDF \"${data.fileName}\" synced!`);
    });

    s.on("pdf-content-sync", (data) => {
      setRemotePdfContent(data);
    });

    s.on("media-status", ({ userId, userName, type, status }) => {
      setActiveSharers(prev => {
        const next = { ...prev };
        if (status === "on") next[type] = { userId, name: userName };
        else if (next[type]?.userId === userId) delete next[type];
        return next;
      });
    });

    // Feature lock state (AI/PDF mutual exclusion)
    s.on("feature-lock-state", (locks) => {
      setFeatureLocks(locks);
    });
    s.on("feature-lock-denied", ({ feature, lockedBy }) => {
      toast.error(`🔒 ${feature.toUpperCase()} is being used by ${lockedBy.userName}`);
    });

    // Pomodoro start — redirect ALL members to pomodoro tab
    s.on("pomodoro-start", (state) => {
      setActiveTool("pomodoro");
      toast.info("⏱️ Pomodoro session started! Redirecting...", { autoClose: 3000 });
    });

    s.on("session-users", (users) => {
      setSessionUsers(users);
    });

    return () => {
      s.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Join session + group rooms once socket AND session are both ready
  useEffect(() => {
    if (!socket || !session?.user?.id || !sessionId) return;
    socket.emit("join-session", { sessionId, userId: session.user.id, userName: session.user.name });
    socket.emit("join-group", groupId);
  }, [socket, session?.user?.id, sessionId, groupId]);

  const handleRequestPermission = (type) => {
    if (!socket || !session?.user) return;
    socket.emit("permission-request", {
      sessionId,
      type,
      from: { id: session.user.id, name: session.user.name }
    });
    toast.info(`📤 Request sent to use ${type}...`);
  };

  const handlePermissionResponse = (allowed) => {
    if (!permissionRequest || !socket) return;
    socket.emit("permission-response", {
      sessionId,
      to: permissionRequest.from.id,
      type: permissionRequest.type,
      allowed
    });
    setPermissionRequest(null);
  };

  useEffect(() => {
    fetch(`/api/groups/${groupId}`).then(r=>r.json()).then(d=>setGroup(d.group));
    // XP Increase on room join
    if (session?.user?.id) {
      fetch("/api/streak/xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 10, reason: "Joined study session" })
      }).catch(e => console.error("XP Error:", e));
    }
  }, [groupId, session?.user?.id]);

  useEffect(() => {
    const t = setInterval(() => setElapsedSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = [
    String(Math.floor(elapsedSecs/3600)).padStart(2,"0"),
    String(Math.floor((elapsedSecs%3600)/60)).padStart(2,"0"),
    String(elapsedSecs%60).padStart(2,"0"),
  ].join(":");

  const ActiveIcon = TOOLS.find(t => t.id === activeTool)?.icon;

  const lockIndicator = (featureKey) => {
    const lock = featureLocks[featureKey];
    if (!lock) return null;
    const isMe = lock.userId === session?.user?.id;
    return (
      <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[7px] ring-2 ring-[#0b0f1a] ${isMe ? 'bg-emerald-500' : 'bg-amber-500'}`} title={isMe ? 'You are using this' : `${lock.userName} is using this`}>
        <Lock style={{ width: 8, height: 8 }} />
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-[#060810] text-gray-100 overflow-hidden">
      {/* ── Mobile hamburger ── */}
      <button onClick={() => setMobileMenuOpen(o => !o)} className="md:hidden fixed top-3 left-3 z-[60] w-10 h-10 rounded-xl bg-[#0b0f1a] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white transition-colors shadow-lg">
        <Menu style={{ width: 18, height: 18 }} />
      </button>

      {/* ── Sidebar (hidden on mobile unless menu open) ── */}
      <aside className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 fixed md:relative z-50 w-[68px] bg-[#0b0f1a] border-r border-white/[0.06] flex flex-col items-center py-4 gap-1.5 flex-shrink-0 h-full`}>
        <button onClick={() => router.push("/Home")} className="w-10 h-10 rounded-xl overflow-hidden mb-2 flex-shrink-0 hover:scale-105 transition-transform">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </button>
        <div className="w-8 h-px bg-white/[0.06] mb-1" />
        {TOOLS.map(({ id, icon: Icon, label }) => {
          const isActive = activeSharers[id] || (id === "pdf" && remotePdf.docText) || (id === "quiz" && remoteModule);
          const featureKey = id === "quiz" ? "ai" : id === "pdf" ? "pdf" : null;
          return (
            <button key={id} onClick={() => { setActiveTool(id); setMobileMenuOpen(false); }} title={label}
              className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
                activeTool === id ? "bg-gradient-to-br from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/20" : "text-gray-600 hover:bg-white/[0.06] hover:text-gray-300"
              }`}>
              <Icon style={{ width: 18, height: 18 }} />
              <span className="text-[8px] font-semibold tracking-wide">{label}</span>
              {isActive && !featureKey && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0b0f1a] animate-pulse" />
              )}
              {featureKey && lockIndicator(featureKey)}
            </button>
          );
        })}
        <div className="flex-1" />
        {/* Online users count */}
        <div className="text-[9px] text-gray-600 font-bold mb-1">{sessionUsers.length} online</div>
        <button onClick={() => router.push(`/groups/${groupId}`)} title="Leave Room"
          className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-600 hover:bg-rose-500/10 hover:text-rose-400 transition-all">
          <X style={{ width: 18, height: 18 }} />
        </button>
      </aside>
      {/* Mobile overlay */}
      {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden" />}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-12 bg-[#0b0f1a] border-b border-white/[0.06] px-3 md:px-5 flex items-center gap-2 md:gap-4 flex-shrink-0">
          <div className="w-10 md:hidden" /> {/* spacer for hamburger */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-sm font-bold text-gray-200 truncate">{group?.name || "Study Room"}</span>
            <span className="hidden sm:inline text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0">Live</span>
          </div>
          <div className="hidden sm:flex gap-2 ml-3">
            {camStream && <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-lg border border-sky-500/20 flex items-center gap-1"><Camera style={{width:10,height:10}}/>Cam On</span>}
            {screenStream && <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/20 flex items-center gap-1"><Monitor style={{width:10,height:10}}/>Sharing</span>}
          </div>
          <div className="ml-auto flex items-center gap-2 md:gap-4">
            <span className="text-xs font-mono text-gray-600">{elapsed}</span>
            {ActiveIcon && <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-600"><ActiveIcon style={{width:12,height:12}}/>{TOOLS.find(t=>t.id===activeTool)?.label}</span>}
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {activeTool==="whiteboard" && <WhiteboardPanel socket={socket} sessionId={sessionId} />}
          {activeTool==="chat"       && <div className="h-full"><ChatPanel socket={socket} sessionId={sessionId} groupId={groupId} session={session}/></div>}
          {activeTool==="pdf"        && <div className="h-full overflow-y-auto"><PDFPanel socket={socket} sessionId={sessionId} syncedData={remotePdf} syncedContent={remotePdfContent} featureLocks={featureLocks} session={session} /></div>}
          {activeTool==="quiz"       && <div className="h-full"><QuizPanel socket={socket} sessionId={sessionId} syncedModule={remoteModule} featureLocks={featureLocks} session={session} /></div>}
          {activeTool==="media"      && <div className="h-full overflow-y-auto"><MediaPanel socket={socket} sessionId={sessionId} camStream={camStream} setCamStream={setCamStream} screenStream={screenStream} setScreenStream={setScreenStream} session={session} activeSharers={activeSharers} sessionUsers={sessionUsers} /></div>}
          {activeTool==="pomodoro"   && <div className="h-full overflow-y-auto"><PomodoroPanel socket={socket} sessionId={sessionId} /></div>}
          {activeTool==="music"      && <div className="h-full overflow-y-auto"><MusicPanel /></div>}
        </div>
      </main>

      {/* Permission Request Modal */}
      <AnimatePresence>
        {permissionRequest && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-8 z-[100] w-80 p-5 rounded-2xl border border-sky-500/30 bg-[#0d1117] shadow-2xl shadow-sky-500/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <ShieldCheck className="text-sky-400" size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Permission Request</p>
                <p className="text-sm font-bold text-white tracking-tight">{permissionRequest.from.name}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Wants permission to use the <b>{permissionRequest.type}</b> feature. Grant access?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePermissionResponse(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-gray-400 text-xs font-bold hover:text-white hover:bg-white/[0.06] transition-all"
              >
                Deny
              </button>
              <button
                onClick={() => handlePermissionResponse(true)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-sky-500/20 px-4"
              >
                Allow Access
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
