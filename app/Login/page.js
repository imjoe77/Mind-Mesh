"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function LoginPage() {

  return (
    <div className="flex min-h-screen font-sans selection:bg-green-100 bg-white">

      {/* Left Side: Login Form */}
      <div className="w-full lg:w-[480px] p-8 md:p-16 flex flex-col justify-center bg-white border-r border-gray-100">
        <div className="w-full max-w-[320px] mx-auto lg:mx-0">

          {/* Brand Logo */}
          <div className="mb-12 flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="Mind Mesh Logo"
              width={48}
              height={48}
              className="rounded-xl shadow-md transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-2xl font-bold text-[#2e3738] tracking-tight transition-transform duration-300 group-hover:translate-x-0.5">
              Student Login
            </span>
          </div>

          <h1 className="text-3xl font-light text-[#001e2b] mb-2">Log in to your account</h1>
          <p className="text-sm mb-8 text-gray-500">
            Don't have an account? <Link href="/signup" className="text-blue-600 font-semibold hover:underline">Sign Up</Link>
          </p>

          {/* Social Auth Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => signIn('google', { callbackUrl: '/SDash' })}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 py-2.5 rounded hover:bg-gray-50 transition duration-200"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              <span className="text-gray-700 font-medium text-sm">Continue with Google</span>
            </button>
            <button
              onClick={() => signIn('github', { callbackUrl: '/SDash' })}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 py-2.5 rounded hover:bg-gray-50 transition duration-200"
            >
              <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              <span className="text-gray-700 font-medium text-sm">Continue with GitHub</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Side: Marketing Section */}
      <div className="hidden lg:flex flex-1 bg-[#00684a] p-16 flex-col justify-center relative overflow-hidden group">
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-400/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="max-w-md z-10 transition-transform duration-500 group-hover:-translate-y-2">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-[1.15]">
            Learn One, Teach One. <br/>
            <span className="text-emerald-300">Level Up Together.</span>
          </h2>
          <p className="text-white text-lg opacity-90 mb-8 leading-relaxed">
            Access a global network of student-experts. Trade your knowledge in one subject for mastery in another with our decentralized peer-to-peer mentoring system.
          </p>
          <Link href="/About" className="text-white font-bold border-b-2 border-white pb-1 inline-flex items-center gap-2 hover:opacity-75 transition-all">
            Learn more <span>&rarr;</span>
          </Link>
        </div>

        {/* Abstract Illustration Background */}
        <div className="absolute right-[-5%] bottom-[-5%] w-2/3 h-2/3 opacity-30 select-none pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
               fill="#59c2c2" 
               d="M44.7,-76.4C58.1,-69.2,69.2,-57.1,76.4,-43.3C83.6,-29.5,86.9,-14.8,85.1,-0.9C83.4,12.9,76.7,25.8,68.2,37.1C59.7,48.4,49.4,58.1,37.3,65.3C25.2,72.5,12.6,77.2,-0.9,78.8C-14.4,80.4,-28.8,78.9,-41.8,72.6C-54.8,66.3,-66.4,55.2,-73.9,41.9C-81.4,28.6,-84.8,14.3,-83.4,0.8C-82,-12.7,-75.8,-25.3,-67.2,-36.8C-58.6,-48.3,-47.6,-58.7,-34.9,-66.3C-22.2,-73.9,-11.1,-78.7,2.8,-83.5C16.7,-88.3,31.4,-83.6,44.7,-76.4Z" 
               transform="translate(100 100)" 
            />
          </svg>
        </div>
      </div>
    </div>
  );
}