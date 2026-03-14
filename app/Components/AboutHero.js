'use client';

import { useState } from 'react';

export default function AboutHero() {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isDark, setIsDark] = useState(true);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });
  };

  const sectionBg = isDark
    ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950'
    : 'bg-gradient-to-b from-slate-50 via-white to-sky-50';

  return (
    <section
      className={`relative overflow-hidden py-20 px-6 transition-colors ${sectionBg}`}
      onMouseMove={handleMouseMove}
    >
      {/* Spline animated background (desktop, dark mode). 
         For best results, replace this URL with your Spline "embed" link
         from the Share > Embed option, e.g. https://my.spline.design/scene-id/.
      */}
      {isDark && (
        <div className="absolute inset-0 -z-20 hidden md:block">
          <iframe
            src="https://app.spline.design/community/file/fba5a24b-a843-461d-b983-e5c140313420"
            title="MindMesh About background"
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
      )}

      {/* Gradient overlay to blend Spline with existing dark theme */}
      {isDark && (
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/85 via-slate-950/70 to-emerald-950/90" />
      )}

      {/* Soft background blobs (respect local light / dark toggle) */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className={`absolute -top-40 -left-40 h-72 w-72 rounded-full blur-3xl ${
            isDark ? 'bg-emerald-500/25' : 'bg-sky-400/25'
          }`}
        />
        <div
          className={`absolute -bottom-40 right-0 h-80 w-80 rounded-full blur-3xl ${
            isDark ? 'bg-sky-500/25' : 'bg-indigo-400/20'
          }`}
        />
      </div>

      {/* Cursor-follow glow similar to Home hero */}
      <div
        className={`pointer-events-none absolute inset-0 z-0 ${
          isDark ? 'mix-blend-overlay' : 'mix-blend-screen'
        }`}
        style={{
          background: `radial-gradient(420px circle at ${cursorPos.x}px ${cursorPos.y}px, rgba(56,189,248,0.3), transparent 65%)`,
          transition: 'background-position 0.15s ease-out',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Local light / dark toggle for About section */}
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent">
            About MindMesh
          </span>
        </h1>

        <p
          className={`text-lg max-w-3xl mx-auto ${
            isDark ? 'text-slate-200' : 'text-gray-700'
          }`}
        >
          MindMesh is a collaborative learning platform that connects students
          who want to study smarter together. Instead of studying alone,
          students can build strong study networks and stay accountable.
        </p>

        {/* Four cards explaining the platform, light/dark aware */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className={`rounded-2xl px-4 py-4 text-left shadow-sm border ${
              isDark
                ? 'border-slate-700 bg-slate-900/70'
                : 'border-slate-200 bg-white/80'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">
              Study circles
            </p>
            <p
              className={`mt-2 text-sm ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              Join subject-based groups to learn with peers at your level.
            </p>
          </div>

          <div
            className={`rounded-2xl px-4 py-4 text-left shadow-sm border ${
              isDark
                ? 'border-slate-700 bg-slate-900/70'
                : 'border-slate-200 bg-white/80'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500">
              Peer mentoring
            </p>
            <p
              className={`mt-2 text-sm ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              Trade your strengths in one topic for help in another.
            </p>
          </div>

          <div
            className={`rounded-2xl px-4 py-4 text-left shadow-sm border ${
              isDark
                ? 'border-slate-700 bg-slate-900/70'
                : 'border-slate-200 bg-white/80'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
              Live sessions
            </p>
            <p
              className={`mt-2 text-sm ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              Host focused sessions with notes, tasks, and follow-ups.
            </p>
          </div>

          <div
            className={`rounded-2xl px-4 py-4 text-left shadow-sm border ${
              isDark
                ? 'border-slate-700 bg-slate-900/70'
                : 'border-slate-200 bg-white/80'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-500">
              Progress mesh
            </p>
            <p
              className={`mt-2 text-sm ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}
            >
              See how every session contributes to your long-term goals.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}