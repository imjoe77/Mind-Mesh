'use client';

import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-14 px-6 lg:px-10">

      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">

        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 
               bg-clip-text text-transparent mb-3
               relative inline-block
               after:content-[''] after:absolute after:left-0 after:-bottom-1
               after:w-full after:h-[2px] after:bg-black">
            MindMesh
          </h2>

          <p className="text-gray-800 text-sm">
            A collaborative learning platform for students.
          </p>
        </div>

        <div>
          <h4 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 
               bg-clip-text text-transparent mb-3
               relative inline-block
               after:content-[''] after:absolute after:left-0 after:-bottom-1
               after:w-full after:h-[2px] after:bg-black">Product</h4>

          <ul className="space-y-3 text-gray-800 text-sm">

            <li className="list-none">
              <a
                href="/"
                className="inline-block transition-all duration-300 hover:text-blue-600 hover:translate-x-2"
              >
                Home
              </a>
            </li>

            <li className="list-none">
              <a
                href="/about"
                className="inline-block transition-all duration-300 hover:text-blue-600 hover:translate-x-2"
              >
                About Me
              </a>
            </li>

            <li className="list-none">
              <a
                href="/groups"
                className="inline-block transition-all duration-300 hover:text-blue-600 hover:translate-x-2"
              >
                Groups
              </a>
            </li>

          </ul>
        </div>

        <div>
          <h4 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 
               bg-clip-text text-transparent mb-3
               relative inline-block
               after:content-[''] after:absolute after:left-0 after:-bottom-1
               after:w-full after:h-[2px] after:bg-black">Company</h4>
          <ul className="space-y-2 text-gray-800 text-sm">
            <li>
              <a href="/About" className="hover:text-blue-600">About</a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-gray-900">Legal</h4>
          <ul className="space-y-2 text-gray-800 text-sm"></ul>
        </div>

      </div>

      {/* Bottom section */}
      <div className="flex flex-col items-center justify-center text-gray-800 text-sm mt-12 gap-3">
        <Image
          src="/logo.jpeg"
          alt="MindMesh Logo"
          width={250}
          height={120}
          className="opacity-90"
        />

        {/* Simple animated call-to-action link */}
        <a
          href="/About"
          className="relative inline-flex items-center gap-1 text-blue-600 font-medium group"
        >
          <span className="transition-transform duration-300 group-hover:-translate-y-0.5">
            Learn more about MindMesh
          </span>
          <span className="transition-transform duration-300 group-hover:translate-x-0.5">
            &rarr;
          </span>
          {/* animated underline */}
          <span className="absolute left-0 -bottom-0.5 h-[2px] w-full origin-left scale-x-0 bg-blue-500 transition-transform duration-300 group-hover:scale-x-100" />
        </a>

        <p>© 2026 MindMesh. All rights reserved.</p>
      </div>

    </footer>
  );
}