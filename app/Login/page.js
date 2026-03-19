"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Users, Zap, BookOpen, Clock, Trophy, MessageSquare } from "lucide-react";

/* ═══════════════════════════════════════════════════
   ANIMATED NODE GRAPH BACKGROUND
═══════════════════════════════════════════════════ */
function NodeCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width  = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    let raf;
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    window.addEventListener("resize", resize);
    const nodes = Array.from({ length: 22 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.2 + 0.4,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0) n.x = W; if (n.x > W) n.x = 0;
        if (n.y < 0) n.y = H; if (n.y > H) n.y = 0;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < 130) {
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(56,189,248,${0.07 * (1 - d/130)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      nodes.forEach(n => { ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2); ctx.fillStyle = "rgba(99,102,241,0.4)"; ctx.fill(); });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

/* ═══════════════════════════════════════════════════
   RIGHT PANEL — live product preview cards
   Cycles through feature snapshots every 3.5s
═══════════════════════════════════════════════════ */
const PREVIEWS = [
  {
    label: "Live Study Sessions",
    icon: Clock,
    color: "sky",
    content: (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-black">DSA Study Squad</p>
            <p className="text-gray-500 text-xs">Computer Science · 6 members</p>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />LIVE
          </span>
        </div>
        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div className="h-full w-[72%] bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full" />
        </div>
        <p className="text-[11px] text-gray-600">6 / 8 slots filled · Session ends in 42 min</p>
        <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold">
          Join Session →
        </button>
      </div>
    ),
  },
  {
    label: "Daily Streak System",
    icon: Flame,
    color: "amber",
    content: (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl">🔥</div>
            <div>
              <p className="text-white text-lg font-black leading-none">14</p>
              <p className="text-gray-500 text-xs">Day Streak</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-amber-400 text-sm font-black">850 XP</p>
            <p className="text-gray-600 text-xs">This week</p>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["M","T","W","T","F","S","S"].map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-full h-6 rounded-md flex items-center justify-center text-[9px] font-bold ${
                i < 5 ? "bg-amber-500 text-white" : "bg-white/[0.05] text-gray-700"
              }`}>{i < 5 ? "✓" : d}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/15">
          <Zap className="text-amber-400 flex-shrink-0" style={{ width: 13, height: 13 }} />
          <p className="text-xs text-amber-300/80">You're on a roll! Log in tomorrow to hit 15 days.</p>
        </div>
      </div>
    ),
  },
  {
    label: "AI Study Tutor",
    icon: BookOpen,
    color: "indigo",
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400">AI</div>
          <p className="text-xs text-gray-400 font-semibold">Module: Binary Search Trees</p>
        </div>
        <div className="space-y-2">
          {["Intro Overview", "6-Step Roadmap", "8 Mastery Q&As", "Flashcard Deck"].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i < 2 ? "bg-emerald-400" : "bg-gray-700"}`} />
              <p className={`text-xs font-medium ${i < 2 ? "text-gray-300" : "text-gray-600"}`}>{item}</p>
              {i < 2 && <span className="ml-auto text-[9px] text-emerald-500 font-bold">DONE</span>}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: "Peer Discovery",
    icon: Users,
    color: "violet",
    content: (
      <div className="space-y-3">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Best Match Today</p>
        <div className="relative rounded-xl overflow-hidden border border-white/[0.08] bg-[#0d1117]">
          <div className="h-16 bg-gradient-to-br from-violet-600/30 to-indigo-600/20" />
          <div className="absolute top-8 left-4 w-12 h-12 rounded-xl border-2 border-[#0d1117] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg">A</div>
          <div className="pt-8 px-4 pb-4">
            <p className="text-white text-sm font-black">Aisha K.</p>
            <p className="text-gray-500 text-xs mb-2">CS · 3rd Year</p>
            <div className="flex flex-wrap gap-1">
              {["React","DSA","Python"].map(s => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">{s}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-500 text-xs font-bold">Skip</button>
          <button className="flex-1 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-xs font-bold">Connect ♥</button>
        </div>
      </div>
    ),
  },
];

const COLOR_MAP = {
  sky:    { badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",    dot: "bg-sky-400"    },
  amber:  { badge: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" },
  indigo: { badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", dot: "bg-indigo-400" },
  violet: { badge: "bg-violet-500/10 text-violet-400 border-violet-500/20", dot: "bg-violet-400" },
};

function ProductPreview() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % PREVIEWS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const current = PREVIEWS[idx];
  const cm = COLOR_MAP[current.color];
  const Icon = current.icon;

  return (
    <div className="w-full space-y-4">
      {/* feature tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {PREVIEWS.map((p, i) => {
          const PIcon = p.icon;
          const pcm = COLOR_MAP[p.color];
          return (
            <button key={i} onClick={() => setIdx(i)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all duration-200 ${
                i === idx ? `${pcm.badge}` : "border-white/[0.06] text-gray-700 hover:text-gray-400 bg-white/[0.02]"
              }`}>
              <PIcon style={{ width: 10, height: 10 }} />
              {p.label}
            </button>
          );
        })}
      </div>

      {/* preview content */}
      <div className="rounded-xl border border-white/[0.07] bg-[#060810] overflow-hidden">
        <div className={`h-px bg-gradient-to-r from-transparent via-${current.color}-400/50 to-transparent`} />
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center ${cm.badge}`}>
              <Icon style={{ width: 11, height: 11 }} />
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{current.label}</p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {current.content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-[#060810] flex overflow-hidden">

      {/* top accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent z-30" />

      {/* ═══════════════════ LEFT — form ═══════════════════ */}
      <div className="relative w-full lg:w-[440px] flex-shrink-0 flex items-center justify-center px-8 py-16 z-10">
        {/* node canvas bg on left only */}
        <NodeCanvas />

        {/* radial focus mask */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(6,8,16,0.7) 100%)" }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-[340px]"
        >
          {/* logo */}
          <Link href="/" className="flex items-center gap-3 mb-10 group w-fit">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform duration-300">
              <span className="text-white text-sm font-black">M</span>
            </div>
            <span className="text-xl font-black text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              MindMesh
            </span>
          </Link>

          {/* heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight leading-snug" style={{ fontFamily: "'Syne', sans-serif" }}>
              Your study<br />network awaits.
            </h1>
            <p className="text-gray-500 text-sm">
              New here?{" "}
              <Link href="/signup" className="text-sky-400 font-semibold hover:text-sky-300 transition-colors">Create a free account</Link>
            </p>
          </div>

          {/* auth buttons */}
          <div className="space-y-3 mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => signIn("google", { callbackUrl: "/SDash" })}
              className="group w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-sky-500/20 transition-all duration-200 relative overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent skew-x-12 pointer-events-none" />
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-gray-200 font-semibold text-sm">Continue with Google</p>
                <p className="text-gray-600 text-[10px]">Most students use this</p>
              </div>
              <svg className="w-4 h-4 text-gray-700 group-hover:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => signIn("github", { callbackUrl: "/SDash" })}
              className="group w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.14] transition-all duration-200 relative overflow-hidden"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent skew-x-12 pointer-events-none" />
              <div className="w-8 h-8 rounded-lg bg-[#24292e] border border-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-gray-200 font-semibold text-sm">Continue with GitHub</p>
                <p className="text-gray-600 text-[10px]">For developers</p>
              </div>
              <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>

          {/* footer note */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] text-gray-700 font-semibold uppercase tracking-widest whitespace-nowrap">no passwords · oauth only</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <p className="text-center text-[11px] text-gray-700">
            By continuing you agree to our{" "}
            <Link href="/" className="text-gray-500 hover:text-gray-300 underline transition-colors">Terms</Link>{" "}
            &{" "}
            <Link href="/" className="text-gray-500 hover:text-gray-300 underline transition-colors">Privacy</Link>.
          </p>
        </motion.div>
      </div>

      {/* vertical divider */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/[0.07] to-transparent flex-shrink-0 relative z-10" />

      {/* ═══════════════════ RIGHT — product showcase ═══════════════════ */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative z-10 overflow-hidden">

        {/* dramatic layered glow behind card */}
        <div className="absolute inset-0 pointer-events-none">
          {/* primary glow blob */}
          <motion.div
            className="absolute top-[20%] left-[20%] w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 65%)", filter: "blur(40px)" }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* secondary glow */}
          <motion.div
            className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)", filter: "blur(40px)" }}
            animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          {/* grid overlay on right side */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 48, rotateY: -8 }}
          animate={mounted ? { opacity: 1, x: 0, rotateY: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-[420px] px-8"
          style={{ perspective: "1000px" }}
        >
          {/* floating badge top-right */}
          <motion.div
            className="absolute -top-4 -right-2 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 backdrop-blur-md shadow-lg"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="text-emerald-400 text-[11px] font-bold">Live sessions happening now</span>
          </motion.div>

          {/* floating XP chip bottom-left */}
          <motion.div
            className="absolute -bottom-4 -left-2 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full border border-amber-500/25 bg-amber-500/10 backdrop-blur-md shadow-lg"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <Flame className="text-amber-400" style={{ width: 12, height: 12 }} />
            <span className="text-amber-400 text-[11px] font-bold">+50 XP streak bonus</span>
          </motion.div>

          {/* main showcase card — perspective tilt on hover */}
          <motion.div
            whileHover={{ rotateY: 3, rotateX: -2, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ transformStyle: "preserve-3d" }}
            className="rounded-2xl border border-white/[0.1] bg-[#0b0f1a] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)]"
          >
            {/* fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#080c14]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 mx-3 h-5 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center px-2.5">
                <span className="text-[10px] text-gray-700">mindmesh.app/dashboard</span>
              </div>
              <div className="w-3.5 h-3.5 rounded-sm bg-white/[0.04] border border-white/[0.06]" />
            </div>

            {/* label */}
            <div className="px-5 pt-4 pb-1 flex items-center justify-between">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Feature Preview</p>
              <div className="flex gap-1">
                {PREVIEWS.map((_, i) => (
                  <div key={i} className={`rounded-full transition-all duration-300 ${
                    i === 0 ? "w-4 h-1 bg-sky-400" : "w-1 h-1 bg-white/[0.12]"
                  }`} />
                ))}
              </div>
            </div>

            {/* cycling content */}
            <div className="p-5">
              <ProductPreview />
            </div>
          </motion.div>

          {/* bottom label */}
          <div className="text-center mt-8">
            <p className="text-gray-600 text-sm">
              Join{" "}
              <span className="text-white font-bold">12,000+</span>
              {" "}students already learning smarter
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}