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
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 lg:p-7 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-500 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/20 rounded-full blur-3xl -mr-12 -mt-12" />
      
      <div className="flex items-center justify-between mb-5 relative">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-zinc-800 tracking-tight">Intelligence Extraction</h3>
            <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide mt-0.5">AI-Powered Academic Analysis</p>
          </div>
        </div>
      </div>

      <div className="mt-3 relative">
        <input
          type="file"
          accept="image/*"
          id="result-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        <label
          htmlFor="result-upload"
          className={`relative z-0 h-28 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all duration-300 ${
            isUploading ? "bg-zinc-50 border-zinc-200" : "bg-zinc-50/50 border-zinc-200 group-hover:border-indigo-400 group-hover:bg-white"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-md" />
              <span className="text-[11px] font-semibold text-indigo-600 tracking-wide uppercase">Processing Identity...</span>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm mx-auto mb-2.5 group-hover:scale-110 transition-transform">
                 <span className="text-base">📄</span>
              </div>
              <span className="text-[12px] font-semibold text-zinc-700 block tracking-tight">Drop Academic Transcript</span>
              <span className="text-[11px] text-zinc-400 font-medium tracking-wide mt-0.5 block">PNG / JPG up to 4MB</span>
            </div>
          )}
        </label>
      </div>
      
      {error && (
        <div className="mt-3 flex items-center gap-2 bg-rose-50 border border-rose-100 px-3.5 py-2 rounded-lg">
           <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
           <p className="text-rose-600 text-[11px] font-semibold tracking-tight">{error}</p>
        </div>
      )}
    </div>
  );
}
