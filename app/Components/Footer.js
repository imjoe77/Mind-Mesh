'use client';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-14 px-6 lg:px-10">

      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">

        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            MindMesh
          </h2>

          <p className="text-gray-600 text-sm">
            A collaborative learning platform for students.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Product</h4>

          <ul className="space-y-2 text-gray-600 text-sm">
            <li>Features</li>
            <li>Pricing</li>
            <li>Security</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Company</h4>

          <ul className="space-y-2 text-gray-600 text-sm">
            <li>About</li>
            <li>Blog</li>
            <li>Careers</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Legal</h4>

          <ul className="space-y-2 text-gray-600 text-sm">
            <li>Privacy</li>
            <li>Terms</li>
            <li>Contact</li>
          </ul>
        </div>

      </div>

      <div className="text-center text-gray-500 text-sm mt-12">
        © 2026 MindMesh. All rights reserved.
      </div>

    </footer>
  );
}