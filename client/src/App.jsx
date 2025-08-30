import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Coding from './pages/Coding';
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
import Partner from './pages/Partner';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import Copyright from './pages/Copyright';

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
              {/* All main and public routes use a shared layout with Footer */}
              <Route path="/coding" element={
                <ProtectedRoute>
                  <div className="flex min-h-screen flex-col">
                    <div className="flex flex-1">
                      <Sidebar />
                      <div className="flex-1 flex flex-col">
                        <Navbar />
                        <main className="p-6 flex-1"><Coding /></main>
                      </div>
                    </div>
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/partner" element={<div className="flex flex-col min-h-screen"><Navbar /><main className="p-6 flex-1"><Partner /></main><Footer /></div>} />
              <Route path="/about" element={<div className="flex flex-col min-h-screen"><Navbar /><main className="p-6 flex-1"><About /></main><Footer /></div>} />
              <Route path="/privacy" element={<div className="flex flex-col min-h-screen"><Navbar /><main className="p-6 flex-1"><PrivacyPolicy /></main><Footer /></div>} />
              <Route path="/terms" element={<div className="flex flex-col min-h-screen"><Navbar /><main className="p-6 flex-1"><Terms /></main><Footer /></div>} />
              <Route path="/copyright" element={<div className="flex flex-col min-h-screen"><Navbar /><main className="p-6 flex-1"><Copyright /></main><Footer /></div>} />
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
                  <div className="flex min-h-screen flex-col">
                    <div className="flex flex-1">
                      <Sidebar />
                      <div className="flex-1 flex flex-col">
                        <Navbar />
                        <main className="p-6 flex-1"><Dashboard /></main>
                      </div>
                    </div>
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <div className="flex min-h-screen flex-col">
                    <div className="flex flex-1">
                      <Sidebar />
                      <div className="flex-1 flex flex-col">
                        <Navbar />
                        <main className="p-6 flex-1"><Profile /></main>
                      </div>
                    </div>
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/tests" element={
                <ProtectedRoute>
                  <div className="flex min-h-screen flex-col">
                    <div className="flex flex-1">
                      <Sidebar />
                      <div className="flex-1 flex flex-col">
                        <Navbar />
                        <main className="p-6 flex-1"><Tests /></main>
                      </div>
                    </div>
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/tests/:id" element={
                <ProtectedRoute>
                  <div className="flex min-h-screen flex-col">
                    <div className="flex flex-1">
                      <Sidebar />
                      <div className="flex-1 flex flex-col">
                        <Navbar />
                        <main className="p-6 flex-1"><TestTaking /></main>
                      </div>
                    </div>
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />


              <Route path="/results" element={
                <ProtectedRoute>
                  <div className="flex min-h-screen flex-col">
                    <div className="flex flex-1">
                      <Sidebar />
                      <div className="flex-1 flex flex-col">
                        <Navbar />
                        <main className="p-6 flex-1"><Results /></main>
                      </div>
                    </div>
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/tests/:id/attempts" element={
                <ProtectedRoute>
                  <div className="flex min-h-screen flex-col">
                    <div className="flex flex-1">
                      <Sidebar />
                      <div className="flex-1 flex flex-col">
                        <Navbar />
                        <main className="p-6 flex-1"><TestAttempts /></main>
                      </div>
                    </div>
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/academic" element={
                <ProtectedRoute>
                  <div className="flex min-h-screen flex-col">
                    <div className="flex flex-1">
                      <Sidebar />
                      <div className="flex-1 flex flex-col">
                        <Navbar />
                        <main className="p-6 flex-1"><Academic /></main>
                      </div>
                    </div>
                    <Footer />
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <div className="flex min-h-screen flex-col">
                    <div className="flex flex-1">
                      <Sidebar />
                      <div className="flex-1 flex flex-col">
                        <Navbar />
                        <main className="p-6 flex-1"><Settings /></main>
                      </div>
                    </div>
                    <Footer />
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
