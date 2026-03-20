'use client';

import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight, Star } from 'lucide-react';

const REVIEWS = [
  { name: 'Aisha K.', text: 'Found a study partner for DSA in 10 minutes. Aced the exam.', stars: 5 },
  { name: 'Rohan M.', text: 'Pomodoro rooms are a game-changer for group focus sessions.', stars: 5 },
  { name: 'Priya S.', text: 'Finally, a platform built by students who actually get it.', stars: 5 },
];

export default function CTA() {
  const { data: session } = useSession();
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: '-80px' });
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const blobY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  return (
    <section ref={sectionRef} className="relative bg-[#060810] py-28 px-6 lg:px-10 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* parallax glow */}
      <motion.div
        style={{ y: blobY }}
        className="absolute inset-x-0 top-[20%] flex justify-center pointer-events-none"
      >
        <div className="w-[700px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.07)_0%,transparent_70%)]" />
      </motion.div>

      <div className="max-w-5xl mx-auto">

        {/* review cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {REVIEWS.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5"
            >
              <div className="flex gap-0.5 mb-3">
                {Array(r.stars).fill(0).map((_, j) => (
                  <Star key={j} className="fill-amber-400 text-amber-400" style={{ width: 13, height: 13 }} />
                ))}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">"{r.text}"</p>
              <span className="text-gray-600 text-xs font-medium">— {r.name}</span>
            </motion.div>
          ))}
        </div>

        {/* main CTA card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900 to-[#060810] p-12 md:p-20 text-center"
        >
          {/* card glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[280px] bg-sky-500/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 text-sky-400 text-[11px] font-bold uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse inline-block" />
              Limited Intake — 2026
            </div>

            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight tracking-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Ready to study<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
                smarter, together?
              </span>
            </h2>

            <p className="text-gray-400 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Join thousands of students already using MindMesh to find study partners, run live sessions, and grow through peer learning.
            </p>

            {!session && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/Home">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative flex items-center gap-2 px-8 py-3.5 bg-white text-gray-950 text-sm font-bold rounded-xl overflow-hidden shadow-xl shadow-white/10"
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none" />
                    <span className="relative">Get Started Free</span>
                    <ArrowRight className="relative w-4 h-4 transition-transform group-hover:translate-x-1 duration-200" />
                  </motion.button>
                </Link>
                <Link href="/About">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-8 py-3.5 text-gray-400 text-sm font-semibold rounded-xl border border-white/10 hover:bg-white/5 transition-all duration-200"
                  >
                    Watch Demo
                  </motion.button>
                </Link>
              </div>
            )}

            <div className="mt-14 flex items-center justify-center gap-10 opacity-40">
              {[['12k+', 'Students'], ['4.9/5', 'Rating'], ['24/7', 'Sessions']].map(([val, lbl], i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <span className="text-white text-lg font-bold">{val}</span>
                  <span className="text-gray-500 text-[10px] uppercase tracking-widest font-semibold">{lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}