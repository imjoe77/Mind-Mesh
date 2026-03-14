// import Image from "next/image";

// export default function AboutTeam() {
//   const members = [
//     {
//       name: "Nathaniel Bandi",
//       role: "Backend Developer",
//       image: "/joel.jpg",
//     },
//     {
//       name: "Nikhil Pujar",
//       role: "Frontend Developer",
//       image: "/nikhil.jpeg",
//     },
//     {
//       name: "Muhammad Ansar M Choudhari",
//       role: "Frontend + UI/UX Designer",
//       image: "/ansar.jpeg",
//     },
//     {
//       name: "Abhijith Kadakuntla",
//       role: "Documentation/Presentation",
//       image: "/abhijith.jpeg",
//     },
//   ];

//   return (
//     <section className="relative py-20 px-6 bg-slate-950">
//       <div className="pointer-events-none absolute inset-x-10 -top-10 h-40 rounded-3xl bg-gradient-to-r from-blue-500/20 via-emerald-400/20 to-purple-500/20 blur-3xl" />

//       <div className="relative max-w-6xl mx-auto text-center">
//         <h2 className="text-3xl font-bold text-slate-50 mb-4">Meet the Team</h2>
//         <p className="text-sm text-slate-400 mb-10">
//           The people shaping MindMesh into a student‑first learning network.
//         </p>

//         <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
//           {members.map((m) => (
//             <div
//               key={m.name}
//               className="group relative flex flex-col rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg hover:shadow-blue-500/30 hover:border-blue-400/60 transition-all duration-300 hover:-translate-y-2"
//             >
//               {/* Fixed-ratio image at top */}
//               <div className="relative w-full aspect-[4/5] bg-slate-800">
//                 <Image
//                   src={m.image}
//                   alt={m.name}
//                   fill
//                   className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
//                     m.name === "Abhijith Kadakuntla"
//                       ? "[object-position:50%_20%]" // lift framing so eyes/head are visible
//                       : "object-center"
//                   }`}
//                   sizes="(min-width: 1280px) 240px, 50vw"
//                 />
//               </div>

//               {/* Text area */}
//               <div className="relative p-5 text-left">
//                 <h3 className="text-lg font-semibold text-slate-50">{m.name}</h3>
//                 <p className="text-sm text-slate-400 mt-1">{m.role}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

import Image from "next/image";

export default function AboutTeam() {
  const members = [
    {
      name: "Nathaniel Bandi",
      role: "Backend Developer",
      image: "/joel.jpg",
    },
    {
      name: "Nikhil Pujar",
      role: "Frontend Developer",
      image: "/nikhil.jpeg",
    },
    {
      name: "Muhammad Ansar M Choudhari",
      role: "Frontend + UI/UX Designer",
      image: "/ansar.jpeg",
    },
    {
      name: "Abhijith Kadakuntla",
      role: "Documentation/Presentation",
      image: "/abhijithcard.png",
    },
  ];

  return (
    <section className="relative py-20 px-6 bg-slate-950">
      <div className="pointer-events-none absolute inset-x-10 -top-10 h-40 rounded-3xl bg-gradient-to-r from-blue-500/20 via-emerald-400/20 to-purple-500/20 blur-3xl" />

      <div className="relative max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-slate-50 mb-4">Meet the Team</h2>
        <p className="text-sm text-slate-400 mb-10">
          The people shaping MindMesh into a student-first learning network.
        </p>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {members.map((m) => (
            <div
              key={m.name}
              className="group flex flex-col items-center text-center rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-lg hover:shadow-blue-500/30 hover:border-blue-400/60 transition-all duration-300 hover:-translate-y-2"
            >
              {/* Small round profile image */}
              <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden border-2 border-slate-700 group-hover:border-blue-400 transition">
                <Image
                  src={m.image}
                  alt={m.name}
                  fill
                  className={`object-cover ${
                    m.name === "Abhijith Kadakuntla"
                      ? "[object-position:50%_20%]"
                      : "object-center"
                  }`}
                  sizes="96px"
                />
              </div>

              {/* Text */}
              <h3 className="text-lg font-semibold text-slate-50">{m.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{m.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}