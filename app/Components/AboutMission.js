export default function AboutMission() {
  return (
    <section className="bg-white py-20 px-6">

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">

        {/* Mission Text */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Our Mission
          </h2>

          <p className="text-gray-600 mb-4 leading-relaxed">
            Many students struggle with motivation and distractions while studying
            alone. MindMesh solves this by connecting students with compatible
            study partners and creating focused study groups.
          </p>

          <p className="text-gray-600 leading-relaxed">
            Our goal is to transform studying into a collaborative experience
            where students grow, learn, and achieve success together.
          </p>
        </div>

        {/* Features Card */}
        <div className="bg-gray-50 p-8 rounded-xl shadow-md border border-gray-100">

          <h3 className="text-xl font-semibold text-gray-800 mb-5">
            What MindMesh Offers
          </h3>

          <ul className="space-y-3 text-gray-600">
            <li>🚀 Smart study partner matching</li>
            <li>📚 Organized study groups</li>
            <li>⏳ Focused study sessions</li>
            <li>💬 Real-time collaboration</li>
            <li>📊 Productivity tracking</li>
          </ul>

        </div>

      </div>

    </section>
  );
}