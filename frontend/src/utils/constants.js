/**
 * Dynamically determine API Base URL based on current host
 * - When accessing from localhost: use localhost:5000
 * - When accessing from network IP (phone/other device): use network IP with port 5000
 */
const getApiBaseUrl = () => {
  // Check if environment variable is set (for production/custom config)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Get current hostname
  const hostname = window.location.hostname;
  
  // For localhost or 127.0.0.1, use localhost backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const url = 'http://localhost:5001/api';
    return url;
  }
  
  // In production, use the deployed backend unless VITE_API_BASE_URL overrides it.
  // Same-origin `/api` only works when the frontend host explicitly proxies API requests.
  return 'https://qr-attendance-system-sw08.onrender.com/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const ROLE_ROUTES = {
	student: "/student-dashboard",
	faculty: "/faculty-dashboard",
	admin: "/admin-dashboard",
};
