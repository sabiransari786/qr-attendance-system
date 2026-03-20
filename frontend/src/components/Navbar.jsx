import { NavLink, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { User } from 'lucide-react';
import { AuthContext } from "../context/AuthContext";
import { logout } from "../services/api";
import { API_BASE_URL } from "../utils/constants";
import "../styles/navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated;
  const user = authContext?.user;
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  useEffect(() => {
    // Check localStorage or default to light theme
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme ? savedTheme === "dark" : false;
    
    setIsDarkMode(isDark);
    applyTheme(isDark);
  }, []);

  // Load profile photo when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadProfilePhoto(user.id);
    } else {
      setProfilePhoto(null);
    }
  }, [isAuthenticated, user?.id]);

  const loadProfilePhoto = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/photo/${userId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setProfilePhoto(url);
      }
    } catch (error) {
      setProfilePhoto(null);
    }
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

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
      // Admin profile - redirect to admin profile page
      navigate("/admin-profile");
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
            style={{
              width: '36px',
              height: '36px',
              minWidth: '36px',
              minHeight: '36px',
              display: 'block',
              visibility: 'visible',
              opacity: 1,
              objectFit: 'cover',
              borderRadius: '8px',
              flexShrink: 0
            }}
          />
          <div className="navbar__brand-text">
            <span className="navbar__brand-title">QR Attendance</span>
            <span className="navbar__brand-subtitle">Tracking System</span>
          </div>
        </Link>

        {/* Mobile Menu Toggle Button */}
        <button 
          className="navbar__mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <nav className={`navbar__nav ${isMobileMenuOpen ? 'navbar__nav--open' : ''}`} aria-label="Main navigation">
          {!isAuthenticated ? (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `navbar__link${isActive ? " navbar__link--active" : ""}`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </NavLink>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `navbar__link${isActive ? " navbar__link--active" : ""}`
                }
                onClick={() => setIsMobileMenuOpen(false)}
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
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign up
              </NavLink>
            </>
          ) : (
            <>
              <button 
                className="navbar__link navbar__profile-link"
                onClick={() => {
                  handleProfileClick();
                  setIsMobileMenuOpen(false);
                }}
              >
                {profilePhoto ? (
                  <img 
                    src={profilePhoto} 
                    alt="Profile" 
                    className="navbar__profile-img"
                  />
                ) : (
                  <span className="navbar__profile-placeholder">
                    {user?.name?.charAt(0)?.toUpperCase() || <User size={16} />}
                  </span>
                )}
                <span>Profile</span>
              </button>
              <button 
                className="navbar__link navbar__link--primary"
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
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
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="navbar__overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </header>
  );
}

export default Navbar;

