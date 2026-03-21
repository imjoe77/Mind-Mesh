'use client';

import { useState, useEffect, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useAnimationFrame,
} from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowRight, Users, BookOpen, Zap } from 'lucide-react';

const STATS = [
  { icon: Users,    value: '12k+', label: 'Active Students' },
  { icon: BookOpen, value: '3.4k', label: 'Study Groups'    },
  { icon: Zap,      value: '98%',  label: 'Satisfaction'    },
];

/* ─────────────────────────────────────────────
   CursorGlare
   Reads motion values every frame via useAnimationFrame
   so the radial gradient never lags behind the cursor.
   Glare strength: rgba alpha on the inner stop.
───────────────────────────────────────────── */
function CursorGlare({ x, y }) {
  const ref = useRef(null);

  useAnimationFrame(() => {
    if (!ref.current) return;
    const cx = x.get();
    const cy = y.get();
    ref.current.style.background = [
      /* tight bright core */
      `radial-gradient(180px circle at ${cx}px ${cy}px, rgba(56,189,248,0.38), transparent 100%)`,
      /* wide soft halo */
      `radial-gradient(520px circle at ${cx}px ${cy}px, rgba(99,102,241,0.18), transparent 70%)`,
    ].join(', ');
  });

  return (
    <div
      ref={ref}
      className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-300"
    />
  );
}

