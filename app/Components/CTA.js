'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function CTA() {
  const { data: session } = useSession();
  return (
    <section className="relative py-24 lg:py-32 px-6 lg:px-10 overflow-hidden bg-white">
      {/* Premium Background Design */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-950 px-8 py-16 md:px-16 md:py-24 shadow-2xl">
          
          {/* Animated Background Layers */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.15),transparent_70%)]" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
          
          <div className="relative z-10 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Limited Intake 2026</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Master</span> Your Journey?
            </h2>
            
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
              Join thousands of students who are already using MindMesh to trade knowledge, find study partners, and achieve academic excellence together.
            </p>
            
            {!session && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8">
                <Link
                  href="/Home"
                  className="group relative px-8 py-4 bg-white text-slate-950 font-bold rounded-xl shadow-xl shadow-white/5 hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  Get Started Free
                  <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                </Link>
                
                <Link
                  href="/About"
                  className="px-8 py-4 text-white font-bold rounded-xl border border-white/10 hover:bg-white/5 transition-all duration-300"
                >
                  Watch Demo
                </Link>
              </div>
            )}
            
            <div className="pt-12 flex items-center justify-center gap-8 opacity-40">
              <div className="flex flex-col items-center">
                <span className="text-white text-xl font-bold">12k+</span>
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Students</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-white text-xl font-bold">4.9/5</span>
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Rating</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-white text-xl font-bold">24/7</span>
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Sessions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}