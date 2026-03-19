'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, MessageCircle, ArrowUp } from 'lucide-react';

const SOCIALS = [
  { label: 'Twitter',  icon: Twitter,       href: '#' },
  { label: 'GitHub',   icon: Github,        href: '#' },
  { label: 'LinkedIn', icon: Linkedin,      href: '#' },
  { label: 'Discord',  icon: MessageCircle, href: '#' },
];

const LINKS = {
  Platform:  ['Home', 'Dashboard', 'Discover', 'Groups'],
  Resources: ['About Us', 'Community', 'Help Center', 'Developer API'],
  Legal:     ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'],
};

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative bg-[#060810] border-t border-white/[0.07] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/20 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-sky-500/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div className="w-14 h-14 rounded-full overflow-hidden shadow-lg shadow-sky-500/10 group-hover:scale-110 transition-transform duration-300">
                <img src="/logo.png" alt="MindMesh Logo" className="w-full h-full object-cover rounded-full" />
              </div>
              <span className="text-xl font-black text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                MindMesh
              </span>
            </Link>
            <p className="text-gray-500 text-[14px] leading-relaxed max-w-xs">
              The peer-to-peer ecosystem where students connect, share knowledge, and master their academic journey together.
            </p>
            <div className="flex items-center gap-3">
              {SOCIALS.map(({ label, icon: Icon, href }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-gray-500 hover:text-sky-400 hover:border-sky-500/30 hover:bg-sky-500/5 transition-all duration-200">
                  <Icon style={{ width: 14, height: 14 }} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(LINKS).map(([heading, items]) => (
            <div key={heading} className="space-y-5">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{heading}</h4>
              <ul className="space-y-3.5">
                {items.map((item) => (
                  <li key={item}>
                    <Link href="/" className="text-gray-600 hover:text-gray-300 transition-colors text-[13px] font-medium">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/[0.07] flex flex-col md:flex-row justify-between items-center gap-5">
          <div className="flex items-center gap-4">
            <span className="text-white text-base font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>MindMesh</span>
            <div className="h-3.5 w-px bg-white/10" />
            <span className="text-gray-600 text-[12px]">&copy; {year} MindMesh. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-gray-600 text-[12px] font-medium">1,248 active nodes</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-all duration-200"
            >
              <ArrowUp style={{ width: 14, height: 14 }} />
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}