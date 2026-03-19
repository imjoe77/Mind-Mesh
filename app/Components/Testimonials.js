'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  { name: 'Aisha K.', role: 'CS — 3rd Year', text: 'Found a DSA partner in 10 minutes. Cleared my placement round a week later.', stars: 5 },
  { name: 'Rohan M.', role: 'ECE — 2nd Year', text: 'The Pomodoro rooms make our group actually stay focused instead of just chatting.', stars: 5 },
  { name: 'Priya S.', role: 'BCA — 4th Sem', text: 'Honestly the best study tool Ive used. Feels like it was made for people like me.', stars: 5 },
  { name: 'Dev T.', role: 'Mech — Final Year', text: 'Used to grind alone for 6 hours. Now we do 4 focused Pomodoros and cover more.', stars: 5 },
  { name: 'Sneha R.', role: 'IT — 2nd Year', text: 'The AI notes from sessions save so much revision time. Game changer.', stars: 5 },
  { name: 'Arjun B.', role: 'CS — 1st Year', text: 'Made friends through study groups here that I couldnt find in my actual class.', stars: 5 },
  { name: 'Fatima Z.', role: 'MBA — 1st Year', text: 'Session scheduling + auto-reminders means we actually show up every time.', stars: 5 },
  { name: 'Karan V.', role: 'BCA — 3rd Sem', text: 'Leaderboard competition with my roommates turned studying into something fun.', stars: 5 },
];

const ROW_A = TESTIMONIALS.slice(0, 4);
const ROW_B = TESTIMONIALS.slice(4);

function TestimonialCard({ t }) {
  return (
    <div className="flex-shrink-0 w-72 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 mx-3">
      <div className="flex gap-0.5 mb-3">
        {Array(t.stars).fill(0).map((_, i) => (
          <Star key={i} className="fill-amber-400 text-amber-400" style={{ width: 13, height: 13 }} />
        ))}
      </div>
      <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
      <div>
        <p className="text-white text-xs font-bold">{t.name}</p>
        <p className="text-gray-600 text-[11px]">{t.role}</p>
      </div>
    </div>
  );
}

/* Infinite ticker — duplicates cards, translates left, jumps back seamlessly */
function Ticker({ cards, direction = 1, speed = 40 }) {
  const doubled = [...cards, ...cards, ...cards];
  const totalWidth = cards.length * (288 + 24); // card w + mx

  return (
    <div className="overflow-hidden w-full">
      <motion.div
        className="flex"
        animate={{ x: direction === 1 ? [-totalWidth, 0] : [0, -totalWidth] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((t, i) => <TestimonialCard key={i} t={t} />)}
      </motion.div>
    </div>
  );
}

export default function Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="relative bg-[#060810] py-28 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* heading */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 px-6"
      >
        <span className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3 block">Student Stories</span>
        <h2
          className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          Loved by students<br />across campuses
        </h2>
        <p className="text-gray-500 max-w-md mx-auto text-base">
          Real results from real students — not marketing copy.
        </p>
      </motion.div>

      {/* edge fades */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#060810] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#060810] to-transparent z-10 pointer-events-none" />

        <div className="space-y-4">
          <Ticker cards={ROW_A} direction={1}  speed={38} />
          <Ticker cards={ROW_B} direction={-1} speed={44} />
        </div>
      </div>
    </section>
  );
}