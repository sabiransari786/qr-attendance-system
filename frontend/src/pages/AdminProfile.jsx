import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../utils/constants";
import { fadeInUp, staggerContainer } from "../animations/animationConfig";
import { DEPARTMENTS } from "../config/dummyData";
import "../styles/profile.css";

function AdminProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    adminId: "",
    phone: "",
    department: "",
    designation: ""
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
          adminId: userData.adminId || userData.admin_id || userData.id || sessionStorage.getItem("userId") || "",
          phone: userData.phone || userData.contactNumber || userData.contact_number || "",
          department: userData.department || "",
          designation: userData.designation || ""
        };
        setProfileData(profile);
        setEditedData(profile);
      } else {
        // Use fallback data from sessionStorage
        const fallbackProfile = {
          name: sessionStorage.getItem("userName") || "",
          email: sessionStorage.getItem("userEmail") || "",
          adminId: sessionStorage.getItem("userId") || "",
          phone: "",
          department: "",
          designation: ""
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
      
      
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editedData)
      });

      const data = await response.json();
      

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
        
        const updatedProfile = {
          name: updatedUser.name || editedData.name,
          email: updatedUser.email || editedData.email,
          adminId: updatedUser.adminId || updatedUser.admin_id || updatedUser.id || editedData.adminId,
          phone: updatedUser.phone || updatedUser.contactNumber || updatedUser.contact_number || editedData.phone,
          department: updatedUser.department || editedData.department,
          designation: updatedUser.designation || editedData.designation
        };
        
        
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="profile__objects" aria-hidden="true">
        <span className="profile__object profile__object--sphere" />
        <span className="profile__object profile__object--ring" />
        <span className="profile__object profile__object--cube" />
      </div>
      <motion.header
        className="dashboard__header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h1 className="dashboard__title">Admin Profile</h1>
          <p className="dashboard__subtitle">View and edit your profile information</p>
        </div>
        <motion.button
          className="dashboard__button dashboard__button--secondary"
          onClick={() => navigate("/admin-dashboard")}
          whileHover={{ scale: 1.04, y: -2, transition: { type: 'spring', stiffness: 320, damping: 24 } }}
          whileTap={{ scale: 0.96 }}
        >
          ← Back to Dashboard
        </motion.button>
      </motion.header>

      <main className="profile-card" style={{position:'relative', zIndex:1}}>
        {/* Message Display */}
        {message.text && (
          <div className={`message-box ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Profile Card */}
        <section className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-container">
              <div 
                className="profile-avatar" 
                onClick={handlePhotoClick}
                style={{ cursor: 'pointer' }}
                title={photoPreview ? "Click to view/edit photo" : "Click to upload photo"}
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
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                accept="image/*"
                style={{ display: "none" }}
              />
              
              {/* Photo Menu */}
              {showPhotoMenu && photoPreview && (
                <div className="photo-menu">
                  <button className="photo-menu-item" onClick={handleViewPhoto}>
                    👁️ View Photo
                  </button>
                  <button className="photo-menu-item" onClick={handleEditPhoto}>
                    ✏️ Change Photo
                  </button>
                  <button className="photo-menu-item photo-menu-item--danger" onClick={handleRemovePhoto}>
                    🗑️ Remove Photo
                  </button>
                </div>
              )}
              
              <button
                className="photo-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Upload profile photo"
              >
                📷
              </button>
            </div>
            <div className="profile-title">
              <h2>{profileData.name}</h2>
              <p>{profileData.email}</p>
            </div>
          </div>

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
            <div className="photo-upload-section">
              <p className="photo-upload-hint">Photo adjusted. Ready to upload: {profilePhoto.name}</p>
              <button
                className="action-btn action-btn--primary"
                onClick={handleUploadPhoto}
                disabled={uploading}
              >
                {uploading ? "⏳ Uploading..." : "✓ Upload Photo"}
              </button>
            </div>
          )}

          <div className="profile-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={editedData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="form-value">{profileData.name || "Not provided"}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Admin ID</label>
                <p className="form-value">{profileData.adminId}</p>
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
                <label className="form-label">Designation</label>
                {editing ? (
                  <input
                    type="text"
                    name="designation"
                    className="form-input"
                    value={editedData.designation}
                    onChange={handleInputChange}
                    placeholder="e.g., System Administrator"
                  />
                ) : (
                  <p className="form-value">{profileData.designation || "Not specified"}</p>
                )}
              </div>
            </div>

            <div className="profile-actions">
              {editing ? (
                <>
                  <button 
                    className="action-btn action-btn--success"
                    onClick={handleSave}
                  >
                    ✓ Save Changes
                  </button>
                  <button 
                    className="action-btn action-btn--secondary"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  className="action-btn action-btn--primary"
                  onClick={handleEdit}
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Additional Info */}
        <section className="info-cards">
          <div className="info-card">
            <h3 className="info-title">Account Information</h3>
            <div className="info-item">
              <span className="info-label">Role:</span>
              <span className="info-value">Administrator</span>
            </div>
            <div className="info-item">
              <span className="info-label">Access Level:</span>
              <span className="info-value status-active">Full Access</span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Status:</span>
              <span className="info-value status-active">Active</span>
            </div>
          </div>

          <div className="info-card">
            <h3 className="info-title">Quick Links</h3>
            <div className="quick-links">
              <button 
                className="link-btn"
                onClick={() => navigate("/admin-dashboard")}
              >
                📊 View Dashboard
              </button>
              <button 
                className="link-btn"
                onClick={() => {
                  navigate("/admin-dashboard");
                  // Trigger users view after navigation
                  setTimeout(() => {
                    const usersButton = document.querySelector('.admin-dashboard__action');
                    if (usersButton) usersButton.click();
                  }, 100);
                }}
              >
                👥 Manage Users
              </button>
            </div>
          </div>
        </section>
      </main>
    </motion.div>
  );
}

export default AdminProfile;
