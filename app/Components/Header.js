'use client';

export default function Header() {
  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 
      ${scrolled
        ? "bg-white/70 backdrop-blur-xl border-b border-gray-200 shadow-md"
        : "bg-white border-b border-gray-200"}
      `}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex justify-between items-center">

        {/* Logo */}
        <div className="flex items-center gap-3 group">
          <Image
            src="/logo.jpeg"
            alt="Mind Mesh Logo"
            width={150}
            height={40}
            className="rounded-full shadow-sm transition-transform duration-300 group-hover:scale-110"
          />
          {/* Brand text appears only after scroll */}
          <span
            className={`overflow-hidden transition-[max-width,opacity,transform] duration-500 ease-out ${
              scrolled
                ? "max-w-xs opacity-100 translate-y-0"
                : "max-w-0 opacity-0 translate-y-1"
            }`}
          >
            <span className="inline-block text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent border-b-2 border-blue-500/80 pb-0.5">
              Mind Mesh
            </span>
          </span>
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Login */}
          <a
            href="/Login"
            className="hidden sm:inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all"
          >
            Login
          </a>

        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/90 backdrop-blur border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col gap-3 text-sm font-semibold text-gray-700">
              <a href="/Home" onClick={handleMenuItemClick} className="hover:text-blue-600">
                Home
              </a>
              <a href="/About" onClick={handleMenuItemClick} className="hover:text-blue-600">
                About
              </a>
              <a href="#contact" onClick={handleMenuItemClick} className="hover:text-blue-600">
                Contact
              </a>
              <button
                onClick={handleMenuItemClick}
                className="mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-full shadow-md w-fit"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}