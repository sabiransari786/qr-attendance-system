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

  // Check if a token is a real JWT (3 parts separated by dots)
  const isRealJWT = (t) => {
    if (!t || typeof t !== "string") return false;
    return t.split(".").length === 3 && !t.startsWith("mock_token_");
  };

  // Initialize auth from sessionStorage on mount
  useEffect(() => {
    // Clean up old localStorage tokens
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    // Also clean old localStorage keys used in older versions
    localStorage.removeItem("token");

    const storedToken = sessionStorage.getItem("authToken");

    // If token is a mock token (not a real JWT), clear it and force re-login
    if (storedToken && !isRealJWT(storedToken)) {
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");
      setIsLoading(false);
      return;
    }

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

  // Update user data (e.g., after profile edit)
  const updateUser = useCallback((updatedData) => {
    setUser((prevUser) => {
      const newUser = { ...prevUser, ...updatedData };
      sessionStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    });
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
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
