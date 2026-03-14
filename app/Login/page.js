"use client";
import React, { useState } from 'react';
import Image from 'next/image';
//const router = useRouter();
export default function LoginPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="flex min-h-screen font-sans selection:bg-green-100">

      {/* Left Side: Login Form */}
      <div className="w-full lg:w-[480px] p-8 md:p-16 flex flex-col justify-between bg-white">
        <div className="w-full max-w-[320px] mx-auto lg:mx-0">

          {/* Brand Logo */}
          <div className="mb-12 flex items-center gap-3 group">
            <Image
              src="/logo.jpeg"
              alt="Mind Mesh Logo"
              width={48}
              height={48}
              className="rounded-xl shadow-md transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-2xl font-bold text-[#2e3738] tracking-tight transition-transform duration-300 group-hover:translate-x-0.5">
              Student Login
            </span>
          </div>

          <h1 className="text-3x2 font-light text-[#001e2b] mb-2">Log in to your account</h1>
          <p className="text-sm mb-8 text-[#ffffff]-600">
            Don't have an account? <Link href="/signup" className="text-blue-600 font-semibold hover:underline">Sign Up</Link>
          </p>

          {/* Social Auth Buttons */}
          <div className="space-y-5">
            <button className="w-full flex items-center justify-center gap-3 border border-gray-300 py-2.5 rounded hover:bg-blue-50 transition duration-200">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              <span className="text-gray-700 font-medium text-sm">Google</span>
            </button>
            <button className="w-full flex items-center justify-center gap-3 border border-gray-300 py-2.5 rounded hover:bg-gray-50 transition duration-200">
              <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <div className="absolute right-[-10%] bottom-[-10%] w-3/4 h-3/4 opacity-90 select-none pointer-events-none">
                  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <defs>
                      {/* The Mask defines the shape where the image will be visible */}
                      <mask id="blob-mask">
                        <path
                          fill="white"
                          d="M44.7,-76.4C58.1,-69.2,69.2,-57.1,76.4,-43.3C83.6,-29.5,86.9,-14.8,85.1,-0.9C83.4,12.9,76.7,25.8,68.2,37.1C59.7,48.4,49.4,58.1,37.3,65.3C25.2,72.5,12.6,77.2,-0.9,78.8C-14.4,80.4,-28.8,78.9,-41.8,72.6C-54.8,66.3,-66.4,55.2,-73.9,41.9C-81.4,28.6,-84.8,14.3,-83.4,0.8C-82,-12.7,-75.8,-25.3,-67.2,-36.8C-58.6,-48.3,-47.6,-58.7,-34.9,-66.3C-22.2,-73.9,-11.1,-78.7,2.8,-83.5C16.7,-88.3,31.4,-83.6,44.7,-76.4Z"
                          transform="translate(100 100)"
                        />
                      </mask>
                    </defs>

                    {/* The actual image being masked */}
                    <image
                      x="0"
                      y="0"
                      width="100%"
                      height="100%"
                      href="https://create.vista.com/photos/study/"
                      mask="url(#blob-mask)"
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </svg>
                </div>
              </svg>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/boost.svg" alt="Github" className="w-5 h-5" />
              <span className="text-gray-700 font-medium text-sm">GitHub</span>
            </button>

          </div>
          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200"></span>
            </div>
            
          </div>

          {/* Interactive Form */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1.5 uppercase">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-gray-200 rounded px-3 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                placeholder="email@example.com"
                required
              />
            </div>
           <button
  type="button"
  disabled={!email}
 // onClick={() => router.push("/SDash")}
  className={`w-full font-bold py-3 rounded transition-colors duration-200 ${
    email
      ? "bg-[#001e2b] text-white hover:bg-black"
      : "bg-gray-100 text-gray-400 cursor-not-allowed"
  }`}
>
  Next
</button>
          </form>
        </div>
      </div>

      {/* Right Side: Marketing Section */}
      <div className="hidden lg:flex group flex-1 bg-[#00684a] p-16 flex-col justify-center relative overflow-hidden transition-transform duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/40">
        <div className="max-w-md z-10 transition-transform duration-500 group-hover:translate-y-[-4px]">
          <h2 className="text-4xl font-bold text-white mb-6 leading-[1.15]">
            Learn One, Teach One. Level Up Together.
          </h2>
          <p className="text-white text-lg opacity-85 mb-8 leading-relaxed">
            Access a global network of student-experts. Trade your knowledge in one subject for mastery in another with our decentralized peer-to-peer mentoring system.
          </p>
          {/* <Link href="/learn-more" className="text-white font-bold border-b-2 border-white pb-1 inline-flex items-center gap-2 hover:opacity-75 transition-opacity"> */}
          Learn more <span>&rarr;</span>
          {/* </Link> */}
        </div>

        {/* Abstract Illustration Background */}
        <div className="absolute right-[-10%] bottom-[-10%] w-3/4 h-3/4 opacity-40 select-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path fill="#59c2c2" d="M44.7,-76.4C58.1,-69.2,69.2,-57.1,76.4,-43.3C83.6,-29.5,86.9,-14.8,85.1,-0.9C83.4,12.9,76.7,25.8,68.2,37.1C59.7,48.4,49.4,58.1,37.3,65.3C25.2,72.5,12.6,77.2,-0.9,78.8C-14.4,80.4,-28.8,78.9,-41.8,72.6C-54.8,66.3,-66.4,55.2,-73.9,41.9C-81.4,28.6,-84.8,14.3,-83.4,0.8C-82,-12.7,-75.8,-25.3,-67.2,-36.8C-58.6,-48.3,-47.6,-58.7,-34.9,-66.3C-22.2,-73.9,-11.1,-78.7,2.8,-83.5C16.7,-88.3,31.4,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
      </div>
    </div>
  );
}