import React from 'react';

const About = () => (
  <div className="max-w-2xl mx-auto p-8 bg-white rounded shadow mt-8">
    <div className="flex flex-col items-center mb-8">
      <img
        src={process.env.PUBLIC_URL + '/founder-img.jpg'}
        alt="Komal Kumar Palwai"
        className="w-48 h-48 rounded-full object-cover border-4 border-blue-200 shadow mb-4"
      />
      <div className="text-center">
        <h2 className="text-xl font-bold text-blue-700">Komal Kumar Palwai</h2>
        <p className="text-gray-600">Founder & Developer, Max Solutions</p>
        <p className="text-gray-700 mt-2">I am passionate about building technology that empowers education and recruitment. With a background in engineering and a drive for innovation, I created Max Solutions to help institutions and companies assess talent efficiently and fairly.</p>
      </div>
    </div>
    <h1 className="text-3xl font-bold mb-4 text-blue-700">About Us</h1>
    <p className="mb-4 text-lg text-gray-700">
      Max Solutions is dedicated to providing the best online assessment platform for colleges and companies. We are passionate about transforming the way organizations and institutions conduct tests, recruit talent, and foster learning.
    </p>
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-blue-600 mb-2">Our Mission</h2>
      <p className="text-gray-700 mb-2">To make testing, recruitment, and learning seamless, secure, and scalable for everyone. We strive to empower educators, students, and companies with innovative tools that drive success and growth.</p>
    </div>
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-blue-600 mb-2">Our Vision</h2>
      <p className="text-gray-700 mb-2">To be the most trusted and advanced online assessment platform, enabling a world where knowledge and skills are measured fairly and efficiently, and opportunities are accessible to all.</p>
    </div>
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-blue-600 mb-2">What We Offer</h2>
      <ul className="list-disc pl-6 text-gray-700">
        <li>Secure, scalable online test hosting for companies and colleges</li>
        <li>Custom question banks and coding challenges</li>
        <li>Real-time analytics and reporting</li>
        <li>Proctoring and anti-cheating features</li>
        <li>Multi-language support for coding tests</li>
        <li>Easy integration and dedicated support</li>
      </ul>
    </div>
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-blue-600 mb-2">Our Values</h2>
      <ul className="list-disc pl-6 text-gray-700">
        <li>Innovation</li>
        <li>Transparency</li>
        <li>Customer Success</li>
        <li>Reliability</li>
        <li>Accessibility</li>
      </ul>
    </div>
    <p className="text-gray-700">Contact us to learn more about our journey, vision, and how we can help you succeed!</p>
  </div>
);

export default About;
