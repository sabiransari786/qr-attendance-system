import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../utils/constants";
import { DEPARTMENTS } from "../config/dummyData";
import "../styles/profile.css";
import "../styles/dashboard.css";
import "../styles/enhanced-dashboard.css";
import "../styles/enhanced-student-dashboard.css";
import { Eye, Pencil, Trash2, Camera, ChevronUp, ChevronLeft, ChevronRight, ChevronDown, X, Loader, Check, BarChart3, Smartphone, User, ArrowLeft, Mail, Phone, BookOpen, GraduationCap, Hash, Shield, Calendar, ExternalLink } from 'lucide-react';

function StudentProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    studentId: "",
    phone: "",
    department: "",
    semester: ""
  });
  const [editedData, setEditedData] = useState({ ...profileData });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoPosition, setPhotoPosition] = useState({ x: 0, y: 0 });
  const [tempPhoto, setTempPhoto] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPhotoMenu && !event.target.closest('.profile-avatar-container')) {
        setShowPhotoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPhotoMenu]);

  const loadProfilePhoto = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/photo/${userId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPhotoPreview(url);
      }
    } catch (error) {}
  };

  const fetchProfileData = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) { navigate("/login"); return; }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.status === 403 || response.status === 401) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const userData = data.data || data.user;
        const profile = {
          name: userData.name || sessionStorage.getItem("userName") || "",
          email: userData.email || sessionStorage.getItem("userEmail") || "",
          studentId: userData.studentId || userData.student_id || userData.id || sessionStorage.getItem("userId") || "",
          phone: userData.phone || userData.contactNumber || userData.contact_number || "",
          department: userData.department || "",
          semester: userData.semester || ""
        };
        setProfileData(profile);
        setEditedData(profile);
      } else {
        const fallbackProfile = {
          name: sessionStorage.getItem("userName") || "",
          email: sessionStorage.getItem("userEmail") || "",
          studentId: sessionStorage.getItem("userId") || "",
          phone: "", department: "", semester: ""
        };
        setProfileData(fallbackProfile);
        setEditedData(fallbackProfile);
      }
      
      const storedUser = sessionStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.id) loadProfilePhoto(parsedUser.id);
        } catch (error) {}
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => { setEditing(true); setMessage({ type: "", text: "" }); };
  const handleCancel = () => { setEditing(false); setEditedData({ ...profileData }); setMessage({ type: "", text: "" }); };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Invalid file type. Please upload JPEG, PNG, GIF, or WebP." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size exceeds 5MB limit" });
      return;
    }
    setProfilePhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempPhoto(e.target.result);
      setShowPhotoEditor(true);
      setPhotoZoom(1);
      setPhotoPosition({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    setMessage({ type: "success", text: "Adjust your photo and click 'Upload Photo' to save." });
  };

  const handlePhotoClick = () => {
    if (photoPreview) setShowPhotoMenu(!showPhotoMenu);
    else fileInputRef.current?.click();
  };

  const handleViewPhoto = () => { setShowPhotoModal(true); setShowPhotoMenu(false); };
  const handleEditPhoto = () => { setShowPhotoMenu(false); fileInputRef.current?.click(); };
  const handleRemovePhoto = async () => {
    if (window.confirm("Are you sure you want to remove your profile photo?")) {
      setPhotoPreview(null); setShowPhotoMenu(false);
      setMessage({ type: "success", text: "Photo removed. Upload a new one to update." });
    }
  };
  const handleCancelEditor = () => {
    setShowPhotoEditor(false); setTempPhoto(null); setProfilePhoto(null);
    setPhotoZoom(1); setPhotoPosition({ x: 0, y: 0 }); setMessage({ type: "", text: "" });
  };
  const handleApplyAdjustments = () => {
    setPhotoPreview(tempPhoto); setShowPhotoEditor(false);
    setMessage({ type: "success", text: "Photo adjusted. Click 'Upload Photo' to save." });
  };

  const handleUploadPhoto = async () => {
    if (!profilePhoto) { setMessage({ type: "error", text: "Please select a photo first" }); return; }
    setUploading(true); setMessage({ type: "", text: "" });
    try {
      const token = sessionStorage.getItem("authToken");
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/upload-photo`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ photo: e.target.result, mimeType: profilePhoto.type })
          });
          if (response.ok) {
            setMessage({ type: "success", text: "Profile photo uploaded successfully!" });
            setProfilePhoto(null);
            const storedUser = sessionStorage.getItem("user");
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.id) setTimeout(() => loadProfilePhoto(parsedUser.id), 500);
              } catch (error) {}
            }
          } else {
            const errorData = await response.json();
            setMessage({ type: "error", text: errorData.message || "Failed to upload photo" });
          }
        } catch (error) {
          setMessage({ type: "error", text: "Failed to upload photo. Please try again." });
        } finally { setUploading(false); }
      };
      reader.onerror = () => { setMessage({ type: "error", text: "Failed to read file" }); setUploading(false); };
      reader.readAsDataURL(profilePhoto);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to upload photo. Please try again." });
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(editedData)
      });
      const data = await response.json();

      if (response.status === 403 || response.status === 401) {
        setMessage({ type: "error", text: data.message || "Session expired. Please login again." });
        setTimeout(() => { localStorage.clear(); navigate("/login"); }, 2000);
        return;
      }

      if (response.ok) {
        const updatedUser = data.data || data.user;
        const updatedProfile = {
          name: updatedUser.name || editedData.name,
          email: updatedUser.email || editedData.email,
          studentId: updatedUser.studentId || updatedUser.student_id || updatedUser.id || editedData.studentId,
          phone: updatedUser.phone || updatedUser.contactNumber || updatedUser.contact_number || editedData.phone,
          department: updatedUser.department || editedData.department,
          semester: updatedUser.semester || editedData.semester
        };
        setProfileData(updatedProfile);
        setEditedData(updatedProfile);
        setEditing(false);
        setMessage({ type: "success", text: "Profile updated successfully!" });
        sessionStorage.setItem("userName", updatedProfile.name);
        sessionStorage.setItem("userEmail", updatedProfile.email);
        setTimeout(() => { fetchProfileData(); setMessage({ type: "", text: "" }); }, 2000);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update profile" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update profile. Please try again." });
    }
  };

  const PROFILE_FIELDS = [
    { key: 'name', label: 'Full Name', icon: <User size={16} />, editable: true, type: 'text', placeholder: 'Enter your full name' },
    { key: 'studentId', label: 'Student ID', icon: <Hash size={16} />, editable: false },
    { key: 'email', label: 'Email Address', icon: <Mail size={16} />, editable: true, type: 'email', placeholder: 'your.email@example.com' },
    { key: 'phone', label: 'Phone Number', icon: <Phone size={16} />, editable: true, type: 'tel', placeholder: '+91 98765 43210' },
    { key: 'department', label: 'Department', icon: <BookOpen size={16} />, editable: true, type: 'select', options: DEPARTMENTS },
    { key: 'semester', label: 'Semester', icon: <GraduationCap size={16} />, editable: true, type: 'select', options: ['1st', '2nd', '3rd', '4th', '5th', '6th'] },
  ];

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="dashboard__objects" aria-hidden="true">
        <span className="dashboard__object dashboard__object--sphere" />
        <span className="dashboard__object dashboard__object--torus" />
        <span className="dashboard__object dashboard__object--diamond" />
      </div>

      {/* Header */}
      <motion.header
        className="dashboard__header enhanced-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="header-content">
          <div className="header-text">
            <h1 className="dashboard__title slide-in-down">
              <User size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px' }} />
              My Profile
            </h1>
            <p className="dashboard__subtitle fade-in">Manage your personal information and preferences</p>
          </div>
          <div className="button-group">
            <motion.button
              className="btn-hover-lift dashboard__button dashboard__button--secondary"
              onClick={() => navigate("/student-dashboard")}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              <ArrowLeft size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Dashboard
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="dashboard__content" style={{ maxWidth: 880, margin: '0 auto' }}>
        {/* Toast Message */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              style={{
                marginBottom: '1.5rem',
                padding: '0.85rem 1.2rem',
                borderRadius: '14px',
                background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(49,156,181,0.1)',
                border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(49,156,181,0.25)'}`,
                color: message.type === 'error' ? '#ef4444' : '#319cb5',
                fontSize: '0.9rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {message.type === 'error' ? <X size={16} /> : <Check size={16} />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Hero Card */}
        <motion.section
          className="dashboard__card premium-content-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          style={{ overflow: 'visible' }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid rgba(49,156,181,0.1)',
            flexWrap: 'wrap',
          }}>
            {/* Avatar */}
            <div className="profile-avatar-container" style={{ position: 'relative' }}>
              <motion.div
                className="profile-avatar"
                onClick={handlePhotoClick}
                style={{
                  cursor: 'pointer',
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #319cb5, #2488a8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.4rem',
                  fontWeight: 700,
                  color: '#fff',
                  boxShadow: '0 8px 28px rgba(49,156,181,0.3)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                title={photoPreview ? "Click to view/edit photo" : "Click to upload photo"}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt={profileData.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <span>{profileData.name.charAt(0).toUpperCase()}</span>
                )}
              </motion.div>
              <input type="file" ref={fileInputRef} onChange={handlePhotoSelect} accept="image/*" style={{ display: 'none' }} />

              {/* Photo Menu */}
              <AnimatePresence>
                {showPhotoMenu && photoPreview && (
                  <motion.div
                    className="photo-menu"
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    style={{ top: 108, left: '50%', transform: 'translateX(-50%)' }}
                  >
                    <button className="photo-menu-item" onClick={handleViewPhoto}><Eye size={14} /> View Photo</button>
                    <button className="photo-menu-item" onClick={handleEditPhoto}><Pencil size={14} /> Change Photo</button>
                    <button className="photo-menu-item photo-menu-item--danger" onClick={handleRemovePhoto}><Trash2 size={14} /> Remove</button>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                onClick={() => fileInputRef.current?.click()}
                title="Upload photo"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #319cb5, #2980a8)',
                  border: '3px solid var(--color-bg, #0b1f2e)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(49,156,181,0.4)',
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                <Camera size={15} />
              </motion.button>
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <h2 style={{ margin: '0 0 0.3rem', fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.3px' }}>
                {profileData.name || 'Student'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                {profileData.email}
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                {profileData.department && (
                  <span className="premium-badge">{profileData.department}</span>
                )}
                <span className="premium-badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', borderColor: 'rgba(16,185,129,0.2)' }}>
                  <Shield size={12} /> Active
                </span>
              </div>
            </div>

            {/* Edit Toggle */}
            <div>
              {!editing ? (
                <motion.button
                  onClick={handleEdit}
                  className="btn-hover-lift"
                  style={{
                    padding: '0.7rem 1.4rem',
                    borderRadius: '12px',
                    border: '1.5px solid rgba(49,156,181,0.4)',
                    background: 'rgba(49,156,181,0.15)',
                    color: '#319cb5',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backdropFilter: 'blur(12px)',
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Pencil size={15} /> Edit Profile
                </motion.button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <motion.button
                    onClick={handleSave}
                    style={{
                      padding: '0.7rem 1.2rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #319cb5, #2980a8)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 6px 20px rgba(49,156,181,0.3)',
                    }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <Check size={15} /> Save
                  </motion.button>
                  <motion.button
                    onClick={handleCancel}
                    style={{
                      padding: '0.7rem 1.2rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'rgba(239,68,68,0.08)',
                      color: '#ef4444',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                    }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* Photo Upload Ready */}
          <AnimatePresence>
            {profilePhoto && !showPhotoEditor && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  marginTop: '1rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  background: 'rgba(49,156,181,0.08)',
                  border: '1px solid rgba(49,156,181,0.18)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  overflow: 'hidden',
                }}
              >
                <span style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                  Ready to upload: <strong>{profilePhoto.name}</strong>
                </span>
                <motion.button
                  onClick={handleUploadPhoto}
                  disabled={uploading}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #319cb5, #2980a8)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 4px 12px rgba(49,156,181,0.25)',
                    flexShrink: 0,
                  }}
                  whileHover={!uploading ? { scale: 1.04 } : {}}
                  whileTap={!uploading ? { scale: 0.96 } : {}}
                >
                  {uploading ? <><Loader size={13} /> Uploading...</> : <><Check size={13} /> Upload Photo</>}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Fields */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.2rem',
            marginTop: '1.5rem',
          }}>
            {PROFILE_FIELDS.map((field, idx) => (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.04, duration: 0.35 }}
                style={{
                  padding: '1rem 1.1rem',
                  borderRadius: '14px',
                  background: editing && field.editable ? 'rgba(49,156,181,0.04)' : 'rgba(49,156,181,0.03)',
                  border: `1px solid ${editing && field.editable ? 'rgba(49,156,181,0.18)' : 'rgba(49,156,181,0.08)'}`,
                  transition: 'all 0.25s ease',
                }}
              >
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#319cb5',
                  marginBottom: '0.55rem',
                }}>
                  {field.icon} {field.label}
                </label>
                {editing && field.editable ? (
                  field.type === 'select' ? (
                    <select
                      name={field.key}
                      value={editedData[field.key]}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.8rem',
                        borderRadius: '10px',
                        border: '1.5px solid rgba(49,156,181,0.25)',
                        background: 'rgba(49,156,181,0.05)',
                        color: 'var(--color-text)',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        outline: 'none',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      {field.key === 'department' && <option value="">Select department</option>}
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      name={field.key}
                      value={editedData[field.key]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.8rem',
                        borderRadius: '10px',
                        border: '1.5px solid rgba(49,156,181,0.25)',
                        background: 'rgba(49,156,181,0.05)',
                        color: 'var(--color-text)',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                      }}
                    />
                  )
                ) : (
                  <p style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 550,
                    color: profileData[field.key] ? 'var(--color-text)' : 'var(--color-text-secondary)',
                    fontStyle: profileData[field.key] ? 'normal' : 'italic',
                    opacity: profileData[field.key] ? 1 : 0.6,
                  }}>
                    {profileData[field.key] || 'Not provided'}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Quick Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.2rem', marginTop: '1.5rem' }}>
          <motion.section
            className="dashboard__card premium-content-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="card-title-header">
              <h2 className="dashboard__card-title" style={{ fontSize: '1.05rem' }}>
                <Shield size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Account Details
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {[
                { label: 'Role', value: 'Student' },
                { label: 'Status', value: 'Active', isStatus: true },
                { label: 'Member Since', value: 'January 2024' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 0',
                  borderBottom: i < 2 ? '1px solid rgba(49,156,181,0.08)' : 'none',
                }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{item.label}</span>
                  {item.isStatus ? (
                    <span style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '20px',
                      background: 'rgba(16,185,129,0.12)',
                      color: '#10b981',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: '1px solid rgba(16,185,129,0.2)',
                    }}>
                      Active
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-text)' }}>{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            className="dashboard__card premium-content-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="card-title-header">
              <h2 className="dashboard__card-title" style={{ fontSize: '1.05rem' }}>
                <ExternalLink size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Quick Actions
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
              {[
                { icon: <BarChart3 size={16} />, label: 'View Attendance History', route: '/attendance-history' },
                { icon: <Smartphone size={16} />, label: 'Scan QR Code', route: '/scan-qr' },
                { icon: <Calendar size={16} />, label: 'Generate Attendance Request', route: '/generate-request' },
              ].map((link, i) => (
                <motion.button
                  key={i}
                  onClick={() => navigate(link.route)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(49,156,181,0.12)',
                    background: 'rgba(49,156,181,0.04)',
                    color: 'var(--color-text)',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                  }}
                  whileHover={{
                    x: 4,
                    background: 'rgba(49,156,181,0.08)',
                    borderColor: 'rgba(49,156,181,0.25)',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span style={{ color: '#319cb5', flexShrink: 0 }}>{link.icon}</span>
                  {link.label}
                  <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--color-text-secondary)', opacity: 0.5 }} />
                </motion.button>
              ))}
            </div>
          </motion.section>
        </div>
      </main>

      {/* Photo Editor Modal */}
      {showPhotoEditor && tempPhoto && (
        <div className="photo-editor-modal" onClick={() => setShowPhotoEditor(false)}>
          <div className="photo-editor-content" onClick={(e) => e.stopPropagation()}>
            <div className="photo-editor-header">
              <h3>Adjust Your Photo</h3>
              <button className="close-btn" onClick={handleCancelEditor}><X size={14} /></button>
            </div>
            <div className="photo-editor-preview">
              <div className="photo-editor-canvas">
                <img src={tempPhoto} alt="Preview" style={{ transform: `scale(${photoZoom}) translate(${photoPosition.x}px, ${photoPosition.y}px)`, transition: 'transform 0.1s ease' }} />
              </div>
            </div>
            <div className="photo-editor-controls">
              <div className="control-group">
                <label>Zoom: {photoZoom.toFixed(1)}x</label>
                <input type="range" min="0.5" max="3" step="0.1" value={photoZoom} onChange={(e) => setPhotoZoom(parseFloat(e.target.value))} className="zoom-slider" />
              </div>
              <div className="control-group">
                <label>Position</label>
                <div className="position-controls">
                  <button onClick={() => setPhotoPosition(p => ({ ...p, y: p.y - 10 }))}><ChevronUp size={18} /></button>
                  <div>
                    <button onClick={() => setPhotoPosition(p => ({ ...p, x: p.x - 10 }))}><ChevronLeft size={18} /></button>
                    <button onClick={() => setPhotoPosition({ x: 0, y: 0 })}>Reset</button>
                    <button onClick={() => setPhotoPosition(p => ({ ...p, x: p.x + 10 }))}><ChevronRight size={18} /></button>
                  </div>
                  <button onClick={() => setPhotoPosition(p => ({ ...p, y: p.y + 10 }))}><ChevronDown size={18} /></button>
                </div>
              </div>
            </div>
            <div className="photo-editor-actions">
              <button className="action-btn action-btn--secondary" onClick={handleCancelEditor}>Cancel</button>
              <button className="action-btn action-btn--primary" onClick={handleApplyAdjustments}>Apply & Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Photo View Modal */}
      {showPhotoModal && photoPreview && (
        <div className="photo-view-modal" onClick={() => setShowPhotoModal(false)}>
          <div className="photo-view-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowPhotoModal(false)}><X size={14} /></button>
            <img src={photoPreview} alt={profileData.name} />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default StudentProfile;
