"use client";

import { useState } from "react";

export default function ResultUploader({ onResultAnalyzed }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (limit to 4MB for vision API)
    if (file.size > 4 * 1024 * 1024) {
      setError("File must be under 4MB");
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;

        const res = await fetch("/api/users/analyze-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Image })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          onResultAnalyzed(data.metrics); // Refresh dashboard or show success
        } else {
          setError(data.error || "Failed to analyze result");
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);

    } catch (err) {
      console.error(err);
      setError("Network or parsing error occurred");
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-5 hover:shadow-lg transition">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Upload Result</h3>
            <p className="text-[10px] text-zinc-400">AI automatically extracts your grades</p>
          </div>
        </div>
      </div>

      <div className="mt-3 relative">
        <input
          type="file"
          accept="image/*"
          id="result-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        <label
          htmlFor="result-upload"
          className={`flex items-center justify-center border-2 border-dashed rounded-lg px-4 py-6 text-center transition ${
            isUploading ? "bg-zinc-50 border-zinc-200" : "bg-zinc-50 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/30"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-xs font-semibold text-indigo-600 tracking-wider">AI ANALYZING...</span>
            </div>
          ) : (
            <div>
              <span className="text-sm font-semibold text-indigo-600 block">Click or Drag Image</span>
              <span className="text-[10px] text-zinc-400">PNG, JPG up to 4MB</span>
            </div>
          )}
        </label>
      </div>
      
      {error && <p className="mt-3 text-red-500 text-[10px] font-bold uppercase tracking-wider">{error}</p>}
    </div>
  );
}
