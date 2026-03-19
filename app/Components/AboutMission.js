'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const MISSION_TEXT =
  'Our goal is to transform studying into a collaborative experience where students grow, learn, and achieve success together.';

const OFFERINGS = [
  'Smart study partner matching',
  'Organised study groups',
  'Focused study sessions',
  'Real-time collaboration',
  'Productivity tracking',
];

/* Typewriter that only starts when in view */
function Typewriter({ text, inView }) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    setTyped('');
    const id = setInterval(() => {
      setTyped(text.slice(0, i + 1));
      i++;
      if (i === text.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [inView, text]);

  return (
    <span>
      {typed}
      {typed.length < text.length && (
        <span className="inline-block w-0.5 h-4 bg-sky-400 ml-0.5 align-middle animate-pulse" />
      )}
    </span>
  );
}

export default function AboutMission() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative bg-[#060810] py-28 px-6 lg:px-10 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.06)_0%,transparent_70%)]" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.06)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto grid md:grid-cols-2 gap-14 items-center">

        {/* ── Left: Mission text ── */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-sky-400 text-xs font-bold uppercase tracking-widest mb-4 block">
            Why We Exist
          </span>

          <h2
            className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight leading-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
              Mission
            </span>
          </h2>

          <p className="text-gray-400 leading-relaxed mb-6 text-[15px]">
            Many students struggle with motivation and distractions while studying
            alone. MindMesh solves this by connecting students with compatible
            study partners and creating focused study groups.
          </p>

          {/* typewriter quote */}
          <div className="relative pl-4 border-l-2 border-sky-500/40">
            <p className="text-gray-300 text-[15px] leading-relaxed italic min-h-[80px]">
              <Typewriter text={MISSION_TEXT} inView={inView} />
            </p>
          </div>
        </motion.div>

        {/* ── Right: Offerings card ── */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 overflow-hidden group"
        >
          {/* hover glow ring */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ boxShadow: 'inset 0 0 40px rgba(56,189,248,0.06)' }} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />

          <h3
            className="text-lg font-black text-white mb-6 tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            What MindMesh Offers
          </h3>

          <ul className="space-y-4">
            {OFFERINGS.map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 16 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3 text-gray-300 text-sm"
              >
                <CheckCircle2
                  className="text-sky-400 flex-shrink-0"
                  style={{ width: 16, height: 16 }}
                />
                {item}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}