/* ─────────────────────────────────────────────
   DriftOrb — autonomous floating blob
───────────────────────────────────────────── */
function DriftOrb({ className, bg, duration = 14, delay = 0 }) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{ background: bg }}
      animate={{ x: [0, 28, -18, 8, 0], y: [0, -22, 14, -8, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/* ─────────────────────────────────────────────
   Hero
───────────────────────────────────────────── */
export default function Hero() {
  const { data: session } = useSession();
  const [mounted, setMounted]   = useState(false);
  const sectionRef              = useRef(null);

  /* cursor — raw → spring-smoothed */
  const rawX    = useMotionValue(-1000);
  const rawY    = useMotionValue(-1000);
  const cursorX = useSpring(rawX, { stiffness: 150, damping: 22 });
  const cursorY = useSpring(rawY, { stiffness: 150, damping: 22 });

  /* normalised mouse → blob parallax */
  const mouseNX = useMotionValue(0.5);
  const mouseNY = useMotionValue(0.5);
  const sNX     = useSpring(mouseNX, { stiffness: 45, damping: 16 });
  const sNY     = useSpring(mouseNY, { stiffness: 45, damping: 16 });
  const blobX   = useTransform(sNX, [0, 1], ['-6%', '6%']);
  const blobY   = useTransform(sNY, [0, 1], ['-6%', '6%']);

  /* scroll parallax + fade */
  const { scrollY }      = useScroll();
  const contentY         = useTransform(scrollY, [0, 600], [0, -70]);
  const contentOpacity   = useTransform(scrollY, [0, 380], [1, 0]);
  const blobScrollY      = useTransform(scrollY, [0, 600], [0, 100]);

  useEffect(() => {
    setMounted(true);
    const el = sectionRef.current;
    if (!el) return;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      rawX.set(e.clientX - r.left);
      rawY.set(e.clientY - r.top);
      mouseNX.set(e.clientX / window.innerWidth);
      mouseNY.set(e.clientY / window.innerHeight);
    };

    /* reset glare when cursor leaves the section */
    const onLeave = () => {
      rawX.set(-1000);
      rawY.set(-1000);
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#060810]"
    >
      {/* ── cursor glare ── */}
      <CursorGlare x={cursorX} y={cursorY} />

      {/* ── parallax blob layer ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ x: blobX, y: blobY, translateY: blobScrollY }}
      >
        <DriftOrb
          className="top-[-12%] left-[-6%] w-[62vw] h-[62vw] max-w-[760px] max-h-[760px]"
          bg="radial-gradient(circle, rgba(56,189,248,0.16) 0%, transparent 70%)"
          duration={17}
        />
        <DriftOrb
          className="bottom-[-20%] right-[-10%] w-[56vw] h-[56vw] max-w-[700px] max-h-[700px]"
          bg="radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)"
          duration={19}
          delay={4}
        />
        <DriftOrb
          className="top-[38%] left-[30%] w-[36vw] h-[36vw] max-w-[450px] max-h-[450px]"
          bg="radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)"
          duration={13}
          delay={7}
        />
      </motion.div>

      {/* ── dot grid ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.2]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 80% 75% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 75% at 50% 50%, black 30%, transparent 100%)',
        }}
      />

      {/* ── top shimmer ── */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />

      {/* ── content ── */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-20 text-center max-w-4xl mx-auto px-5 pt-24 pb-16 sm:pt-28 sm:pb-24"
      >
        {/* badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 text-sky-400 text-[11px] font-bold tracking-widest uppercase"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping inline-block" />
          Now in Open Beta — Spring 2026
        </motion.div>

        {/* headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-[clamp(2.2rem,7.5vw,5.8rem)] font-black leading-[1.04] tracking-tight mb-6"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          <span className="text-white block">The study platform</span>
          <span className="block mt-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400">
              {mounted && (
                <TypeAnimation
                  sequence={[
                    'built for students.',  2800,
                    'that connects minds.', 2800,
                    'that drives results.', 2800,
                  ]}
                  speed={55}
                  repeat={Infinity}
                />
              )}
            </span>
          </span>
        </motion.h1>

        {/* subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 sm:mb-12"
        >
          Create or join live study groups, pair up for peer mentoring, and
          turn your academic strengths into shared progress — all in one
          student-first workspace.
        </motion.p>

        {/* CTAs */}
        {!session && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.33, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16 sm:mb-20 px-4"
          >
            <Link href="/Home">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="group relative flex items-center gap-2 px-8 py-3.5 bg-white text-gray-950 text-sm font-bold rounded-xl overflow-hidden shadow-lg shadow-white/10"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none" />
                <span className="relative">Start Learning Free</span>
                <ArrowRight className="relative w-4 h-4 transition-transform group-hover:translate-x-1 duration-200" />
              </motion.button>
            </Link>
            <Link href="/About">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-3.5 text-gray-300 text-sm font-semibold rounded-xl border border-white/10 hover:bg-white/5 transition-all duration-200"
              >
                Watch Demo
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.44 }}
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-12"
        >
          {STATS.map(({ icon: Icon, value, label }, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="flex items-center gap-3 cursor-default"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/[0.08] flex items-center justify-center hover:bg-sky-500/10 hover:border-sky-500/20 transition-all duration-200">
                <Icon className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-left">
                <div className="text-white text-sm font-bold leading-none">{value}</div>
                <div className="text-gray-500 text-xs mt-0.5">{label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3"
      >
        {/* label */}
        <motion.span
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-[9px] uppercase tracking-[0.25em] font-bold text-gray-600"
        >
          Scroll
        </motion.span>

        {/* mouse shell */}
        <div className="relative flex items-center justify-center">
          {/* outer pulse ring 1 */}
          <motion.div
            className="absolute w-10 h-10 rounded-full border border-sky-400/20"
            animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
          {/* outer pulse ring 2 — offset */}
          <motion.div
            className="absolute w-10 h-10 rounded-full border border-sky-400/15"
            animate={{ scale: [1, 1.9], opacity: [0.3, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
          />

          {/* mouse body */}
          <div className="relative w-[26px] h-[38px] rounded-[13px] border-2 border-white/[0.15] bg-white/[0.03] backdrop-blur-sm flex items-start justify-center pt-[6px] overflow-hidden">
            {/* inner glow */}
            <div className="absolute inset-0 rounded-[13px] bg-gradient-to-b from-sky-400/[0.06] to-transparent pointer-events-none" />

            {/* scroll wheel dot */}
            <motion.div
              className="w-[3px] rounded-full bg-sky-400"
              style={{ boxShadow: '0 0 6px rgba(56,189,248,0.8)' }}
              animate={{ y: [0, 10, 0], opacity: [1, 0.2, 1], height: ['6px', '3px', '6px'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* chevrons */}
        <div className="flex flex-col items-center gap-[3px]">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-[10px] h-[10px] border-r-[1.5px] border-b-[1.5px] border-sky-400/60 rotate-45"
              animate={{ opacity: [0, 1, 0], y: [0, 3, 0] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.18,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* ── bottom vignette ── */}
      <div className="absolute bottom-0 inset-x-0 h-52 bg-gradient-to-t from-[#060810] to-transparent pointer-events-none z-10" />
    </section>
  );
}
