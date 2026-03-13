"use client";

import Link from "next/link";
import { Users, Layers, Clock, MessageCircle, BarChart3, Target } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Find Study Partners",
    desc: "Match with students who share your learning goals.",
  },
  {
    icon: Layers,
    title: "Structured Groups",
    desc: "Organize study sessions with clear agendas.",
  },
  {
    icon: Clock,
    title: "Smart Scheduling",
    desc: "Find common time slots instantly.",
  },
  {
    icon: MessageCircle,
    title: "Focused Discussions",
    desc: "Topic based chats designed for studying.",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    desc: "Monitor study sessions and completed topics.",
  },
  {
    icon: Target,
    title: "Goal Driven",
    desc: "Set milestones and achieve them together.",
  },
];

export default function Features() {
  return (
    <section className="py-28 bg-gradient-to-b from-white to-blue-50">

      {/* Heading */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-3 text-slate-900">
          Why MindMesh?
        </h2>
        <p className="text-slate-600">
          Everything needed for collaborative learning
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-6">

        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <Link key={index} href="/Login">

              <div className="group relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 cursor-pointer overflow-hidden">

                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition duration-300"></div>

                {/* Icon */}
                <div className="relative mb-4 w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white group-hover:scale-110 transition">
                  <Icon size={22} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold mb-2 text-slate-900 relative">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-slate-600 text-sm relative">
                  {feature.desc}
                </p>

              </div>

            </Link>
          );
        })}

      </div>
    </section>
  );
}