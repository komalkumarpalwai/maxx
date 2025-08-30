
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  return (
    <footer className="w-full bg-gray-50 border-t py-4 mt-8">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 px-4">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 items-center">
          <Link to="/about" className="hover:text-blue-700">About Us</Link>
          <Link to="/privacy" className="hover:text-blue-700">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-blue-700">Terms &amp; Conditions</Link>
          <Link to="/copyright" className="hover:text-blue-700">Copyright &amp; Legal</Link>
          <Link to="/partner" className="font-semibold text-blue-700 hover:underline ml-2">Partner With Us</Link>
          {!isDashboard && (
            <Link to="/" className="ml-4 px-4 py-1.5 bg-blue-600 text-white rounded shadow hover:bg-blue-700 font-semibold transition text-sm">Back to Dashboard</Link>
          )}
        </div>
        <div className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Max Solutions</div>
      </div>
    </footer>
  );
};

export default Footer;
