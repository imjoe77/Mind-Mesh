'use client';

export default function CTA() {
  return (
    <section className="relative overflow-hidden py-28 px-6 lg:px-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">

      {/* Background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400 opacity-20 blur-3xl rounded-full"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-400 opacity-20 blur-3xl rounded-full"></div>

      <div className="relative max-w-4xl mx-auto text-center">

        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to learn smarter?
        </h2>

        <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
          <b>
            Join thousands of students collaborating, sharing knowledge,
            and achieving their learning goals together.
          </b>
        </p>

        <div className="flex justify-center gap-4 flex-wrap">

          {/* Primary button */}
          <button
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold
  shadow-lg transition-transform duration-300 ease-in-out
  hover:-translate-y-2 hover:shadow-2xl"
          >
            Get Started Free
          </button>
        </div>

      </div>

    </section>
  );
}