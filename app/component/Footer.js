"use client"

import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const links = {
    platform: [
      { label: "Dashboard", href: "/SDash" },
      { label: "Discover Groups", href: "/groups" },
      { label: "Create Group", href: "/groups/create" },
      { label: "About Us", href: "/About" },
    ],
    resources: [
      { label: "Help Center", href: "#" },
      { label: "Community Guidelines", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  }

  return (
    <footer className="bg-white border-t border-zinc-200/60 mt-auto w-full overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 overflow-hidden">

        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-10 py-10">

          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <span className="text-white text-sm font-bold">M</span>
              </div>
              <span className="text-[16px] font-bold text-zinc-800 tracking-tight">MindMesh</span>
            </div>
            <p className="text-[13px] text-zinc-400 leading-relaxed max-w-xs">
              Empowering students through collaborative learning, skill matching, and academic intelligence.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 pt-1">
              {[
                { name: "GitHub", path: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" },
                { name: "Twitter", path: "M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 01-1.93.07 4.28 4.28 0 004 2.98 8.521 8.521 0 01-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" },
                { name: "LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
              ].map((social) => (
                <a
                  key={social.name}
                  href="#"
                  aria-label={social.name}
                  className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-300"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {links.platform.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[13px] text-zinc-500 hover:text-indigo-600 transition-colors duration-200 font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-4">Resources</h4>
            <ul className="space-y-2.5">
              {links.resources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-[13px] text-zinc-500 hover:text-indigo-600 transition-colors duration-200 font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-zinc-100 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[12px] text-zinc-400 font-medium">
            © {currentYear} MindMesh. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-zinc-400 font-medium">All systems operational</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
