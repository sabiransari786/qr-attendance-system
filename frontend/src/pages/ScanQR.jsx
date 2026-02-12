import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import "../styles/dashboard.css";

function ScanQR() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const [qrCode, setQrCode] = useState("");
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);

  const handleQrInputChange = (e) => {
    setQrCode(e.target.value);
    setMessage({ type: "", text: "" });
  };

  const verifyQrCode = async (code = null) => {
    const codeToVerify = code || qrCode;
    
    if (!codeToVerify.trim()) {
      setMessage({ type: "error", text: "Please enter a QR code" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      
      // Verify session exists
      const sessionResponse = await fetch(`http://localhost:5001/api/session/${codeToVerify}`, {
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

  const activateCamera = async () => {
    try {
      setCameraActive(true);
      setMessage({ type: "info", text: "Requesting camera access..." });

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setMessage({ type: "success", text: "Camera active - Position QR code in frame" });
        startScanning();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraActive(false);
      if (error.name === "NotAllowedError") {
        setMessage({ 
          type: "error", 
          text: "Camera permission denied. Please allow camera access and try again." 
        });
      } else if (error.name === "NotFoundError") {
        setMessage({ 
          type: "error", 
          text: "No camera found on this device. Please enter QR code manually." 
        });
      } else {
        setMessage({ 
          type: "error", 
          text: "Failed to access camera. Please try again or enter QR code manually." 
        });
      }
    }
  };

  const startScanning = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data && code.data !== scannedCode) {
          setScannedCode(code.data);
          setQrCode(code.data);
          setMessage({ 
            type: "success", 
            text: "✓ QR code detected! Verifying..." 
          });
          deactivateCamera();
          verifyQrCode(code.data);
        }
      }

      if (cameraActive) {
        animationRef.current = requestAnimationFrame(scan);
      }
    };

    animationRef.current = requestAnimationFrame(scan);
  };

  const deactivateCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      deactivateCamera();
    };
  }, []);

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
                <div className="camera-placeholder" style={{ position: "relative" }}>
                  <video
                    ref={videoRef}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "12px",
                      display: "block"
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    style={{
                      display: "none"
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "200px",
                    height: "200px",
                    border: "2px solid #fbbf24",
                    borderRadius: "8px",
                    boxShadow: "0 0 0 2px rgba(251, 191, 36, 0.2)"
                  }} />
                </div>
              ) : (
                <div className="scanner-placeholder">
                  <span className="qr-icon">📱</span>
                  <p>Scan QR Code</p>
                </div>
              )}
            </div>
            {!cameraActive ? (
              <button 
                className="action-btn action-btn--primary"
                onClick={activateCamera}
              >
                📷 Activate Camera
              </button>
            ) : (
              <button 
                className="action-btn action-btn--danger"
                onClick={deactivateCamera}
              >
                ✕ Stop Camera
              </button>
            )}
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
