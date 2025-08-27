// Security utilities for additional protection

// Prevent right-click context menu on sensitive areas
export const preventContextMenu = (e) => {
  e.preventDefault();
  return false;
};

// Prevent keyboard shortcuts for developer tools
export const preventDevTools = (e) => {
  // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
    (e.ctrlKey && e.key === 'u')
  ) {
    e.preventDefault();
    return false;
  }
};

// Add security headers and prevent common attacks
export const addSecurityHeaders = () => {
  // This would be implemented on the server side
  // For client-side, we can add some basic protections
  if (typeof window !== 'undefined') {
    // Prevent iframe embedding (clickjacking protection)
    if (window.self !== window.top) {
      window.top.location = window.self.location;
    }
  }
};

// Validate and sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Check if user is trying to access from suspicious context
export const checkSuspiciousAccess = () => {
  if (typeof window !== 'undefined') {
    // Check if page is embedded in iframe
    if (window.self !== window.top) {
      return true;
    }
    
    // Check for common developer tool indicators
    const devToolsOpen = window.outerHeight - window.innerHeight > 200;
    if (devToolsOpen) {
      return true;
    }
  }
  return false;
};

// Initialize security measures
export const initializeSecurity = () => {
  if (typeof window !== 'undefined') {
    // Add event listeners for security
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventDevTools);
    
    // Add security headers
    addSecurityHeaders();
    
    // Check for suspicious access
    if (checkSuspiciousAccess()) {
      console.warn('Suspicious access detected');
    }
  }
};



