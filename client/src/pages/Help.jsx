import React from 'react';

const Help = () => (
  <div className="max-w-2xl mx-auto py-10 px-4">
    <h1 className="text-3xl font-bold mb-4 text-blue-800">Help & FAQ</h1>
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">How do I update my profile?</h2>
        <p>Go to the Profile page and click <b>Edit Profile</b>. You can update your name, year, branch, and college. You can only update your profile twice for security reasons.</p>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">How do I upload a profile picture?</h2>
        <p>On the Profile page, click the camera icon on your avatar to upload a new profile picture. Only image files under 5MB are allowed.</p>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">How do I take a test?</h2>
        <p>Go to the Dashboard and click <b>Take Test</b> on any active test. Follow the instructions and submit your answers before the time runs out.</p>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">How do I contact support?</h2>
        <p>Use the feedback/contact popup on the Dashboard to send your message. For urgent issues, contact your admin or faculty directly.</p>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">I forgot my password. What should I do?</h2>
        <p>Click <b>Forgot Password</b> on the login page and follow the instructions to reset your password via email.</p>
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Still need help?</h2>
        <p>Email us at <a href="mailto:support@maxxsolutions.com" className="text-blue-600 underline">support@maxxsolutions.com</a> or contact your admin.</p>
      </div>
    </div>
  </div>
);

export default Help;
