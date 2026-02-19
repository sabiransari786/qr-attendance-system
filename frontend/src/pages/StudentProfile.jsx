import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../utils/constants";
import "../styles/profile.css";
import {
  fadeInUp,
  fadeInDown,
  staggerContainer,
  buttonHover,
  buttonTap,
  cardHover,
  scaleIn,
} from "../animations/animationConfig";

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
    semester: "",
    section: ""
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

  // Close photo menu when clicking outside
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
    } catch (error) {
      console.log("No profile photo found");
    }
  };

  const fetchProfileData = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      // Handle token expiry or unauthorized
      if (response.status === 403 || response.status === 401) {
        const data = await response.json();
        console.error("Authentication error:", data.message);
        
        // Clear localStorage and redirect to login
        localStorage.clear();
        navigate("/login");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const userData = data.data || data.user;
        
        // Get data from API or fallback to sessionStorage
        const profile = {
          name: userData.name || sessionStorage.getItem("userName") || "",
          email: userData.email || sessionStorage.getItem("userEmail") || "",
          studentId: userData.studentId || userData.student_id || userData.id || sessionStorage.getItem("userId") || "",
          phone: userData.phone || userData.contactNumber || userData.contact_number || "",
          department: userData.department || "",
          semester: userData.semester || "",
          section: userData.section || ""
        };
        setProfileData(profile);
        setEditedData(profile);
      } else {
        // Use fallback data from sessionStorage
        const fallbackProfile = {
          name: sessionStorage.getItem("userName") || "",
          email: sessionStorage.getItem("userEmail") || "",
          studentId: sessionStorage.getItem("userId") || "",
          phone: "",
          department: "",
          semester: "",
          section: ""
        };
        setProfileData(fallbackProfile);
        setEditedData(fallbackProfile);
      }
      
      // Load profile photo if userId available
      const storedUser = sessionStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const userId = parsedUser.id;
          if (userId) {
            loadProfilePhoto(userId);
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = () => {
    setEditing(true);
    setMessage({ type: "", text: "" });
  };

  const handleCancel = () => {
    setEditing(false);
    setEditedData({ ...profileData });
    setMessage({ type: "", text: "" });
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Invalid file type. Please upload JPEG, PNG, GIF, or WebP." });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "File size exceeds 5MB limit" });
      return;
    }

    setProfilePhoto(file);
    
    // Show preview
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
    if (photoPreview) {
      setShowPhotoMenu(!showPhotoMenu);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleViewPhoto = () => {
    setShowPhotoModal(true);
    setShowPhotoMenu(false);
  };

  const handleEditPhoto = () => {
    setShowPhotoMenu(false);
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = async () => {
    if (window.confirm("Are you sure you want to remove your profile photo?")) {
      setPhotoPreview(null);
      setShowPhotoMenu(false);
      setMessage({ type: "success", text: "Photo removed. Upload a new one to update." });
    }
  };

  const handleCancelEditor = () => {
    setShowPhotoEditor(false);
    setTempPhoto(null);
    setProfilePhoto(null);
    setPhotoZoom(1);
    setPhotoPosition({ x: 0, y: 0 });
    setMessage({ type: "", text: "" });
  };

  const handleApplyAdjustments = () => {
    setPhotoPreview(tempPhoto);
    setShowPhotoEditor(false);
    setMessage({ type: "success", text: "Photo adjusted. Click 'Upload Photo' to save." });
  };

  const handleUploadPhoto = async () => {
    if (!profilePhoto) {
      setMessage({ type: "error", text: "Please select a photo first" });
      return;
    }

    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = sessionStorage.getItem("authToken");
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Photo = e.target.result;
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/upload-photo`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              photo: base64Photo,
              mimeType: profilePhoto.type
            })
          });

          if (response.ok) {
            const data = await response.json();
            setMessage({ type: "success", text: "Profile photo uploaded successfully!" });
            setProfilePhoto(null);
            
            // Reload preview after upload
            const storedUser = sessionStorage.getItem("user");
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                const userId = parsedUser.id;
                if (userId) {
                  setTimeout(() => {
                    loadProfilePhoto(userId);
                  }, 500);
                }
              } catch (error) {
                console.error("Error parsing user data:", error);
              }
            }
          } else {
            const errorData = await response.json();
            console.error('Upload error:', errorData);
            setMessage({ type: "error", text: errorData.message || "Failed to upload photo" });
          }
        } catch (error) {
          console.error("Error uploading photo:", error);
          setMessage({ type: "error", text: "Failed to upload photo. Please try again." });
        } finally {
          setUploading(false);
        }
      };
      
      reader.onerror = () => {
        setMessage({ type: "error", text: "Failed to read file" });
        setUploading(false);
      };
      
      reader.readAsDataURL(profilePhoto);
    } catch (error) {
      console.error("Error uploading photo:", error);
      setMessage({ type: "error", text: "Failed to upload photo. Please try again." });
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      
      console.log('📝 Saving profile...');
      console.log('Data being sent:', editedData);
      
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editedData)
      });

      const data = await response.json();
      
      console.log('📨 Server response:', data);

      // Handle token expiry
      if (response.status === 403 || response.status === 401) {
        setMessage({ 
          type: "error", 
          text: data.message || "Session expired. Please login again." 
        });
        
        // Clear localStorage and redirect to login after 2 seconds
        setTimeout(() => {
          localStorage.clear();
          navigate("/login");
        }, 2000);
        return;
      }

      if (response.ok) {
        // Use the updated data from server response
        const updatedUser = data.data || data.user;
        console.log('✅ Update successful! Server returned:', updatedUser);
        
        const updatedProfile = {
          name: updatedUser.name || editedData.name,
          email: updatedUser.email || editedData.email,
          studentId: updatedUser.studentId || updatedUser.student_id || updatedUser.id || editedData.studentId,
          phone: updatedUser.phone || updatedUser.contactNumber || updatedUser.contact_number || editedData.phone,
          department: updatedUser.department || editedData.department,
          semester: updatedUser.semester || editedData.semester,
          section: updatedUser.section || editedData.section
        };
        
        console.log('💾 Setting profile data to:', updatedProfile);
        
        setProfileData(updatedProfile);
        setEditedData(updatedProfile);
        setEditing(false);
        setMessage({ type: "success", text: "Profile updated successfully!" });
        
        // Update sessionStorage with latest data
        sessionStorage.setItem("userName", updatedProfile.name);
        sessionStorage.setItem("userEmail", updatedProfile.email);
        
        // Refresh profile data from server to ensure consistency
        setTimeout(() => {
          fetchProfileData();
          setMessage({ type: "", text: "" });
        }, 2000);
      } else {
        setMessage({ 
          type: "error", 
          text: data.message || "Failed to update profile" 
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Failed to update profile. Please try again." });
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <motion.div
      className="profile-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="profile__objects" aria-hidden="true">
        <span className="profile__object profile__object--sphere" />
        <span className="profile__object profile__object--ring" />
        <span className="profile__object profile__object--cube" />
      </div>
      <motion.header
        className="dashboard__header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h1 className="dashboard__title">
            Student Profile
          </h1>
          <p className="dashboard__subtitle">
            View and edit your profile information
          </p>
        </div>
        <motion.button
          className="dashboard__button dashboard__button--secondary"
          onClick={() => navigate("/student-dashboard")}
          variants={buttonHover}
          whileHover="hover"
          whileTap={buttonTap}
        >
          ← Back to Dashboard
        </motion.button>
      </motion.header>

      <motion.main
        className="profile-card"
        style={{ position: "relative", zIndex: 1 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        {/* Message Display */}
        {message.text && (
          <motion.div
            className={`message-box ${message.type}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            {message.text}
          </motion.div>
        )}

        {/* Profile Card */}
        <motion.section
          className="profile-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          whileHover={{ y: -8, boxShadow: '0 20px 56px rgba(49, 156, 181, 0.2)', transition: { type: 'spring', stiffness: 260, damping: 24 } }}
        >
          <motion.div className="profile-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.4 }}>
            <motion.div className="profile-avatar-container" variants={scaleIn}>
              <motion.div
                className="profile-avatar"
                onClick={handlePhotoClick}
                style={{ cursor: "pointer" }}
                title={photoPreview ? "Click to view/edit photo" : "Click to upload photo"}
                whileHover={{ scale: 1.08, transition: { type: 'spring', stiffness: 380, damping: 20 } }}
                whileTap={{ scale: 0.94 }}
              >
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt={profileData.name}
                    className="profile-avatar-image"
                  />
                ) : (
                  <span className="avatar-text">
                    {profileData.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </motion.div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/*"
                style={{ display: "none" }}
              />
              
              {/* Photo Menu */}
              {showPhotoMenu && photoPreview && (
                <motion.div
                  className="photo-menu"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                >
                  <motion.button
                    className="photo-menu-item"
                    onClick={handleViewPhoto}
                    whileHover={{ scale: 1.06, x: 4, transition: { type: 'spring', stiffness: 380, damping: 20 } }}
                    whileTap={{ scale: 0.95 }}
                  >
                    👁️ View Photo
                  </motion.button>
                  <motion.button
                    className="photo-menu-item"
                    onClick={handleEditPhoto}
                    whileHover={{ scale: 1.06, x: 4, transition: { type: 'spring', stiffness: 380, damping: 20 } }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✏️ Change Photo
                  </motion.button>
                  <motion.button
                    className="photo-menu-item photo-menu-item--danger"
                    onClick={handleRemovePhoto}
                    whileHover={{ scale: 1.06, x: 4, transition: { type: 'spring', stiffness: 380, damping: 20 } }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🗑️ Remove Photo
                  </motion.button>
                </motion.div>
              )}

              <motion.button
                className="photo-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Upload profile photo"
              whileHover={{ scale: 1.15, transition: { type: 'spring', stiffness: 400, damping: 18 } }}
              whileTap={{ scale: 0.88 }}
              >
                📷
              </motion.button>
            </motion.div>
            <motion.div className="profile-title" variants={fadeInUp}>
              <motion.h2 variants={fadeInUp}>{profileData.name}</motion.h2>
              <motion.p variants={fadeInUp}>{profileData.email}</motion.p>
            </motion.div>
          </motion.div>

          {/* Photo Editor Modal */}
          {showPhotoEditor && tempPhoto && (
            <div className="photo-editor-modal" onClick={() => setShowPhotoEditor(false)}>
              <div className="photo-editor-content" onClick={(e) => e.stopPropagation()}>
                <div className="photo-editor-header">
                  <h3>Adjust Your Photo</h3>
                  <button className="close-btn" onClick={handleCancelEditor}>✕</button>
                </div>
                
                <div className="photo-editor-preview">
                  <div className="photo-editor-canvas">
                    <img 
                      src={tempPhoto}
                      alt="Photo preview"
                      style={{
                        transform: `scale(${photoZoom}) translate(${photoPosition.x}px, ${photoPosition.y}px)`,
                        transition: 'transform 0.1s ease'
                      }}
                    />
                  </div>
                </div>
                
                <div className="photo-editor-controls">
                  <div className="control-group">
                    <label>Zoom: {photoZoom.toFixed(1)}x</label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="3" 
                      step="0.1" 
                      value={photoZoom}
                      onChange={(e) => setPhotoZoom(parseFloat(e.target.value))}
                      className="zoom-slider"
                    />
                  </div>
                  
                  <div className="control-group">
                    <label>Position</label>
                    <div className="position-controls">
                      <button onClick={() => setPhotoPosition(p => ({ ...p, y: p.y - 10 }))}>⬆️</button>
                      <div>
                        <button onClick={() => setPhotoPosition(p => ({ ...p, x: p.x - 10 }))}>⬅️</button>
                        <button onClick={() => setPhotoPosition({ x: 0, y: 0 })}>⭕</button>
                        <button onClick={() => setPhotoPosition(p => ({ ...p, x: p.x + 10 }))}>➡️</button>
                      </div>
                      <button onClick={() => setPhotoPosition(p => ({ ...p, y: p.y + 10 }))}>⬇️</button>
                    </div>
                  </div>
                </div>
                
                <div className="photo-editor-actions">
                  <button className="action-btn action-btn--secondary" onClick={handleCancelEditor}>
                    Cancel
                  </button>
                  <button className="action-btn action-btn--primary" onClick={handleApplyAdjustments}>
                    Apply & Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Photo View Modal */}
          {showPhotoModal && photoPreview && (
            <div className="photo-view-modal" onClick={() => setShowPhotoModal(false)}>
              <div className="photo-view-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={() => setShowPhotoModal(false)}>✕</button>
                <img src={photoPreview} alt={profileData.name} />
              </div>
            </div>
          )}

          {/* Photo Upload Section */}
          {profilePhoto && !showPhotoEditor && (
            <motion.div
              className="photo-upload-section"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.p className="photo-upload-hint" variants={fadeInUp}>
                Photo adjusted. Ready to upload: {profilePhoto.name}
              </motion.p>
              <motion.button
                className="action-btn action-btn--primary"
                onClick={handleUploadPhoto}
                disabled={uploading}
                whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(49, 156, 181, 0.3)', transition: { type: 'spring', stiffness: 350, damping: 20 } }}
                whileTap={{ scale: 0.95 }}
              >
                {uploading ? "⏳ Uploading..." : "✓ Upload Photo"}
              </motion.button>
            </motion.div>
          )}

          <motion.div className="profile-body" variants={fadeInUp} initial="hidden" animate="visible">
            <motion.div className="form-grid" variants={staggerContainer} initial="hidden" animate="visible">
              <motion.div className="form-group" variants={fadeInUp}>
                <motion.label className="form-label" variants={fadeInUp}>
                  Full Name
                </motion.label>
                {editing ? (
                  <motion.input
                    type="text"
                    name="name"
                    className="form-input"
                    value={editedData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    whileFocus={{ boxShadow: "0 0 0 3px rgba(49, 156, 181, 0.3)", transition: { duration: 0.2 } }}
                  />
                ) : (
                  <motion.p className="form-value" variants={fadeInUp}>
                    {profileData.name || "Not provided"}
                  </motion.p>
                )}
              </motion.div>

              <div className="form-group">
                <label className="form-label">Student ID</label>
                <p className="form-value">{profileData.studentId}</p>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                {editing ? (
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    value={editedData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                  />
                ) : (
                  <p className="form-value">{profileData.email || "Not provided"}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    className="form-input"
                    value={editedData.phone}
                    onChange={handleInputChange}
                    placeholder="123-456-7890"
                  />
                ) : (
                  <p className="form-value">{profileData.phone || "Not provided"}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                {editing ? (
                  <select
                    name="department"
                    className="form-input"
                    value={editedData.department}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Select Department --</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                ) : (
                  <p className="form-value">{profileData.department || "Not specified"}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Semester</label>
                {editing ? (
                  <select
                    name="semester"
                    className="form-input"
                    value={editedData.semester}
                    onChange={handleInputChange}
                  >
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="3rd">3rd</option>
                    <option value="4th">4th</option>
                    <option value="5th">5th</option>
                    <option value="6th">6th</option>
                    <option value="7th">7th</option>
                    <option value="8th">8th</option>
                  </select>
                ) : (
                  <p className="form-value">{profileData.semester}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Section</label>
                {editing ? (
                  <input
                    type="text"
                    name="section"
                    className="form-input"
                    value={editedData.section}
                    onChange={handleInputChange}
                    maxLength={2}
                    placeholder="A, B, C, etc."
                  />
                ) : (
                  <p className="form-value">{profileData.section || "Not specified"}</p>
                )}
              </div>
            </motion.div>

            <motion.div className="profile-actions" variants={fadeInUp} initial="hidden" animate="visible">
              {editing ? (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                  <motion.button
                    className="action-btn action-btn--success"
                    onClick={handleSave}
                    variants={buttonHover}
                    whileHover="hover"
                    whileTap={buttonTap}
                  >
                    ✓ Save Changes
                  </motion.button>
                  <motion.button
                    className="action-btn action-btn--secondary"
                    onClick={handleCancel}
                    variants={buttonHover}
                    whileHover="hover"
                    whileTap={buttonTap}
                  >
                    Cancel
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  className="action-btn action-btn--primary"
                  onClick={handleEdit}
                  variants={buttonHover}
                  whileHover="hover"
                  whileTap={buttonTap}
                >
                  ✏️ Edit Profile
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Additional Info */}
        <motion.section className="info-cards" variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div className="info-card" variants={fadeInUp} whileHover={{ y: -6, scale: 1.01, boxShadow: '0 16px 40px rgba(49, 156, 181, 0.2)', transition: { type: 'spring', stiffness: 280, damping: 24 } }}>
            <motion.h3 className="info-title" variants={fadeInUp}>
              Account Information
            </motion.h3>
            <motion.div className="info-item" variants={fadeInUp}>
              <span className="info-label">Role:</span>
              <span className="info-value">Student</span>
            </motion.div>
            <div className="info-item">
              <span className="info-label">Account Status:</span>
              <span className="info-value status-active">Active</span>
            </div>
            <div className="info-item">
              <span className="info-label">Member Since:</span>
              <span className="info-value">January 2024</span>
            </div>
          </motion.div>

          <div className="info-card">
            <h3 className="info-title">Quick Links</h3>
            <div className="quick-links">
              <button 
                className="link-btn"
                onClick={() => navigate("/attendance-history")}
              >
                📊 View Attendance
              </button>
              <button 
                className="link-btn"
                onClick={() => navigate("/scan-qr")}
              >
                📱 Scan QR Code
              </button>
            </div>
          </div>
        </motion.section>
      </motion.main>
    </motion.div>
  );
}

export default StudentProfile;
