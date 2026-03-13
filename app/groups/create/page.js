"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function CreateGroupPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-slate-900 border border-slate-800 rounded-xl text-center">
        <h2 className="text-xl font-semibold mb-4 text-slate-100">Authentication Required</h2>
        <p className="text-slate-400 mb-6">You must be logged in to create a study group.</p>
        <button
          onClick={() => router.push("/api/auth/signin")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      subject: formData.get("subject"),
      description: formData.get("description"),
      maxMembers: parseInt(formData.get("maxMembers")),
      isPrivate: formData.get("isPrivate") === "on",
      tags: formData.get("tags")
        ? formData.get("tags").split(",").map((t) => t.trim())
        : [],
    };

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed to create group");

      // Redirect to the new group's page
      router.push(`/groups/${result.group._id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Create a Study Group
        </h1>
        <p className="text-slate-400 mt-2">
          Set up a new space for collaborating on a subject. You'll become the host.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 shadow-2xl">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-900/40 border border-red-800 text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-300">
                Group Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Next.js Masters"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium text-slate-300">
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                placeholder="e.g. Web Development"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-slate-300">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              placeholder="What is this group about? Goals, topics, etc."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="tags" className="text-sm font-medium text-slate-300">
                Tags (comma separated)
              </label>
              <input
                id="tags"
                name="tags"
                type="text"
                placeholder="e.g. react, fullstack, homework"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="maxMembers" className="text-sm font-medium text-slate-300">
                Max Members
              </label>
              <input
                id="maxMembers"
                name="maxMembers"
                type="number"
                min="2"
                max="100"
                defaultValue="20"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
            <input
              id="isPrivate"
              name="isPrivate"
              type="checkbox"
              className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
            />
            <label htmlFor="isPrivate" className="text-sm font-medium text-slate-300">
              Make this group private (Hidden from public directory)
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center shadow-[0_0_15px_rgba(79,70,229,0.5)]"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
