'use client';

import Image from "next/image";
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
        
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 relative z-10">
          
          {/* Brand Identity */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-all duration-300">
                <span className="text-white text-lg font-bold">M</span>
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tight">MindMesh</span>
            </Link>
            
            <p className="text-gray-500 text-[15px] leading-relaxed max-w-sm">
              The peer-to-peer ecosystem where students connect, share knowledge, and master their academic journey together. Join thousands of student mentors today.
            </p>
            
            <div className="flex items-center gap-4">
              {['Twitter', 'GitHub', 'LinkedIn', 'Discord'].map((social) => (
                <button 
                  key={social}
                  className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all duration-300"
                  aria-label={social}
                >
                  <span className="sr-only">{social}</span>
                  <div className="w-4 h-4 rounded-sm border-2 border-current opacity-30 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-6">
            <h4 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest">Platform</h4>
            <ul className="space-y-4">
              {['Home', 'Dashboard', 'Discover', 'Groups'].map((item) => (
                <li key={item}>
                  <Link href={item === 'Home' ? '/' : `/${item}`} className="text-gray-500 hover:text-blue-600 transition-colors text-[14px] font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest">Resources</h4>
            <ul className="space-y-4">
              {['About Us', 'Community', 'Help Center', 'Developer API'].map((item) => (
                <li key={item}>
                  <Link href={`/${item.split(' ')[0]}`} className="text-gray-500 hover:text-blue-600 transition-colors text-[14px] font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[13px] font-bold text-gray-900 uppercase tracking-widest">Support</h4>
            <ul className="space-y-4">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'].map((item) => (
                <li key={item}>
                  <Link href="/" className="text-gray-500 hover:text-blue-600 transition-colors text-[14px] font-medium">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider and Bottom Section */}
        <div className="mt-16 lg:mt-24 pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="MindMesh Logo"
              width={120}
              height={40}
              className="opacity-90 grayscale hover:grayscale-0 transition-all duration-500"
            />
            <div className="h-4 w-[1px] bg-gray-200 hidden md:block" />
            <span className="text-gray-400 text-[13px] font-medium">
              &copy; {currentYear} MindMesh. All rights reserved.
            </span>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[12px] text-gray-500 font-medium tracking-tight">Active: 1,248 Nodes</span>
            </div>
            
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-md transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}