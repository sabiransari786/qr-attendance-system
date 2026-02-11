import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

function ScanQR() {
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState("");
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [cameraActive, setCameraActive] = useState(false);

  const handleQrInputChange = (e) => {
    setQrCode(e.target.value);
    setMessage({ type: "", text: "" });
  };

  const verifyQrCode = async () => {
    if (!qrCode.trim()) {
      setMessage({ type: "error", text: "Please enter a QR code" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      
      // Verify session exists
      const sessionResponse = await fetch(`http://localhost:5001/api/session/${qrCode}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        setSessionInfo(sessionData.data);
        setMessage({ type: "success", text: "Session found! Click submit to mark attendance." });
      } else {
        const errorData = await sessionResponse.json();
        setMessage({ type: "error", text: errorData.message || "Invalid QR code" });
        setSessionInfo(null);
      }
    } catch (error) {
      console.error("Error verifying QR code:", error);
      setMessage({ type: "error", text: "Failed to verify QR code. Please try again." });
      setSessionInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const submitAttendance = async () => {
    if (!sessionInfo) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const response = await fetch("http://localhost:5001/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: sessionInfo.id,
          studentId: userId,
          status: "present"
        })
      });

      if (response.ok) {
        setMessage({ 
          type: "success", 
          text: "✓ Attendance marked successfully!" 
        });
        setQrCode("");
        setSessionInfo(null);
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/student/dashboard");
        }, 2000);
      } else {
        const errorData = await response.json();
        setMessage({ 
          type: "error", 
          text: errorData.message || "Failed to mark attendance" 
        });
      }
    } catch (error) {
      console.error("Error submitting attendance:", error);
      setMessage({ 
        type: "error", 
        text: "Failed to submit attendance. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  const activateCamera = () => {
    setCameraActive(true);
    setMessage({ 
      type: "info", 
      text: "Camera feature coming soon! Please enter QR code manually for now." 
    });
    setTimeout(() => setCameraActive(false), 3000);
  };

  return (
    <div className="dashboard">
      <div className="dashboard__objects" aria-hidden="true">
        <span className="dashboard__object dashboard__object--sphere" />
        <span className="dashboard__object dashboard__object--torus" />
        <span className="dashboard__object dashboard__object--diamond" />
      </div>
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Scan QR Code</h1>
          <p className="dashboard__subtitle">Mark your attendance by scanning the QR code</p>
        </div>
        <button
          className="dashboard__button dashboard__button--secondary"
          onClick={() => navigate("/student/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </header>

      <main className="scan-qr-container">
        {/* QR Scanner Section */}
        <section className="qr-scanner-section">
          <div className="scanner-card">
            <div className={`scanner-area ${cameraActive ? "active" : ""}`}>
              {cameraActive ? (
                <div className="camera-placeholder">
                  <span className="camera-icon">📷</span>
                  <p>Camera Preview</p>
                </div>
              ) : (
                <div className="scanner-placeholder">
                  <span className="qr-icon">📱</span>
                  <p>Scan QR Code</p>
                </div>
              )}
            </div>
            <button 
              className="action-btn action-btn--primary"
              onClick={activateCamera}
              disabled={cameraActive}
            >
              {cameraActive ? "Scanning..." : "📷 Activate Camera"}
            </button>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          {/* Manual Entry Section */}
          <div className="manual-entry-card">
            <label className="input-label">Enter QR Code Manually</label>
            <input
              type="text"
              className="qr-input"
              placeholder="Enter session QR code"
              value={qrCode}
              onChange={handleQrInputChange}
              disabled={loading}
            />
            <button 
              className="action-btn action-btn--secondary"
              onClick={verifyQrCode}
              disabled={loading || !qrCode.trim()}
            >
              {loading ? "Verifying..." : "🔍 Verify Code"}
            </button>
          </div>
        </section>

        {/* Message Display */}
        {message.text && (
          <div className={`message-box ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Session Info Display */}
        {sessionInfo && (
          <section className="session-info-card">
            <h2 className="section-title">Session Details</h2>
            <div className="session-details">
              <div className="detail-row">
                <span className="detail-label">Subject:</span>
                <span className="detail-value">{sessionInfo.subject}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Faculty:</span>
                <span className="detail-value">{sessionInfo.facultyName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {new Date(sessionInfo.date).toLocaleDateString()}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Time:</span>
                <span className="detail-value">
                  {sessionInfo.startTime} - {sessionInfo.endTime}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${sessionInfo.status}`}>
                  {sessionInfo.status}
                </span>
              </div>
            </div>
            <button 
              className="action-btn action-btn--success"
              onClick={submitAttendance}
              disabled={loading}
            >
              {loading ? "Submitting..." : "✓ Submit Attendance"}
            </button>
          </section>
        )}

        {/* Instructions */}
        <section className="instructions-card">
          <h3 className="section-title">Instructions</h3>
          <ul className="instructions-list">
            <li>📱 Make sure you're in the class when scanning</li>
            <li>⏱️ QR code must be scanned within the session time</li>
            <li>✓ Verify session details before submitting</li>
            <li>🔄 Contact faculty if you face any issues</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default ScanQR;
