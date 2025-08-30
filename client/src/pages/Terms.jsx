import React from 'react';

const Terms = () => (
  <div className="max-w-2xl mx-auto p-8 bg-white rounded shadow mt-8">
    <h1 className="text-3xl font-bold mb-4 text-blue-700">Terms & Conditions</h1>
    <p className="mb-4 text-gray-700">By using Max Solutions, you agree to our terms and conditions. Please read them carefully before using our services.</p>
    <ul className="list-disc pl-6 text-gray-700 mb-4">
      <li>Use the platform lawfully and ethically.</li>
      <li>Do not attempt to hack, disrupt, or misuse the service.</li>
      <li>All content and data belong to their respective owners.</li>
      <li>We reserve the right to update these terms at any time.</li>
    </ul>
    <p className="text-gray-700">For questions, contact us at <a href="mailto:komalreddypalwai@gmail.com" className="text-blue-600 underline">komalreddypalwai@gmail.com</a>.</p>
  </div>
);

export default Terms;
