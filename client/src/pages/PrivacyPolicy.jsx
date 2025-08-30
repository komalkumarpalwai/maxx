import React from 'react';

const PrivacyPolicy = () => (
  <div className="max-w-2xl mx-auto p-8 bg-white rounded shadow mt-8">
    <h1 className="text-3xl font-bold mb-4 text-blue-700">Privacy Policy</h1>
    <p className="mb-4 text-gray-700">We value your privacy. All user data is securely stored and never shared with third parties except as required by law. We use industry-standard security practices to protect your information.</p>
    <ul className="list-disc pl-6 text-gray-700 mb-4">
      <li>Personal data is only used for authentication and platform features.</li>
      <li>We do not sell or rent your information.</li>
      <li>Cookies are used only for session management and analytics.</li>
    </ul>
    <p className="text-gray-700">For any privacy concerns, contact us at <a href="mailto:komalreddypalwai@gmail.com" className="text-blue-600 underline">komalreddypalwai@gmail.com</a>.</p>
  </div>
);

export default PrivacyPolicy;
