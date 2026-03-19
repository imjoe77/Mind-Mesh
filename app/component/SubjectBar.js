"use client";

import { useState } from "react";

export default function SubjectBar({ name, percent, color }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="group flex items-center gap-4 mb-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col flex-1 gap-1.5">
        <div className="flex justify-between items-end">
          <span className="text-[12px] font-semibold text-zinc-700 group-hover:text-indigo-600 transition-colors tracking-tight">{name}</span>
          <span className="text-[12px] font-bold text-zinc-500">{percent}%</span>
        </div>

        <div className="relative h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out`}
            style={{ 
               width: `${percent}%`, 
               background: isHovered ? '#4f46e5' : color,
               boxShadow: isHovered ? '0 0 10px rgba(79, 70, 229, 0.3)' : 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
}
