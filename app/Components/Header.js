'use client';

export default function Header() {
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
            <a href="/Home" className="hover:text-blue-600 transition">
              Home
            </a>
          </li>
          <li>
            <a href="#features" className="hover:text-blue-600 transition">
              Features
            </a>
          </li>

          <li>
            <a href="/About" className="hover:text-blue-600 transition">
              About
            </a>
          </li>

          <li>
            <a href="#contact" className="hover:text-blue-600 transition">
              Contact
            </a>
          </li>

          <li>
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition">
              Get Started
            </button>
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