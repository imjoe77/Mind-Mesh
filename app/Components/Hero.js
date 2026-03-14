'use client';

import { useState } from 'react';
import { TypeAnimation } from "react-type-animation";
import Link from 'next/link';

export default function Hero() {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      onMouseMove={handleMouseMove}
    >

      {/* CLEAN GRADIENT BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900"></div>

      {/* SUBTLE DARK OVERLAY FOR TEXT */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* CURSOR-FOLLOWING LIGHT, INSPIRED BY SPLINE INTERACTION */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(500px circle at ${cursorPos.x}px ${cursorPos.y}px, rgba(56,189,248,0.35), transparent 60%)`,
          transition: 'background-position 0.15s ease-out',
        }}
      ></div>

      {/* SOFT GLOW BLOBS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>

        <div className="absolute top-[40%] right-[-180px] w-[420px] h-[420px] bg-sky-500/20 rounded-full blur-3xl animate-pulse"></div>

        <div className="absolute bottom-[-180px] left-[35%] w-[420px] h-[420px] bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>

      </div>

      {/* HERO CONTENT */}
      <div className="relative z-10 text-center max-w-3xl px-6">

        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">

          <span className="text-blue-500">
            <TypeAnimation
              sequence={[
                "Connect minds.",
                2500,
                "Connect students.",
                2500,
                "Connect learners.",
                2500,
              ]}
              speed={55}
              repeat={Infinity}
            />
          </span>

          <br />

          <span className="text-gray-100">
            <TypeAnimation
              sequence={[
                "Learn together.",
                2500,
                "Grow together.",
                2500,
                "Study together.",
                2500,
              ]}
              speed={55}
              repeat={Infinity}
            />
          </span>

        </h1>

        <p className="text-gray-300 mb-4 text-lg">
          MindMesh helps students collaborate, find study partners,
          and grow faster through peer learning.
        </p>

        <p className="text-gray-400 mb-10 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Create or join focused study groups, pair up for one-to-one mentoring,
          track your progress across subjects, and turn your strengths into
          support for other learners — all inside a single student-first platform.
        </p>

        <div className="flex justify-center gap-4">
          <Link href="/Login">
          <button className="relative inline-flex items-center justify-center px-8 py-3 rounded-xl overflow-hidden text-sm md:text-base font-semibold text-white bg-slate-900/40 border border-blue-500/40 backdrop-blur shadow-lg shadow-blue-500/20 transition-all group">
            <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></span>
            <span className="relative">Start Learning</span>
          </button>
          </Link>
        </div>

      </div>

    </section>
  );
}