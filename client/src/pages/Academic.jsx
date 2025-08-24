import React, { useState } from "react";

const tabs = [
  { label: "DSA Course", key: "dsa" },
  { label: "Full Stack Developer", key: "fullstack" },
  { label: "DSA Sheet", key: "sheet" },
];

const Academic = () => {
  const [activeTab, setActiveTab] = useState("dsa");

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-6">Academic</h1>
      <div className="flex border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold focus:outline-none border-b-2 transition-colors duration-200 ${
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
      <div className="mt-8 text-center">
        <div className="mb-4 text-lg font-medium">
          {activeTab === "dsa" && "DSA Course Coming Soon!"}
          {activeTab === "fullstack" && "Full Stack Developer Course Coming Soon!"}
          {activeTab === "sheet" && "DSA Sheet Coming Soon!"}
        </div>
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          onClick={() => alert("Thank you for your interest! We'll notify you when it's available.")}
        >
          Click if Interested
        </button>
      </div>
    </div>
  );
};

export default Academic;
