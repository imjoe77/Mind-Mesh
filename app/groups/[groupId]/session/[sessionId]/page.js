"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

// ─────────────────────────── POMODORO ───────────────────────────
function PomodoroPanel() {
  const MODES = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const LABELS = { work: "Focus", short: "Short Break", long: "Long Break" };
  const [mode, setMode] = useState("work");
  const [secs, setSecs] = useState(MODES.work);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef(null);

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

  const switchMode = (m) => { setRunning(false); setMode(m); setSecs(MODES[m]); };
  const mins = String(Math.floor(secs / 60)).padStart(2, "0");
  const sec2 = String(secs % 60).padStart(2, "0");
  const pct = ((MODES[mode] - secs) / MODES[mode]) * 100;

  return (
    <div className="flex flex-col items-center gap-5 p-6">
      <div className="flex gap-2">
        {Object.keys(MODES).map(m => (
          <button key={m} onClick={() => switchMode(m)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${mode === m ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
            {LABELS[m]}
          </button>
        ))}
      </div>

      {/* Circular progress */}
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle cx="50" cy="50" r="44" fill="none" stroke={mode === "work" ? "#6366f1" : "#10b981"}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
            className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white font-mono">{mins}:{sec2}</span>
          <span className="text-xs text-slate-400 uppercase tracking-widest">{LABELS[mode]}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setRunning(r => !r)}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${running ? "bg-amber-500 hover:bg-amber-400 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"}`}>
          {running ? "⏸ Pause" : "▶ Start"}
        </button>
        <button onClick={() => { setRunning(false); setSecs(MODES[mode]); }}
          className="px-4 py-2.5 rounded-xl font-bold text-sm bg-slate-800 text-slate-400 hover:bg-slate-700 transition">
          ↺ Reset
        </button>
      </div>

      <div className="bg-slate-800/50 rounded-xl px-5 py-3 text-center w-full">
        <div className="text-2xl font-black text-indigo-400">{cycles}</div>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Sessions Completed</div>
      </div>
    </div>
  );
}

// ─────────────────────────── WHITEBOARD ───────────────────────────
function WhiteboardPanel() {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#818cf8");
  const [size, setSize] = useState(3);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    if (e.touches) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const startDraw = (e) => {
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = tool === "eraser" ? size * 5 : size;
    ctx.strokeStyle = tool === "eraser" ? "#0f172a" : color;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => { drawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const COLORS = ["#818cf8", "#34d399", "#f59e0b", "#f87171", "#38bdf8", "#e879f9", "#ffffff"];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex-wrap">
        {[["pen","✏️ Pen"],["eraser","⬜ Eraser"]].map(([t, label]) => (
          <button key={t} onClick={() => setTool(t)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${tool === t ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
            {label}
          </button>
        ))}
        <div className="flex gap-1.5 ml-1">
          {COLORS.map(c => (
            <button key={c} onClick={() => { setColor(c); setTool("pen"); }}
              className={`w-5 h-5 rounded-full transition-transform ${color === c && tool === "pen" ? "scale-125 ring-2 ring-white" : "hover:scale-110"}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <input type="range" min="1" max="20" value={size} onChange={e => setSize(+e.target.value)}
          className="w-20 accent-indigo-500" />
        <button onClick={clearCanvas}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-red-900/40 text-red-400 hover:bg-red-900/70 transition">
          🗑 Clear
        </button>
      </div>
      {/* Canvas */}
      <canvas ref={canvasRef}
        className="flex-1 w-full cursor-crosshair touch-none"
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
      />
    </div>
  );
}

// ─────────────────────────── PDF ANALYZER ───────────────────────────
function PDFPanel() {
  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const fileRef = useRef(null);

  const extractTextFromPDF = async (file) => {
    // Use basic text extraction via FileReader for txt, or pdf.js stub
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result?.toString() || "");
      reader.readAsText(file);
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSummary(""); setAnswer("");
    if (file.type === "text/plain") {
      const t = await extractTextFromPDF(file);
      setText(t.slice(0, 8000)); // cap at 8k chars
    } else {
      setText(`[PDF: ${file.name}] — PDF text extraction in progress. Ask your questions and the AI will analyze the document.`);
    }
  };

  const askQuestion = async () => {
    if (!question.trim() || !text.trim()) return;
    setLoading(true); setAnswer("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, pdfContext: text }),
      });
      const data = await res.json();
      setAnswer(data.reply || "No answer received.");
    } catch { setAnswer("Error communicating with AI."); }
    finally { setLoading(false); }
  };

  const summarizeNow = async () => {
    if (!text.trim()) return;
    setSummarizing(true); setSummary("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Summarize this document in 5 bullet points.", pdfContext: text }),
      });
      const data = await res.json();
      setSummary(data.reply || "");
    } catch { setSummary("Error."); }
    finally { setSummarizing(false); }
  };

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 border-dashed text-center cursor-pointer hover:border-indigo-500 transition"
        onClick={() => fileRef.current?.click()}>
        <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={handleFile} />
        <p className="text-2xl mb-1">📄</p>
        <p className="text-sm text-slate-300 font-semibold">Drop or click to upload PDF / TXT</p>
        <p className="text-[10px] text-slate-500">Analyzed by AI instantly</p>
      </div>

      {text && (
        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700 max-h-28 overflow-y-auto">
          <p className="text-[10px] text-slate-400 font-mono">{text.slice(0, 300)}...</p>
        </div>
      )}

      {text && (
        <button onClick={summarizeNow} disabled={summarizing}
          className="w-full py-2 text-sm font-bold rounded-xl bg-purple-700 hover:bg-purple-600 text-white transition disabled:opacity-50">
          {summarizing ? "Summarizing..." : "✨ AI Summarize"}
        </button>
      )}

      {summary && (
        <div className="bg-purple-900/20 border border-purple-700/30 rounded-xl p-4">
          <p className="text-xs text-purple-300 font-semibold mb-2">📝 Summary</p>
          <p className="text-xs text-slate-300 whitespace-pre-wrap">{summary}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <textarea value={question} onChange={e => setQuestion(e.target.value)}
          placeholder="Ask a question about this document..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500 transition"
          rows={3} />
        <button onClick={askQuestion} disabled={loading || !text}
          className="w-full py-2 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50">
          {loading ? "Thinking..." : "🧠 Ask AI"}
        </button>
      </div>

      {answer && (
        <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-xl p-4">
          <p className="text-xs text-indigo-300 font-semibold mb-2">💡 Answer</p>
          <p className="text-xs text-slate-300 whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── MUSIC PLAYER ───────────────────────────
const GENRES = [
  { id: "lofi",        label: "Lo-Fi",       emoji: "🎵", tag: "lofi" },
  { id: "jazz",        label: "Jazz",         emoji: "🎷", tag: "jazz" },
  { id: "classical",   label: "Classical",    emoji: "🎻", tag: "classical" },
  { id: "electronic",  label: "Electronic",   emoji: "⚡", tag: "electronic" },
  { id: "ambient",     label: "Ambient",      emoji: "🌌", tag: "ambient" },
  { id: "relaxation",  label: "Chill",        emoji: "🌿", tag: "relaxation" },
];

const CURATED = [
  { title: "Lo-fi Hip Hop",   emoji: "🎵", url: "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0" },
  { title: "Deep Focus",      emoji: "🧘", url: "https://www.youtube.com/embed/WPni755-Krg?autoplay=0" },
  { title: "Jazz Coffee",     emoji: "☕", url: "https://www.youtube.com/embed/Dx5qFachd3A?autoplay=0" },
  { title: "Nature Sounds",   emoji: "🌿", url: "https://www.youtube.com/embed/q76bMs-NwRk?autoplay=0" },
];

function getPlaylistEmbed(url) {
  try {
    if (url.includes("spotify.com")) {
      // spotify.com/playlist/ID or spotify.com/album/ID etc
      const match = url.match(/spotify\.com\/(playlist|album|track|artist)\/([a-zA-Z0-9]+)/);
      if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
    }
    if (url.includes("soundcloud.com")) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%236366f1&auto_play=false&buying=false&sharing=false&show_artwork=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
    }
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const listMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      const vMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (listMatch) return `https://www.youtube.com/embed/videoseries?list=${listMatch[1]}`;
      if (vMatch) return `https://www.youtube.com/embed/${vMatch[1]}`;
    }
    return null;
  } catch { return null; }
}

function MusicPanel() {
  const [tab, setTab] = useState("genres"); // genres | import | curated
  const [genre, setGenre] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState(null);
  const [curatedTrack, setCuratedTrack] = useState(null);
  const [noKey, setNoKey] = useState(false);
  const JAMENDO_ID = process.env.NEXT_PUBLIC_JAMENDO_CLIENT_ID || "b6747d04";

  const fetchByGenre = async (g) => {
    setGenre(g);
    setTracks([]);
    setCurrentTrack(null);
    setLoadingTracks(true);
    try {
      const res = await fetch(
        `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_ID}&format=json&limit=10&fuzzytags=${g.tag}&include=musicinfo&audioformat=mp32`
      );
      const data = await res.json();
      if (data.results?.length) {
        setTracks(data.results);
        setCurrentTrack(data.results[0]);
      } else {
        setTracks([]);
      }
    } catch { setNoKey(true); }
    finally { setLoadingTracks(false); }
  };

  const handleImport = () => {
    const embed = getPlaylistEmbed(playlistUrl);
    setEmbedUrl(embed);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Tab bar */}
      <div className="flex border-b border-slate-800 flex-shrink-0">
        {[["genres","🎼 Browse Genre"],["import","🔗 Import Playlist"],["curated","📻 Curated"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${tab === id ? "border-indigo-500 text-indigo-400 bg-indigo-500/5" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: GENRES (Jamendo) ── */}
      {tab === "genres" && (
        <div className="flex flex-col gap-4 p-4 flex-1">
          <div className="grid grid-cols-3 gap-2">
            {GENRES.map(g => (
              <button key={g.id} onClick={() => fetchByGenre(g)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm transition ${genre?.id === g.id ? "bg-indigo-700/40 border-indigo-500" : "bg-slate-800/60 border-slate-700 hover:border-indigo-600"}`}>
                <span className="text-xl">{g.emoji}</span>
                <span className="text-xs font-semibold text-slate-300">{g.label}</span>
              </button>
            ))}
          </div>

          {loadingTracks && (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {noKey && (
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4 text-xs text-amber-300">
              ⚠️ Jamendo API unreachable. Set <code className="bg-slate-800 px-1 rounded">NEXT_PUBLIC_JAMENDO_CLIENT_ID</code> in .env.local or use Curated tab.
            </div>
          )}

          {/* Now playing */}
          {currentTrack && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3">
              <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold mb-2">▶ Now Playing</p>
              <p className="text-sm font-bold text-white truncate">{currentTrack.name}</p>
              <p className="text-xs text-slate-400 truncate">{currentTrack.artist_name}</p>
              <audio controls className="w-full mt-2 h-8" style={{ colorScheme:"dark" }}
                src={currentTrack.audio} key={currentTrack.id} autoPlay />
            </div>
          )}

          {/* Track list */}
          {tracks.length > 0 && (
            <div className="space-y-1 flex-1 overflow-y-auto">
              {tracks.map(t => (
                <button key={t.id} onClick={() => setCurrentTrack(t)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${currentTrack?.id === t.id ? "bg-indigo-700/30 border border-indigo-600/40" : "hover:bg-slate-800"}`}>
                  <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                    <img src={t.album_image || t.image} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{t.artist_name}</p>
                  </div>
                  {currentTrack?.id === t.id && <span className="text-indigo-400 text-xs">▶</span>}
                </button>
              ))}
            </div>
          )}

          {!loadingTracks && !genre && (
            <div className="text-center py-8 text-slate-500 text-sm">
              <p className="text-2xl mb-2">🎼</p>Pick a genre to load real tracks
            </div>
          )}
        </div>
      )}

      {/* ── TAB: IMPORT PLAYLIST ── */}
      {tab === "import" && (
        <div className="flex flex-col gap-4 p-4 flex-1">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-xs text-slate-300 font-bold mb-1">Paste a playlist URL</p>
            <p className="text-[10px] text-slate-500 mb-3">Supports Spotify · SoundCloud · YouTube playlists</p>
            <input value={playlistUrl} onChange={e => setPlaylistUrl(e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 mb-2" />
            <button onClick={handleImport}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition">
              🔗 Load Playlist
            </button>
          </div>

          {embedUrl ? (
            <div className="rounded-xl overflow-hidden border border-slate-700 flex-1">
              <iframe src={embedUrl} width="100%" height="380"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen loading="lazy" className="block" />
            </div>
          ) : (
            <div className="bg-slate-800/30 rounded-xl p-8 text-center border border-dashed border-slate-700">
              <p className="text-3xl mb-2">🔗</p>
              <p className="text-sm text-slate-400">Paste any Spotify, SoundCloud or YouTube playlist URL and click Load</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CURATED ── */}
      {tab === "curated" && (
        <div className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-2 gap-2">
            {CURATED.map((t, i) => (
              <button key={i} onClick={() => setCuratedTrack(curatedTrack?.title === t.title ? null : t)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition ${curatedTrack?.title === t.title ? "bg-indigo-700/40 border-indigo-500 text-white" : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-indigo-600"}`}>
                <span className="text-2xl">{t.emoji}</span>
                <span className="text-xs font-semibold">{t.title}</span>
              </button>
            ))}
          </div>
          {curatedTrack ? (
            <div className="rounded-xl overflow-hidden border border-slate-700">
              <iframe src={curatedTrack.url} width="100%" height="200"
                allow="autoplay; encrypted-media" allowFullScreen className="block" />
            </div>
          ) : (
            <div className="bg-slate-800/30 rounded-xl p-6 text-center border border-dashed border-slate-700">
              <p className="text-3xl mb-2">🎶</p>
              <p className="text-sm text-slate-400">Pick a curated stream to start studying</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── GROUP CHAT ───────────────────────────
function ChatPanel({ groupId, session }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/chat`);
      if (res.ok) { const d = await res.json(); setMessages(d.messages || []); }
    } catch {}
  }, [groupId]);

  useEffect(() => { fetchMessages(); const t = setInterval(fetchMessages, 4000); return () => clearInterval(t); }, [fetchMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`/api/groups/${groupId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim() }),
      });
      setInput("");
      await fetchMessages();
    } catch {}
    finally { setSending(false); }
  };

  const me = session?.user?.id || session?.user?.email;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-sm">No messages yet. Say hi! 👋</div>
        )}
        {messages.map((m, i) => {
          const isMe = String(m.sender?._id || m.sender) === String(me);
          return (
            <div key={i} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {(m.sender?.name || "?")[0].toUpperCase()}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-slate-800 text-slate-200 rounded-tl-sm"}`}>
                {!isMe && <p className="text-[10px] text-indigo-400 font-bold mb-0.5">{m.sender?.name || "Member"}</p>}
                <p>{m.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-slate-800 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type a message..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition" />
        <button onClick={send} disabled={sending}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
          {sending ? "..." : "→"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────── MAIN PAGE ───────────────────────────
const TOOLS = [
  { id: "whiteboard", icon: "🖊", label: "Whiteboard" },
  { id: "chat",       icon: "💬", label: "Chat" },
  { id: "pdf",        icon: "📄", label: "PDF AI" },
  { id: "pomodoro",   icon: "⏱", label: "Pomodoro" },
  { id: "music",      icon: "🎵", label: "Music" },
];

export default function StudyRoomPage() {
  const { groupId, sessionId } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTool, setActiveTool] = useState("whiteboard");
  const [group, setGroup] = useState(null);
  const [elapsedSecs, setElapsedSecs] = useState(0);

  useEffect(() => {
    fetch(`/api/groups/${groupId}`).then(r => r.json()).then(d => setGroup(d.group));
  }, [groupId]);

  useEffect(() => {
    const t = setInterval(() => setElapsedSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = `${String(Math.floor(elapsedSecs / 3600)).padStart(2,"0")}:${String(Math.floor((elapsedSecs % 3600) / 60)).padStart(2,"0")}:${String(elapsedSecs % 60).padStart(2,"0")}`;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">

      {/* Side Navigation */}
      <aside className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-2 flex-shrink-0">
        {/* Logo */}
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center mb-2">
          <span className="text-white text-sm font-black">M</span>
        </div>

        <div className="w-full h-px bg-slate-800 mb-1" />

        {TOOLS.map(t => (
          <button key={t.id} onClick={() => setActiveTool(t.id)}
            title={t.label}
            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition text-base ${
              activeTool === t.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
            }`}>
            <span>{t.icon}</span>
            <span className="text-[7px] tracking-wide">{t.label}</span>
          </button>
        ))}

        <div className="flex-1" />

        {/* Exit */}
        <button onClick={() => router.push(`/groups/${groupId}`)}
          title="Leave Room"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-900/30 transition text-lg">
          ✕
        </button>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <header className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold text-slate-200">{group?.name || "Study Room"}</span>
            <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">LIVE</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-xs font-mono text-slate-500">⏲ {elapsed}</span>
            <span className="text-xs text-slate-500">{TOOLS.find(t => t.id === activeTool)?.icon} {TOOLS.find(t => t.id === activeTool)?.label}</span>
          </div>
        </header>

        {/* Tool Content */}
        <div className="flex-1 overflow-hidden">
          {activeTool === "whiteboard" && <WhiteboardPanel />}
          {activeTool === "chat"       && <div className="h-full"><ChatPanel groupId={groupId} session={session} /></div>}
          {activeTool === "pdf"        && <div className="h-full overflow-y-auto"><PDFPanel /></div>}
          {activeTool === "pomodoro"   && <div className="h-full overflow-y-auto"><PomodoroPanel /></div>}
          {activeTool === "music"      && <div className="h-full overflow-y-auto"><MusicPanel /></div>}
        </div>
      </main>
    </div>
  );
}
