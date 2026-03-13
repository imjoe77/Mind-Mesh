export default function AboutTeam() {
  return (
    <section className="bg-gray-50 py-20 px-6">

      <div className="max-w-6xl mx-auto text-center">

        <h2 className="text-3xl font-bold text-gray-800 mb-12">
          Meet The Team
        </h2>

        <div className="grid md:grid-cols-3 gap-10">

          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="w-20 h-20 bg-blue-200 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800">
              Muhammad Ansar
            </h3>
            <p className="text-gray-500">Frontend Developer</p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="w-20 h-20 bg-indigo-200 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800">
              Team Member
            </h3>
            <p className="text-gray-500">Backend Developer</p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="w-20 h-20 bg-purple-200 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800">
              Team Member
            </h3>
            <p className="text-gray-500">Full Stack Developer</p>
          </div>

        </div>

      </div>

    </section>
  );
}