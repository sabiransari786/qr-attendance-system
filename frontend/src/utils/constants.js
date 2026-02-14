/**
 * Dynamically determine API Base URL based on current host
 * - When accessing from localhost: use localhost:5001
 * - When accessing from network IP (phone/other device): use network IP with port 5001
 */
const getApiBaseUrl = () => {
  // Check if environment variable is set (for production/custom config)
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('🔧 Using VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Get current hostname
  const hostname = window.location.hostname;
  console.log('🌐 Current hostname:', hostname);
  
  // For localhost or 127.0.0.1, use localhost backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const url = 'http://localhost:5001/api';
    console.log('💻 Using localhost API:', url);
    return url;
  }
  
  // For any other IP address (network access from phone/tablet), use same IP with backend port
  const url = `http://${hostname}:5001/api`;
  console.log('📱 Using network API:', url);
  return url;
};

export const API_BASE_URL = getApiBaseUrl();
console.log('✅ API_BASE_URL set to:', API_BASE_URL);

export const ROLE_ROUTES = {
	student: "/student-dashboard",
	faculty: "/faculty-dashboard",
	admin: "/admin-dashboard",
};
