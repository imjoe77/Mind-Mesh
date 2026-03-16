'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import NotificationBell from './NotificationBell';

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleMenuToggle = () => setMenuOpen((prev) => !prev);
  const handleMenuItemClick = () => setMenuOpen(false);

  if (pathname === '/Login') return null;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex justify-between items-center">

        {/* Logo */}
        <div className="flex items-center gap-3 group px-2 py-1.5 rounded-xl bg-white/50 backdrop-blur-sm border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-sm transition-all duration-300">
          <div className="relative overflow-hidden rounded-lg">
            <Image
              src="/logo.png"
              alt="Mind Mesh Logo"
              width={140}
              height={36}
              className="object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <span
            className={`overflow-hidden transition-[max-width,opacity,transform] duration-500 ease-out ${
              scrolled
                ? 'max-w-xs opacity-100 translate-y-0'
                : 'max-w-0 opacity-0 translate-y-1'
            }`}
          >
            <span className="inline-block text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent border-b-2 border-blue-500/80 pb-0.5">
              Mind Mesh
            </span>
          </span>
        </div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-600">
          <li>
            <a href="/Home" className="hover:text-blue-600 transition">Home</a>
          </li>
          <li>
            <a href="/SDash" className="hover:text-blue-600 transition">Dashboard</a>
          </li>
          <li>
            <a href="/About" className="hover:text-blue-600 transition">About</a>
          </li>
          <li>
            <a href="/discover" className="hover:text-blue-600 transition">Discover</a>
          </li>
          <li>
            <a href="/groups" className="hover:text-blue-600 transition">Groups</a>
          </li>
          {!session && (
            <li>
              <Link href="/Home">
                <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
                  Get Started
                </button>
              </Link>
            </li>
          )}
        </ul>

        {/* Right side: Hamburger + Login */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={handleMenuToggle}
            className="md:hidden text-gray-700"
            aria-label="Open menu"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>

          {/* Login / User UI */}
          {session ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <a 
                href="/SDash"
                className="hidden sm:block"
              >
                <Image
                  src={session?.user?.image || "/default-avatar.png"} 
                  alt="Profile" 
                  width={44}
                  height={44}
                  className="rounded-full border-2 border-indigo-100 shadow-sm object-cover hover:scale-110 transition-transform"
                />
              </a>
              <button
                onClick={() => signOut({ callbackUrl: '/Login' })}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-zinc-500 bg-zinc-100 hover:bg-red-50 hover:text-red-600 border border-zinc-200 hover:border-red-200 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          ) : (
            <a
              href="/Login"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              Login
            </a>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/90 backdrop-blur border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col gap-3 text-sm font-semibold text-gray-700">
              <a href="/Home" onClick={handleMenuItemClick} className="hover:text-blue-600">Home</a>
                 <a href="/SDash" onClick={handleMenuItemClick} className="hover:text-blue-600">Dashboard</a>
              <a href="/About" onClick={handleMenuItemClick} className="hover:text-blue-600">About</a>
              <a href="/discover" onClick={handleMenuItemClick} className="hover:text-blue-600">Discover</a>
               <a href="/groups" onClick={handleMenuItemClick} className="hover:text-blue-600">Groups</a>
              {session ? (
                <button
                  onClick={() => { handleMenuItemClick(); signOut({ callbackUrl: '/Login' }); }}
                  className="mt-2 flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              ) : (
                <Link
                  href="/Home"
                  onClick={handleMenuItemClick}
                  className="mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-full shadow-md w-fit text-center"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}