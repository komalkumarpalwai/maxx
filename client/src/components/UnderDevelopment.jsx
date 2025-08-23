import React from 'react';

const UnderDevelopment = ({ title }) => (
  <div className="max-w-2xl mx-auto mt-16 p-8 bg-yellow-50 border-l-4 border-yellow-400 rounded shadow text-center">
    <h1 className="text-2xl font-bold mb-4 text-yellow-800">{title}</h1>
    <p className="text-lg text-yellow-700 mb-2">This feature is under development.</p>
    <p className="text-yellow-600">It will be released in a future version. Stay tuned!</p>
  </div>
);

export default UnderDevelopment;
