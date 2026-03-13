'use client';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* FULL WIDTH BACKGROUND IMAGE */}
      <div className="absolute inset-0">
        <img
          src="/Hero.png"
          alt="Students studying"
          className="w-full h-full object-cover"
        />
      </div>

      {/* OVERLAY FOR READABILITY */}
      {/* <div className="absolute inset-0 bg-white/50 backdrop-blur-sm"></div> */}

      {/* FLOATING PHOTO CARDS */}
      <div className="absolute inset-0 pointer-events-none">

        <img
          src="/card1.png"
          className="absolute top-20 left-20 w-72 rounded-2xl shadow-xl rotate-[-8deg]"
        />

        <img
          src="/card1.png"
          className="absolute top-24 right-20 w-72 rounded-2xl shadow-xl rotate-6"
        />

        <img
          src="/card1.png"
          className="absolute bottom-24 left-32 w-72 rounded-2xl shadow-xl rotate-[-6deg]"
        />

        <img
          src="/card1.png"
          className="absolute bottom-24 right-32 w-72 rounded-2xl shadow-xl rotate-8"
        />

      </div>

      {/* HERO CONTENT */}
      <div className="relative z-10 text-center max-w-3xl px-6">

        <h1 className="text-6xl font-bold mb-6">
          <span className="text-blue-600">Connect minds.</span>
          <br />
          <span className="text-gray-900">Learn together.</span>
        </h1>

        <p className="text-gray-600 mb-8 text-lg">
          MindMesh helps students collaborate, find study partners,
          and grow faster through peer learning.
        </p>

        <div className="flex justify-center gap-4">

          <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl shadow-lg hover:-translate-y-1 transition">
            Start Learning
          </button>

          {/* <button className="border border-gray-300 px-8 py-3 rounded-xl hover:bg-gray-100 transition">
            View Demo
          </button> */}

        </div>

      </div>

    </section>
  );
}