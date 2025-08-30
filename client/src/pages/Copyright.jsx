import React from 'react';

const Copyright = () => (
  <div className="max-w-2xl mx-auto p-8 bg-white rounded shadow mt-8">
    <h1 className="text-3xl font-bold mb-4 text-blue-700">Copyright & Legal</h1>
    <p className="mb-4 text-gray-700">&copy; {new Date().getFullYear()} Max Solutions. All rights reserved.</p>
    <p className="mb-2 text-gray-700">All content, trademarks, and data on this site are the property of Max Solutions or its licensors. Unauthorized use is strictly prohibited.</p>
    <p className="text-gray-700">For legal inquiries, contact <a href="mailto:komalreddypalwai@gmail.com" className="text-blue-600 underline">komalreddypalwai@gmail.com</a>.</p>
  </div>
);

export default Copyright;
