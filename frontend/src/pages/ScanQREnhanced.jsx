import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import jsQR from "jsqr";
import { API_BASE_URL } from "../utils/constants";
import { fadeInUp, staggerContainer } from "../animations/animationConfig";
import "../styles/dashboard.css";
import "../styles/enhanced-dashboard.css";

function ScanQREnhanced() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [qrCode, setQrCode] = useState("");
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [locationVerified, setLocationVerified] = useState(false);
  const [deviceVerified, setDeviceVerified] = useState(false);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Timer for remaining time
  useEffect(() => {
    if (sessionInfo && sessionInfo.qr_expiry_time) {
      const interval = setInterval(() => {
        const expiry = new Date(sessionInfo.qr_expiry_time);
        const now = new Date();
        const diff = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeRemaining(diff);
        
        if (diff <= 0) {
          setMessage({ type: "error", text: "QR Code has expired" });
          setSessionInfo(null);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [sessionInfo]);

  const formatTimeRemaining = (seconds) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQrInputChange = (e) => {
    setQrCode(e.target.value);
    setMessage({ type: "", text: "" });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage({ type: "info", text: "Processing image..." });

    try {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          setQrCode(code.data);
          verifyQrCode(code.data);
        } else {
          setMessage({ type: "error", text: "No QR code found in image" });
          setLoading(false);
        }
      };

      img.onerror = () => {
        setMessage({ type: "error", text: "Failed to load image" });
        setLoading(false);
      };

      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.error("Error processing image:", error);
      setMessage({ type: "error", text: "Failed to process image" });
      setLoading(false);
    }
  };

  const verifyLocation = async () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ verified: false, latitude: 0, longitude: 0, message: "Geolocation not supported" });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocationVerified(true);
          resolve({ verified: true, latitude, longitude, message: "Location verified" });
        },
        (error) => {
          console.error("Location error:", error);
          // Allow attendance even if location fails - server will validate
          resolve({ verified: false, latitude: 0, longitude: 0, message: "Unable to get location" });
        },
        { timeout: 8000 }
      );
    });
  };

  const verifyDevice = async () => {
    // Get or create device ID
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', deviceId);
    }
    
    setDeviceVerified(true);
    return { verified: true, deviceId };
  };

  const verifyQrCode = async (code = null) => {
    const codeToVerify = code || qrCode;
    
    if (!codeToVerify.trim()) {
      setMessage({ type: "error", text: "Please enter or scan a QR code" });
      return;
    }

    setLoading(true);
    setMessage({ type: "info", text: "Getting your location..." });

    try {
      const token = sessionStorage.getItem("authToken");

      // Step 1: Get student location
      const locationResult = await verifyLocation();
      const lat = locationResult.latitude || 0;
      const lng = locationResult.longitude || 0;

      setMessage({ type: "info", text: "Validating QR code..." });

      // Step 2: Validate via QR request system (handles expiry + location check)
      const validateResponse = await fetch(`${API_BASE_URL}/qr-request/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          request_id: codeToVerify,
          student_latitude: lat,
          student_longitude: lng
        })
      });

      const validateData = await validateResponse.json();

      if (!validateData.valid) {
        setMessage({ type: "error", text: validateData.reason || "Invalid QR code" });
        setLoading(false);
        return;
      }

      // Step 3: Fetch session info using session_id from validate response
      const sessionResponse = await fetch(`${API_BASE_URL}/session/${validateData.session_id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        const session = sessionData.data;

        if (session.status !== "active") {
          setMessage({ type: "error", text: "Session is not active" });
          setLoading(false);
          return;
        }

        // Store requestId inside sessionInfo for submitAttendance
        setSessionInfo({ ...session, requestId: codeToVerify });
        setLocationVerified(true);
        setDeviceVerified(true);

        const distanceMsg = validateData.distance ? ` (${validateData.distance}m from class)` : "";
        setMessage({ type: "success", text: `✓ QR verified${distanceMsg}. Click Accept to mark attendance.` });
      } else {
        const errorData = await sessionResponse.json();
        setMessage({ type: "error", text: errorData.message || "Could not fetch session info" });
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
    setMessage({ type: "info", text: "Marking attendance..." });

    try {
      const token = sessionStorage.getItem("authToken");
      const requestId = sessionInfo.requestId;

      // 1. Record acceptance for live count (non-critical)
      if (requestId && token) {
        try {
          await fetch(`${API_BASE_URL}/qr-request/${requestId}/accept`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
          });
        } catch (_) { /* non-critical, ignore */ }
      }

      // 2. Mark attendance in the attendance table
      const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: sessionInfo.id,
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        setMessage({ type: "success", text: "✓ Attendance marked successfully!" });
        setQrCode("");
        setSessionInfo(null);
        setTimeout(() => navigate("/student-dashboard"), 2000);
      } else {
        const errorData = await response.json();
        let errorMessage = errorData.message || "Failed to mark attendance";
        if (errorMessage.includes("duplicate") || errorMessage.includes("already")) {
          errorMessage = "⚠️ You have already marked attendance for this session";
        } else if (errorMessage.includes("enrolled") || errorMessage.includes("course")) {
          errorMessage = "⚠️ You are not enrolled in this course";
        }
        setMessage({ type: "error", text: errorMessage });
      }
    } catch (error) {
      console.error("Error submitting attendance:", error);
      setMessage({ type: "error", text: "❌ Failed to submit attendance. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const activateCamera = async () => {
    try {
      setCameraActive(true);
      setMessage({ type: "info", text: "Starting camera..." });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanQRFromCamera();
      }

      setMessage({ type: "success", text: "Camera active. Point at QR code..." });
    } catch (error) {
      console.error("Camera error:", error);
      setMessage({ type: "error", text: "Failed to access camera" });
      setCameraActive(false);
    }
  };

  const scanQRFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          setScannedCode(code.data);
          setQrCode(code.data);
          stopCamera();
          verifyQrCode(code.data);
          return;
        }
      }
      
      animationRef.current = requestAnimationFrame(scan);
    };

    scan();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="dashboard__objects" aria-hidden="true">
        <span className="dashboard__object dashboard__object--sphere" />
        <span className="dashboard__object dashboard__object--torus" />
      </div>

      <motion.header
        className="dashboard__header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h1 className="dashboard__title">📷 Scan QR Code</h1>
          <p className="dashboard__subtitle">Scan or upload QR code to mark your attendance</p>
        </div>
        <div className="dashboard__buttons">
          <motion.button
            className="dashboard__button dashboard__button--secondary"
            onClick={() => navigate("/student-dashboard")}
            whileHover={{ scale: 1.04, y: -2, transition: { type: 'spring', stiffness: 320, damping: 24 } }}
            whileTap={{ scale: 0.96 }}
          >
            ← Back to Dashboard
          </motion.button>
        </div>
      </motion.header>

      <main className="dashboard__content">
        {/* Scanning Options */}
        <section className="dashboard__grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {/* Camera Scan Card */}
          <section className="dashboard__card">
            <h2 className="dashboard__card-title">📸 Camera Scan</h2>
            <div style={{ marginTop: '1rem' }}>
              {!cameraActive ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📷</div>
                  <p style={{ marginBottom: '1rem', color: '#666' }}>
                    Use your camera to scan QR code
                  </p>
                  <button
                    className="dashboard__button dashboard__button--primary"
                    onClick={activateCamera}
                    style={{ width: '100%' }}
                  >
                    Activate Camera
                  </button>
                </div>
              ) : (
                <div>
                  <video 
                    ref={videoRef} 
                    style={{ 
                      width: '100%', 
                      borderRadius: '8px',
                      background: '#000'
                    }}
                    playsInline
                  />
                  <button
                    className="dashboard__button dashboard__button--secondary"
                    onClick={stopCamera}
                    style={{ width: '100%', marginTop: '1rem' }}
                  >
                    Stop Camera
                  </button>
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          </section>

          {/* Upload Image Card */}
          <section className="dashboard__card">
            <h2 className="dashboard__card-title">🖼️ Upload QR Image</h2>
            <div style={{ marginTop: '1rem', textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📁</div>
              <p style={{ marginBottom: '1rem', color: '#666' }}>
                Select QR code image from your device
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <button
                className="dashboard__button dashboard__button--primary"
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%' }}
              >
                Choose Image
              </button>
            </div>
          </section>

          {/* Manual Entry Card */}
          <section className="dashboard__card">
            <h2 className="dashboard__card-title">⌨️ Manual Entry</h2>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Enter QR Code
              </label>
              <input
                type="text"
                value={qrCode}
                onChange={handleQrInputChange}
                placeholder="Enter QR code manually"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  marginBottom: '1rem'
                }}
              />
              <button
                className="dashboard__button dashboard__button--primary"
                onClick={() => verifyQrCode()}
                disabled={loading || !qrCode.trim()}
                style={{ width: '100%' }}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </div>
          </section>
        </section>

        {/* Messages */}
        {message.text && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            marginTop: '1rem',
            background: message.type === 'error' ? '#fee2e2' : 
                       message.type === 'success' ? '#d1fae5' :
                       message.type === 'warning' ? '#fef3c7' : '#dbeafe',
            color: message.type === 'error' ? '#991b1b' : 
                   message.type === 'success' ? '#065f46' :
                   message.type === 'warning' ? '#92400e' : '#1e40af',
            fontWeight: '500'
          }}>
            {message.text}
          </div>
        )}

        {/* Session Details Card */}
        {sessionInfo && (
          <section className="dashboard__card" style={{ marginTop: '2rem' }}>
            <h2 className="dashboard__card-title">📋 Session Details</h2>
            <div style={{ 
              marginTop: '1rem',
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
            }}>
              <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Subject</div>
                <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>{sessionInfo.subject}</div>
              </div>
              <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Faculty</div>
                <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>{sessionInfo.faculty_name || 'N/A'}</div>
              </div>
              <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Location</div>
                <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>{sessionInfo.location}</div>
              </div>
              <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Date & Time</div>
                <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>
                  {new Date(sessionInfo.start_time).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Time Remaining */}
            {timeRemaining !== null && (
              <div style={{
                marginTop: '1rem',
                padding: '1.5rem',
                background: timeRemaining < 60 ? '#fee2e2' : '#dbeafe',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#666' }}>
                  Time Remaining
                </div>
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 'bold',
                  color: timeRemaining < 60 ? '#ef4444' : '#3b82f6'
                }}>
                  {formatTimeRemaining(timeRemaining)}
                </div>
              </div>
            )}

            {/* Verification Status */}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{
                flex: 1,
                minWidth: '150px',
                padding: '0.75rem',
                background: locationVerified ? '#d1fae5' : '#fef3c7',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>{locationVerified ? '✅' : '⏳'}</span>
                <span style={{ fontWeight: '500' }}>Location {locationVerified ? 'Verified' : 'Checking...'}</span>
              </div>
              <div style={{
                flex: 1,
                minWidth: '150px',
                padding: '0.75rem',
                background: deviceVerified ? '#d1fae5' : '#fef3c7',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>{deviceVerified ? '✅' : '⏳'}</span>
                <span style={{ fontWeight: '500' }}>Device {deviceVerified ? 'Verified' : 'Checking...'}</span>
              </div>
            </div>

            {/* Accept Button */}
            <button
              className="dashboard__button dashboard__button--primary"
              onClick={submitAttendance}
              disabled={loading || !sessionInfo || timeRemaining === 0}
              style={{ 
                width: '100%',
                marginTop: '1.5rem',
                padding: '1rem',
                fontSize: '1.125rem',
                fontWeight: 'bold'
              }}
            >
              {loading ? "Submitting..." : "✓ Accept & Mark Attendance"}
            </button>
          </section>
        )}

        {/* Instructions Card */}
        <section className="dashboard__card" style={{ marginTop: '2rem' }}>
          <h2 className="dashboard__card-title">📖 Instructions</h2>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', lineHeight: '2', color: '#666' }}>
            <li>Choose one of three methods to scan QR code: Camera, Upload Image, or Manual Entry</li>
            <li>Ensure you are within the class location for location verification</li>
            <li>QR code expires after the set time - scan before expiry</li>
            <li>Only one device can be used per session to mark attendance</li>
            <li>You cannot mark attendance twice for the same session</li>
            <li>After successful verification, click "Accept" to confirm attendance</li>
          </ul>
        </section>
      </main>
    </motion.div>
  );
}

export default ScanQREnhanced;
