"use client";

import { useState } from "react";

export default function CreateGroup() {
  const [groupName, setGroupName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const groupData = {
      groupName,
      subject,
      description,
      members,
      date,
      time,
    };

    console.log("Group Created:", groupData);
  };

  const inputStyle =
    "w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Create Study Group
        </h1>

        <p className="text-gray-500 mb-6">
          Start a focused study session with like-minded students.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              placeholder="DSA Study Squad"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className={inputStyle}
              required
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject / Topic
            </label>
            <input
              type="text"
              placeholder="Data Structures"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputStyle}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Description
            </label>
            <textarea
              rows="3"
              placeholder="Explain what the group will study..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputStyle}
            />
          </div>

          {/* Max Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Members
            </label>
            <input
              type="number"
              placeholder="5"
              value={members}
              onChange={(e) => setMembers(e.target.value)}
              className={inputStyle}
            />
          </div>

          {/* Date + Time Row */}
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Study Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Study Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={inputStyle}
              />
            </div>

          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Create Group
          </button>

        </form>
      </div>
    </div>
  );
}