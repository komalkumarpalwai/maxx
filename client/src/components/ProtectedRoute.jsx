import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requireAuth = true, requiredRole }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated and auth is required
  if (requireAuth && !isAuthenticated) {
    // Store the attempted URL to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a requiredRole is specified, check user role
  if (requireAuth && requiredRole) {
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(user?.role)) {
        return <Navigate to="/" replace />;
      }
    } else {
      if (user?.role !== requiredRole) {
        return <Navigate to="/" replace />;
      }
    }
  }

  // Redirect to dashboard if already authenticated and trying to access auth pages
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;



