import React, { useState } from "react";

const tabs = [
  { label: "DSA Course", key: "dsa" },
  { label: "Full Stack Developer", key: "fullstack" },
  { label: "DSA Sheet", key: "sheet" },
];

const ResourceCard = ({ title, desc, cta, onClick }) => (
  <div className="bg-white rounded-lg shadow-sm border p-5 flex flex-col">
    <div className="text-lg font-semibold text-gray-900 mb-1">{title}</div>
    <div className="text-sm text-gray-600 mb-3 flex-1">{desc}</div>
    <button
      className="self-start px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      onClick={onClick}
    >
      {cta}
    </button>
  </div>
);

const Academic = () => {
  const [activeTab, setActiveTab] = useState("dsa");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Academic</h1>
        <p className="text-gray-600">Curated learning paths and resources.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold whitespace-nowrap focus:outline-none border-b-2 transition-colors duration-200 ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "dsa" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <ResourceCard
            title="Structured DSA Syllabus"
            desc="Topic-wise roadmap covering arrays, strings, trees, graphs, DP, and more with difficulty guidance."
            cta="View Syllabus"
            onClick={() => alert("Syllabus: Coming soon!")}
          />
          <ResourceCard
            title="Practice Sets"
            desc="Handpicked problems with increasing difficulty, editorial hints, and expected complexity."
            cta="Try Problems"
            onClick={() => alert("Practice sets: Coming soon!")}
          />
          <ResourceCard
            title="Mock Assessments"
            desc="Timed DSA mock tests to simulate real exam pressure and track improvements."
            cta="Start Mock"
            onClick={() => alert("Mock assessments: Coming soon!")}
          />
        </div>
      )}

      {activeTab === "fullstack" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <ResourceCard
            title="Frontend Track"
            desc="Modern React, state management, routing, testing, and performance best practices."
            cta="Explore Frontend"
            onClick={() => alert("Frontend track: Coming soon!")}
          />
          <ResourceCard
            title="Backend Track"
            desc="Node.js, Express, databases (MongoDB/Postgres), authentication, and production patterns."
            cta="Explore Backend"
            onClick={() => alert("Backend track: Coming soon!")}
          />
          <ResourceCard
            title="DevOps Basics"
            desc="Containers, CI/CD, monitoring, logging, cloud deployment fundamentals to ship confidently."
            cta="Explore DevOps"
            onClick={() => alert("DevOps basics: Coming soon!")}
          />
        </div>
      )}

      {activeTab === "sheet" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <ResourceCard
            title="Must-Do List"
            desc="A condensed sheet of must-solve DSA questions for interviews with categories and tags."
            cta="Open Sheet"
            onClick={() => alert("DSA Sheet: Coming soon!")}
          />
          <ResourceCard
            title="Daily Streak"
            desc="Track your daily progress and keep a streak with reminders and weekly targets."
            cta="Start Streak"
            onClick={() => alert("Daily streak: Coming soon!")}
          />
          <ResourceCard
            title="Solutions & Hints"
            desc="Concise explanations, pitfalls, and alternative approaches for each problem."
            cta="View Hints"
            onClick={() => alert("Solutions: Coming soon!")}
          />
        </div>
      )}

      {/* CTA */}
      <div className="mt-8 p-5 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
        <div>
          <div className="text-md font-semibold text-blue-800">Interested in early access?</div>
          <div className="text-sm text-blue-700">Sign up to be notified when these resources go live.</div>
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={() => alert("Thanks! We will notify you soon.")}
        >
          Notify Me
        </button>
      </div>
    </div>
  );
};

export default Academic;
