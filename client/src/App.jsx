import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Tests from './pages/Tests';
import TestTaking from './pages/TestTaking';
import Results from './pages/Results';
import TestAttempts from './pages/TestAttempts';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import AdminAnalytics from './pages/AdminAnalytics';
import { initializeSecurity } from './utils/security';
import './index.css';
import Academic from './pages/Academic';
import Settings from './pages/Settings';

function App() {
  useEffect(() => {
    initializeSecurity();
  }, []);

  return (
    <AuthProvider>
      <UserProvider>
        <Router>
          <div className="min-h-screen bg-white">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#ffffff',
                  color: '#000000',
                  border: '1px solid #e5e7eb',
                },
              }}
            />

            <Routes>
              {/* Public routes */}
              <Route path="/login" element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              } />
              <Route path="/register" element={
                <ProtectedRoute requireAuth={false}>
                  <Register />
                </ProtectedRoute>
              } />

              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Navbar />
                      <main className="p-6"><Dashboard /></main>
                    </div>
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Navbar />
                      <main className="p-6"><Profile /></main>
                    </div>
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/tests" element={
                <ProtectedRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Navbar />
                      <main className="p-6"><Tests /></main>
                    </div>
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/tests/:id" element={
                <ProtectedRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Navbar />
                      <main className="p-6"><TestTaking /></main>
                    </div>
                  </div>
                </ProtectedRoute>
              } />


              <Route path="/results" element={
                <ProtectedRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Navbar />
                      <main className="p-6"><Results /></main>
                    </div>
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/tests/:id/attempts" element={
                <ProtectedRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Navbar />
                      <main className="p-6"><TestAttempts /></main>
                    </div>
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/academic" element={
                <ProtectedRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Navbar />
                      <main className="p-6"><Academic /></main>
                    </div>
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Navbar />
                      <main className="p-6"><Settings /></main>
                    </div>
                  </div>
                </ProtectedRoute>
              } />

              {/* Admin routes */}
              <Route path="/admin-login" element={
                <ProtectedRoute requireAuth={false}>
                  <AdminLogin />
                </ProtectedRoute>
              } />


              <Route path="/admin" element={
                <ProtectedRoute requireAuth={true} requiredRole={["admin", "superadmin"]}>
                  <AdminPanel />
                </ProtectedRoute>
              } />

              <Route path="/admin-panel" element={
                <ProtectedRoute requireAuth={true} requiredRole={["admin", "superadmin"]}>
                  <AdminPanel />
                </ProtectedRoute>
              } />

              <Route path="/admin/analytics" element={
                <ProtectedRoute requireAuth={true} requiredRole="admin">
                  <div className="flex">
                    <Sidebar />
                    <div className="flex-1">
                      <Navbar />
                      <main className="p-6"><AdminAnalytics /></main>
                    </div>
                  </div>
                </ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
