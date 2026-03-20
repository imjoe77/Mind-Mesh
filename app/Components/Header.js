'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Menu, X, ChevronDown } from 'lucide-react';
import NotificationBell from './NotificationBell';

const NAV_LINKS = [
  { label: 'Home',     href: '/Home' },
  { label: 'Profile',  href: '/SDash' },
  { label: 'About',    href: '/About' },
  { label: 'Discover', href: '/discover' },
  { label: 'Groups',   href: '/groups' },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (pathname === '/Login') return null;

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50">

        {/* ── Pill navbar container ── */}
        <div className="max-w-6xl mx-auto px-4 pt-5">
          <motion.div
            initial={false}
            animate={scrolled ? 'scrolled' : 'top'}
            variants={{
              top: {
                backgroundColor: 'rgba(15,22,36,0.8)',
                borderColor: 'rgba(255,255,255,0.15)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              },
              scrolled: {
                backgroundColor: 'rgba(9,12,22,0.92)',
                borderColor: 'rgba(56,189,248,0.25)',
                boxShadow: '0 12px 50px rgba(0,0,0,0.6), 0 0 15px rgba(56,189,248,0.1)',
              },
            }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between h-16 px-5 rounded-2xl border"
            style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
          >

            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
              <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-lg shadow-sky-500/10 group-hover:scale-110 transition-transform duration-300">
                <Image 
                  src="/logo.png" 
                  alt="MindMesh Logo" 
                  fill 
                  className="object-cover rounded-full" 
                />
              </div>
              <span 
                className="text-white text-[20px] font-black tracking-tight hidden sm:block"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                MindMesh
              </span>
            </Link>

            {/* ── Desktop pill nav ── */}
            <nav className="hidden md:flex items-center gap-0.5 bg-white/[0.06] border border-white/[0.09] rounded-xl px-1.5 py-1.5">
              {NAV_LINKS.map(({ label, href }) => {
                const active = pathname === href;
                return (
                  <Link key={href} href={href} className="relative">
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-lg bg-white/[0.1] border border-white/[0.1]"
                        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                      />
                    )}
                    <span
                      className={`relative z-10 block px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors duration-150 ${
                        active ? 'text-white' : 'text-gray-200 hover:text-white'
                      }`}
                    >
                      {label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-2">
              {session ? (
                <>
                  <NotificationBell />
                  <Link href="/SDash" className="hidden sm:block">
                    <Image
                      src={session?.user?.image || '/default-avatar.png'}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full border border-white/10 object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/Login' })}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-gray-400 bg-white/[0.04] border border-white/[0.06] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-200"
                  >
                    <LogOut style={{ width: 12, height: 12 }} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/Login"
                    className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg text-[13px] font-semibold text-gray-200 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link href="/Home">
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 shadow-md shadow-sky-500/20 hover:shadow-sky-500/30 transition-shadow duration-200"
                    >
                      Get Started
                    </motion.button>
                  </Link>
                </>
              )}

              {/* hamburger */}
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.07] transition-all duration-200"
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={menuOpen ? 'close' : 'open'}
                    initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                  >
                    {menuOpen
                      ? <X style={{ width: 17, height: 17 }} />
                      : <Menu style={{ width: 17, height: 17 }} />
                    }
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </motion.div>

          {/* ── Mobile dropdown (slides down from pill) ── */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'top', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                className="md:hidden mt-1.5 rounded-2xl border border-white/[0.08] bg-[#060810]/90 overflow-hidden"
              >
                <div className="p-3 flex flex-col gap-0.5">
                  {NAV_LINKS.map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        pathname === href
                          ? 'text-white bg-white/[0.08]'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      {label}
                    </Link>
                  ))}

                  <div className="mt-2 pt-2 border-t border-white/[0.06] flex flex-col gap-1.5">
                    {session ? (
                      <button
                        onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/Login' }); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all duration-150"
                      >
                        <LogOut style={{ width: 14, height: 14 }} />
                        Logout
                      </button>
                    ) : (
                      <>
                        <Link
                          href="/Login"
                          onClick={() => setMenuOpen(false)}
                          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all duration-150"
                        >
                          Login
                        </Link>
                        <Link
                          href="/Home"
                          onClick={() => setMenuOpen(false)}
                          className="px-4 py-2.5 rounded-xl text-sm font-bold text-white text-center bg-gradient-to-r from-sky-500 to-indigo-600"
                        >
                          Get Started
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* push page content below the floating header */}
      <div className="h-32 bg-[#1a2332]" />
    </>
  );
}