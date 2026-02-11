import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

function StudentProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
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

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:5001/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.data || data.user;
        const profile = {
          name: userData.name || "",
          email: userData.email || "",
          studentId: userData.studentId || userData.id || "",
          phone: userData.phone || "",
          department: userData.department || "Computer Science",
          semester: userData.semester || "4th",
          section: userData.section || "A"
        };
        setProfileData(profile);
        setEditedData(profile);
      } else {
        // Use fallback data
        const fallbackProfile = {
          name: localStorage.getItem("userName") || "Student Name",
          email: localStorage.getItem("userEmail") || "student@example.com",
          studentId: localStorage.getItem("studentId") || "STU-0001",
          phone: "123-456-7890",
          department: "Computer Science",
          semester: "4th",
          section: "A"
        };
        setProfileData(fallbackProfile);
        setEditedData(fallbackProfile);
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

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5001/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editedData)
      });

      if (response.ok) {
        setProfileData({ ...editedData });
        setEditing(false);
        setMessage({ type: "success", text: "Profile updated successfully!" });
        
        // Update localStorage
        localStorage.setItem("userName", editedData.name);
        localStorage.setItem("userEmail", editedData.email);
        
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: "Failed to update profile" });
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
    <div className="profile-container">
      <div className="profile__objects" aria-hidden="true">
        <span className="profile__object profile__object--sphere" />
        <span className="profile__object profile__object--ring" />
        <span className="profile__object profile__object--cube" />
      </div>
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Student Profile</h1>
          <p className="dashboard__subtitle">View and edit your profile information</p>
        </div>
        <button
          className="dashboard__button dashboard__button--secondary"
          onClick={() => navigate("/student/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </header>

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
            <div className="profile-avatar">
              <span className="avatar-text">
                {profileData.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="profile-title">
              <h2>{profileData.name}</h2>
              <p>{profileData.email}</p>
            </div>
          </div>

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
                  />
                ) : (
                  <p className="form-value">{profileData.name}</p>
                )}
              </div>

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
                  />
                ) : (
                  <p className="form-value">{profileData.email}</p>
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
                  />
                ) : (
                  <p className="form-value">{profileData.phone}</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                {editing ? (
                  <input
                    type="text"
                    name="department"
                    className="form-input"
                    value={editedData.department}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="form-value">{profileData.department}</p>
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
                  />
                ) : (
                  <p className="form-value">{profileData.section}</p>
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
              <span className="info-value">Student</span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Status:</span>
              <span className="info-value status-active">Active</span>
            </div>
            <div className="info-item">
              <span className="info-label">Member Since:</span>
              <span className="info-value">January 2024</span>
            </div>
          </div>

          <div className="info-card">
            <h3 className="info-title">Quick Links</h3>
            <div className="quick-links">
              <button 
                className="link-btn"
                onClick={() => navigate("/student/attendance-history")}
              >
                📊 View Attendance
              </button>
              <button 
                className="link-btn"
                onClick={() => navigate("/student/scan-qr")}
              >
                📱 Scan QR Code
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default StudentProfile;
