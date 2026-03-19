'use client';

import { useRef, useEffect } from 'react';
import { motion, useAnimationFrame, useMotionValue, useSpring } from 'framer-motion';

const CARDS = [
  { accent: 'sky',     label: 'Study Circles',   desc: 'Join subject-based groups to learn with peers at your level.' },
  { accent: 'emerald', label: 'Peer Mentoring',   desc: 'Trade your strengths in one topic for help in another.' },
  { accent: 'indigo',  label: 'Live Sessions',    desc: 'Host focused sessions with notes, tasks, and follow-ups.' },
  { accent: 'violet',  label: 'Progress Mesh',    desc: 'See how every session contributes to your long-term goals.' },
];

const ACCENT_COLOR = {
  sky:     'text-sky-400 border-sky-500/20 bg-sky-500/5',
  emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
  indigo:  'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
  violet:  'text-violet-400 border-violet-500/20 bg-violet-500/5',
};

const GLOW = {
  sky:     'rgba(56,189,248,0.07)',
  emerald: 'rgba(16,185,129,0.07)',
  indigo:  'rgba(99,102,241,0.07)',
  violet:  'rgba(139,92,246,0.07)',
};

/* Card with its own mini cursor glare */
function Card({ card, index }) {
  const glareRef = useRef(null);

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (glareRef.current) {
      glareRef.current.style.background =
        `radial-gradient(200px circle at ${e.clientX - r.left}px ${e.clientY - r.top}px, ${GLOW[card.accent]}, transparent 70%)`;
    }
  };
  const onMouseLeave = () => {
    if (glareRef.current) glareRef.current.style.background = 'none';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.5 + index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`relative rounded-2xl border bg-white/[0.03] p-5 text-left overflow-hidden cursor-default
        hover:bg-white/[0.055] transition-all duration-300
        ${ACCENT_COLOR[card.accent].split(' ').filter(c => c.startsWith('border')).join(' ')}`}
    >
      <div ref={glareRef} className="absolute inset-0 pointer-events-none transition-all duration-75" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

      <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${ACCENT_COLOR[card.accent].split(' ')[0]}`}>
        {card.label}
      </p>
      <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
    </motion.div>
  );
}

/* Section-level cursor glare */
function CursorGlare({ x, y }) {
  const ref = useRef(null);
  useAnimationFrame(() => {
    if (!ref.current) return;
    ref.current.style.background = [
      `radial-gradient(160px circle at ${x.get()}px ${y.get()}px, rgba(56,189,248,0.32), transparent 100%)`,
      `radial-gradient(480px circle at ${x.get()}px ${y.get()}px, rgba(99,102,241,0.14), transparent 70%)`,
    ].join(', ');
  });
  return <div ref={ref} className="absolute inset-0 pointer-events-none z-10" />;
}

export default function AboutHero() {
  const sectionRef = useRef(null);
  const rawX = useMotionValue(-1000);
  const rawY = useMotionValue(-1000);
  const cx = useSpring(rawX, { stiffness: 150, damping: 22 });
  const cy = useSpring(rawY, { stiffness: 150, damping: 22 });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      rawX.set(e.clientX - r.left);
      rawY.set(e.clientY - r.top);
    };
    const onLeave = () => { rawX.set(-1000); rawY.set(-1000); };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[88vh] flex items-center overflow-hidden bg-[#060810] py-32 px-6"
    >
      <CursorGlare x={cx} y={cy} />

      {/* ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.1)_0%,transparent_70%)]" />
        <div className="absolute -bottom-32 right-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,transparent_70%)]" />
      </div>

      {/* dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.18]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.28) 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 80% 75% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 75% at 50% 50%, black 30%, transparent 100%)',
        }}
      />

      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />

      <div className="relative z-20 max-w-5xl mx-auto w-full text-center">

        {/* label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 text-sky-400 text-[11px] font-bold tracking-widest uppercase"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping inline-block" />
          Our Story
        </motion.div>

        {/* headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-[clamp(2.6rem,6.5vw,5rem)] font-black leading-[1.05] tracking-tight mb-6 text-white"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Built by students,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400">
            for students
          </span>
        </motion.h1>

        {/* sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed mb-14"
        >
          MindMesh is a collaborative learning platform that connects students
          who want to study smarter together. Build strong study networks,
          stay accountable, and grow through peer learning.
        </motion.p>

        {/* cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card, i) => <Card key={i} card={card} index={i} />)}
        </div>
      </div>

      {/* bottom vignette */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#060810] to-transparent pointer-events-none" />
    </section>
  );
}