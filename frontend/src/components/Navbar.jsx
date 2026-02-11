import { NavLink, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { logout } from "../services/api";
import "../styles/navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated;
  const user = authContext?.user;
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check localStorage or default to light theme
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme ? savedTheme === "dark" : false;
    
    setIsDarkMode(isDark);
    applyTheme(isDark);
  }, []);

  const applyTheme = (isDark) => {
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    applyTheme(newTheme);
  };

  const handleProfileClick = () => {
    if (user?.role === "student") {
      navigate("/student-profile");
    } else if (user?.role === "faculty") {
      navigate("/faculty-profile");
    } else if (user?.role === "admin") {
      // Admin profile - can redirect to admin settings or dashboard
      navigate("/admin-dashboard");
    }
  };

  const handleLogout = async () => {
    try {
      const token = authContext?.token;
      if (token) {
        await logout(token);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      authContext?.logout();
      navigate("/login");
    }
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          <img 
            src="/images/logo.jpeg" 
            alt="QR Attendance Logo"
            className="navbar__brand-icon"
          />
          <div className="navbar__brand-text">
            <span className="navbar__brand-title">QR Attendance</span>
            <span className="navbar__brand-subtitle">Tracking System</span>
          </div>
        </Link>

        <nav className="navbar__nav" aria-label="Main navigation">
          {!isAuthenticated ? (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `navbar__link${isActive ? " navbar__link--active" : ""}`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `navbar__link${isActive ? " navbar__link--active" : ""}`
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) =>
                  `navbar__link navbar__link--primary${
                    isActive ? " navbar__link--active-primary" : ""
                  }`
                }
              >
                Sign up
              </NavLink>
            </>
          ) : (
            <>
              <button 
                className="navbar__link"
                onClick={handleProfileClick}
                style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
              >
                👤 Profile
              </button>
              <button 
                className="navbar__link navbar__link--primary"
                onClick={handleLogout}
                style={{ cursor: 'pointer', border: 'none' }}
              >
                Logout
              </button>
            </>
          )}

          <button 
            className="navbar__theme-toggle" 
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <svg className="navbar__theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg className="navbar__theme-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;

