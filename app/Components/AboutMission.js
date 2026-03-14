"use client";

import { useEffect, useState } from "react";

export default function AboutMission() {

  const text = "Our goal is to transform studying into a collaborative experience where students grow, learn, and achieve success together.";
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    let i = 0;

    const interval = setInterval(() => {
      setTypedText(text.slice(0, i + 1));
      i++;

      if (i === text.length) {
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-slate-950 py-20 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">

        {/* Mission Text */}
        <div>
          <h2 className="text-3xl font-bold text-slate-50 mb-6 
          relative inline-block
          after:content-[''] after:absolute after:left-0 after:-bottom-1
          after:h-[3px] after:w-0 after:bg-cyan-400
          after:transition-all after:duration-500
          hover:after:w-full">
            Our Mission
          </h2>

          <p className="text-slate-300 mb-4 leading-relaxed">
            Many students struggle with motivation and distractions while studying
            alone. MindMesh solves this by connecting students with compatible
            study partners and creating focused study groups.
          </p>

          <p className="text-slate-400 leading-relaxed border-r-2 border-cyan-400 pr-1 inline-block">
            {typedText}
          </p>
        </div>

        {/* Features Card */}
        <div className="bg-[#0b132b] p-8 rounded-2xl 
        border border-white/10 
        shadow-lg 
        transition-all duration-300 
        hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] 
        hover:border-cyan-400/40">

          <h3 className="text-xl font-bold text-white mb-4 
          relative inline-block
          after:content-[''] after:absolute after:left-0 after:-bottom-1
          after:h-[2px] after:w-0 after:bg-cyan-400
          after:transition-all after:duration-300
          hover:after:w-full">
            What MindMesh Offers
          </h3>

          <ul className="space-y-3 text-gray-300">
            <li>Smart study partner matching</li>
            <li>Organized study groups</li>
            <li>Focused study sessions</li>
            <li>Real-time collaboration</li>
            <li>Productivity tracking</li>
          </ul>

        </div>
      </div>
    </section>
  );
}