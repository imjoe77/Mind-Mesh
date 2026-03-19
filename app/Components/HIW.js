'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { UserPlus, Search, Play, TrendingUp } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Create your profile',
    desc: 'Set your subjects, skills you can teach, and what you want to learn. Takes 90 seconds.',
    accent: 'sky',
  },
  {
    number: '02',
    icon: Search,
    title: 'Find your group',
    desc: 'Discover study groups by subject, schedule, or location. Filter by exam, level, or language.',
    accent: 'indigo',
  },
  {
    number: '03',
    icon: Play,
    title: 'Join a live session',
    desc: 'Rooms auto-activate at session time. Pomodoro timers, shared notes, and focus tracking built-in.',
    accent: 'emerald',
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Track your growth',
    desc: 'See streaks, leaderboard rank, and session history. Share wins and keep each other accountable.',
    accent: 'amber',
  },
];

const ICON_BG = {
  sky:    'bg-sky-500/10 border-sky-500/20 text-sky-400',
  indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  emerald:'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  amber:  'bg-amber-500/10 border-amber-500/20 text-amber-400',
};

const LINE_COLOR = {
  sky:    'rgba(56,189,248,0.4)',
  indigo: 'rgba(99,102,241,0.4)',
  emerald:'rgba(16,185,129,0.4)',
  amber:  'rgba(245,158,11,0.4)',
};

function Step({ step, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const Icon = step.icon;
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isEven ? -40 : 40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-start gap-6 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} flex-row`}
    >
      {/* step indicator */}
      <div className="flex flex-col items-center flex-shrink-0 relative">
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${ICON_BG[step.accent]}`}>
          <Icon style={{ width: 20, height: 20 }} />
        </div>
        {index < STEPS.length - 1 && (
          <motion.div
            className="w-px mt-2 flex-1 min-h-[60px]"
            style={{ background: `linear-gradient(to bottom, ${LINE_COLOR[step.accent]}, transparent)` }}
            initial={{ scaleY: 0, originY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.7, delay: index * 0.1 + 0.3 }}
          />
        )}
      </div>

      {/* content */}
      <div className={`pb-10 ${isEven ? '' : 'md:text-right'}`}>
        <span className="text-gray-700 text-[11px] font-black uppercase tracking-widest mb-1 block">{step.number}</span>
        <h3 className="text-white font-bold text-lg mb-2 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
          {step.title}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);

  return (
    <section ref={containerRef} className="relative bg-[#060810] py-28 px-6 lg:px-10 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* parallax accent blob */}
      <motion.div
        style={{ y: bgY }}
        className="absolute right-[-10%] top-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full pointer-events-none"
        aria-hidden
      >
        <div className="w-full h-full rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.07)_0%,transparent_70%)]" />
      </motion.div>

      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3 block">How It Works</span>
          <h2
            className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            From zero to studying<br />in four steps
          </h2>
          <p className="text-gray-500 max-w-md mx-auto text-base">
            No friction. No lengthy onboarding. Just pick your subjects and get into a session.
          </p>
        </motion.div>

        {/* two-column step layout on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20">
          <div>
            {STEPS.slice(0, 2).map((s, i) => <Step key={i} step={s} index={i} />)}
          </div>
          <div className="md:pt-24">
            {STEPS.slice(2).map((s, i) => <Step key={i} step={s} index={i + 2} />)}
          </div>
        </div>
      </div>
    </section>
  );
}