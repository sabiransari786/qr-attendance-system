import { createContext, useState, useEffect, useCallback } from "react";

/**
 * AuthContext
 * Manages authentication state globally across the application
 * Provides user data, token, and authentication status to all components
 */
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth from sessionStorage on mount
  useEffect(() => {
    // Clean up old localStorage tokens (migration from localStorage to sessionStorage)
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    
    const storedToken = sessionStorage.getItem("authToken");
    if (storedToken) {
      setToken(storedToken);
      const storedUser = sessionStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (err) {
          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("user");
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setIsAuthenticated(true);
    setError(null);
    sessionStorage.setItem("authToken", authToken);
    sessionStorage.setItem("user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setError(null);
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("user");
  }, []);

  const setAuthError = useCallback((errorMsg) => {
    setError(errorMsg);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    setAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
