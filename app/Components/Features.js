'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { Users, Clock, Brain, MapPin, Trophy, MessageSquare } from 'lucide-react';

const FEATURES = [
  {
    icon: Users,
    title: 'Live Study Groups',
    desc: 'Create or join real-time collaborative rooms that auto-activate at your scheduled session time.',
    accent: 'sky',
    size: 'large',
  },
  {
    icon: Brain,
    title: 'AI-Assisted Notes',
    desc: 'Smart summaries generated from your session activity — ready to revise from the next day.',
    accent: 'indigo',
    size: 'small',
  },
  {
    icon: Trophy,
    title: 'Leaderboards',
    desc: 'Friendly competition keeps consistency high and streaks alive.',
    accent: 'amber',
    size: 'small',
  },
  {
    icon: Clock,
    title: 'Pomodoro Rooms',
    desc: 'Built-in focus timers synced across your entire group so everyone stays in flow together.',
    accent: 'emerald',
    size: 'large',
  },
  {
    icon: MapPin,
    title: 'Meet Nearby',
    desc: 'Discover study partners and groups on your campus or city.',
    accent: 'rose',
    size: 'small',
  },
  {
    icon: MessageSquare,
    title: 'Session Comments',
    desc: 'Async discussion threads tied to each study session for post-session clarity.',
    accent: 'violet',
    size: 'small',
  },
];

const ACCENT = {
  sky:    { icon: 'bg-sky-500/10 text-sky-400 border-sky-500/20',    border: 'hover:border-sky-500/30',    glow: 'rgba(56,189,248,0.08)' },
  indigo: { icon: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', border: 'hover:border-indigo-500/30', glow: 'rgba(99,102,241,0.08)' },
  amber:  { icon: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   border: 'hover:border-amber-500/30',  glow: 'rgba(245,158,11,0.08)' },
  emerald:{ icon: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', border: 'hover:border-emerald-500/30', glow: 'rgba(16,185,129,0.08)' },
  rose:   { icon: 'bg-rose-500/10 text-rose-400 border-rose-500/20',    border: 'hover:border-rose-500/30',   glow: 'rgba(244,63,94,0.08)' },
  violet: { icon: 'bg-violet-500/10 text-violet-400 border-violet-500/20', border: 'hover:border-violet-500/30', glow: 'rgba(139,92,246,0.08)' },
};

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const glareRef = useRef(null);
  const Icon = feature.icon;
  const a = ACCENT[feature.accent];

  const onMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (glareRef.current) {
      glareRef.current.style.background =
        `radial-gradient(280px circle at ${x}px ${y}px, ${a.glow}, transparent 70%)`;
    }
  };

  const onMouseLeave = () => {
    if (glareRef.current) glareRef.current.style.background = 'none';
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`
        group relative rounded-2xl border border-white/[0.07]
        bg-white/[0.03] p-6 transition-all duration-300 cursor-default overflow-hidden
        ${a.border}
        hover:bg-white/[0.055]
        ${feature.size === 'large' ? 'md:col-span-2' : ''}
      `}
    >
      {/* per-card cursor glare */}
      <div ref={glareRef} className="absolute inset-0 pointer-events-none transition-all duration-75" />

      {/* top shimmer */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl border mb-4 ${a.icon}`}>
        <Icon style={{ width: 18, height: 18 }} />
      </div>

      <h3 className="relative text-white font-bold text-base mb-2 tracking-tight">{feature.title}</h3>
      <p className="relative text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
    </motion.div>
  );
}

export default function Features() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-80px' });
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] });
  const blobY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);

  return (
    <section ref={containerRef} className="relative bg-[#060810] py-28 px-6 lg:px-10 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* parallax blob */}
      <motion.div
        style={{ y: blobY }}
        className="absolute left-[-15%] top-[10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full pointer-events-none"
      >
        <div className="w-full h-full rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.06)_0%,transparent_70%)]" />
      </motion.div>

      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="text-sky-500 text-xs font-bold uppercase tracking-widest mb-3 block">Everything You Need</span>
          <h2
            className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Built for how students<br />actually learn
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
            Every feature is designed around real study habits — from scheduled sessions to focus timers to peer accountability.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => <FeatureCard key={i} feature={f} index={i} />)}
        </div>
      </div>
    </section>
  );
}