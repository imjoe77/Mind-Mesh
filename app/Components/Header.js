'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 border-b border-gray-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex justify-between items-center">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            MindMesh
          </h1>
        </div>

        {/* Menu */}
        <ul className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-600">
          <li>
            <Link href="/Home" className="hover:text-blue-600 transition">
              Home
            </Link>
          </li>
          <li>
            <Link href="#features" className="hover:text-blue-600 transition">
              Features
            </Link>
          </li>

          <li>
            <Link href="/groups" className="hover:text-blue-600 transition">
              Groups
            </Link>
          </li>

          <li>
            <Link href="/discover" className="hover:text-blue-600 transition">
              Discover
            </Link>
          </li>

          <li>
            <Link href="/SDash" className="hover:text-blue-600 transition">
              Dashboard
            </Link>
          </li>

          <li>
            <Link href="/About" className="hover:text-blue-600 transition">
              About
            </Link>
          </li>

          <li>
            <Link href="#contact" className="hover:text-blue-600 transition">
              Contact
            </Link>
          </li>

          <li>
            {session ? (
              <div className="flex items-center gap-4">
                <NotificationBell />
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 max-w-[120px] truncate font-semibold">
                    {session.user?.name || session.user?.email}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/Home' })}
                    className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-red-200 transition-all"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/Login">
                <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
                  Get Started
                </button>
              </Link>
            )}
          </li>
        </ul>

        {/* Mobile Icon */}
        <button className="md:hidden text-gray-700">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

      </nav>
    </header>
  );
}