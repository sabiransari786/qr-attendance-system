/**
 * Scan QR Enhanced — ap__* unified design
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import jsQR from 'jsqr';
import {
  Camera, CameraIcon, ClipboardList,
  CheckCircle, Loader, AlertTriangle, XCircle, Check, BookOpenText,
  ArrowLeft,
} from 'lucide-react';
import { API_BASE_URL } from '../utils/constants';
import '../styles/dashboard.css';
import '../styles/admin-pages.css';

function ScanQREnhanced() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);

  const [qrCode, setQrCode] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [locationVerified, setLocationVerified] = useState(false);
  const [deviceVerified, setDeviceVerified] = useState(false);

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (sessionInfo?.qr_expiry_time) {
      const interval = setInterval(() => {
        const diff = Math.max(0, Math.floor((new Date(sessionInfo.qr_expiry_time) - new Date()) / 1000));
        setTimeRemaining(diff);
        if (diff <= 0) { setMessage({ type: 'error', text: 'QR Code has expired' }); setSessionInfo(null); }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionInfo]);

  const fmtTime = (sec) => {
    if (!sec) return '00:00';
    return `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;
  };

  /* ── Location ──────────────────────────────────────────────── */
  const verifyLocation = () => new Promise((resolve) => {
    if (!navigator.geolocation) { resolve({ verified: false, latitude: 0, longitude: 0 }); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocationVerified(true); resolve({ verified: true, latitude: pos.coords.latitude, longitude: pos.coords.longitude }); },
      () => { resolve({ verified: false, latitude: 0, longitude: 0 }); },
      { timeout: 8000 }
    );
  });

  /* ── Device ────────────────────────────────────────────────── */
  const verifyDevice = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) { deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); localStorage.setItem('deviceId', deviceId); }
    setDeviceVerified(true);
    return { verified: true, deviceId };
  };

  /* ── Verify QR ─────────────────────────────────────────────── */
  const verifyQrCode = async (code = null) => {
    const c = code || qrCode;
    if (!c.trim()) { setMessage({ type: 'error', text: 'Please enter or scan a QR code' }); return; }
    setLoading(true);
    setMessage({ type: 'info', text: 'Getting your location…' });
    try {
      const token = sessionStorage.getItem('authToken');
      const loc = await verifyLocation();
      setMessage({ type: 'info', text: 'Validating QR code…' });
      const valRes = await fetch(`${API_BASE_URL}/qr-request/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ request_id: c, student_latitude: loc.latitude || 0, student_longitude: loc.longitude || 0 }),
      });
      const valData = await valRes.json();
      if (!valData.valid) { setMessage({ type: 'error', text: valData.reason || 'Invalid QR code' }); setLoading(false); return; }

      const sessRes = await fetch(`${API_BASE_URL}/session/${valData.session_id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        const session = sessData.data;
        if (session.status !== 'active') { setMessage({ type: 'error', text: 'Session is not active' }); setLoading(false); return; }
        setSessionInfo({ ...session, requestId: c });
        setLocationVerified(true);
        setDeviceVerified(true);
        const distMsg = valData.distance ? ` (${valData.distance}m from class)` : '';
        setMessage({ type: 'success', text: `QR verified${distMsg}. Click Accept to mark attendance.` });
      } else {
        const err = await sessRes.json();
        setMessage({ type: 'error', text: err.message || 'Could not fetch session info' });
        setSessionInfo(null);
      }
    } catch { setMessage({ type: 'error', text: 'Failed to verify QR code.' }); setSessionInfo(null); }
    finally { setLoading(false); }
  };

  /* ── Submit ────────────────────────────────────────────────── */
  const submitAttendance = async () => {
    if (!sessionInfo) return;
    setLoading(true);
    setMessage({ type: 'info', text: 'Marking attendance…' });
    try {
      const token = sessionStorage.getItem('authToken');
      if (sessionInfo.requestId) { try { await fetch(`${API_BASE_URL}/qr-request/${sessionInfo.requestId}/accept`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {} }
      const res = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sessionId: sessionInfo.id, timestamp: Date.now() }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Attendance marked successfully!' });
        setQrCode(''); setSessionInfo(null);
        setTimeout(() => navigate('/student-dashboard'), 2000);
      } else {
        const err = await res.json();
        let msg = err.message || 'Failed to mark attendance';
        if (msg.includes('duplicate') || msg.includes('already')) msg = 'Already marked for this session';
        if (msg.includes('enrolled') || msg.includes('course')) msg = 'Not enrolled in this course';
        setMessage({ type: 'error', text: msg });
      }
    } catch { setMessage({ type: 'error', text: 'Failed to submit attendance.' }); }
    finally { setLoading(false); }
  };

  /* ── Camera ────────────────────────────────────────────────── */
  const activateCamera = async () => {
    try {
      setCameraActive(true);
      setMessage({ type: 'info', text: 'Starting camera…' });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); scanQRFromCamera(); }
      setMessage({ type: 'success', text: 'Camera active. Point at QR code…' });
    } catch { setMessage({ type: 'error', text: 'Failed to access camera' }); setCameraActive(false); }
  };

  const scanQRFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current; const video = videoRef.current; const ctx = canvas.getContext('2d');
    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(data.data, data.width, data.height);
        if (code) { setScannedCode(code.data); setQrCode(code.data); stopCamera(); verifyQrCode(code.data); return; }
      }
      animationRef.current = requestAnimationFrame(scan);
    };
    scan();
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="ap">
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>

      <div className="ap__inner">
        {/* Header */}
        <header className="ap__header">
          <div className="ap__header-left">
            <button className="ap__back-btn" onClick={() => navigate('/student-dashboard')}>
              <ArrowLeft size={18} /> Back
            </button>
            <p className="ap__eyebrow">Student &bull; Attendance</p>
            <h1 className="ap__title"><Camera size={26} style={{ verticalAlign: 'middle', marginRight: 8 }} />Scan QR Code</h1>
            <p className="ap__subtitle">Point your camera at the QR code to mark attendance</p>
          </div>
        </header>

        {/* Camera Scan Panel */}
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          {/* Camera */}
          <div className="ap__panel">
            <div className="ap__panel-header">
              <h2 className="ap__panel-title"><CameraIcon size={18} /> Camera Scan</h2>
              <span className="ap__badge ap__badge--active">Live</span>
            </div>
            <div style={{ padding: '1.25rem' }}>
              {!cameraActive ? (
                <div style={{ textAlign: 'center' }}>
                  <Camera size={48} style={{ color: 'var(--accent)', marginBottom: 12 }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Use your camera to scan QR code</p>
                  <button className="ap__btn ap__btn--primary" onClick={activateCamera} style={{ width: '100%' }}>Activate Camera</button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} style={{ width: '100%', borderRadius: 10, background: '#000' }} playsInline />
                  <button className="ap__btn ap__btn--outline" onClick={stopCamera} style={{ width: '100%', marginTop: '0.75rem' }}>Stop Camera</button>
                </>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{
            marginTop: '1.25rem', padding: '0.85rem 1.2rem', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem',
            background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(49,156,181,0.08)',
            border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,0.3)' : message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(49,156,181,0.2)'}`,
            color: message.type === 'error' ? '#ef4444' : message.type === 'success' ? '#10b981' : 'var(--accent)',
          }}>
            {message.type === 'error' && <XCircle size={18} />}
            {message.type === 'success' && <CheckCircle size={18} />}
            {message.type === 'info' && <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />}
            {message.text}
          </motion.div>
        )}

        {/* Session Details */}
        {sessionInfo && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1.25rem' }}>
            <div className="ap__panel">
              <div className="ap__panel-header">
                <h2 className="ap__panel-title"><ClipboardList size={18} /> Session Details</h2>
                <span className="ap__badge ap__badge--active">Verified</span>
              </div>
              <div style={{ padding: '1.25rem' }}>
                {/* Info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  {[
                    { label: 'Subject', value: sessionInfo.subject },
                    { label: 'Faculty', value: sessionInfo.faculty?.name || sessionInfo.faculty_name || 'N/A' },
                    { label: 'Location', value: sessionInfo.location },
                    { label: 'Date & Time', value: new Date(sessionInfo.startTime || sessionInfo.start_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '0.75rem', background: 'rgba(49,156,181,0.06)', borderRadius: 10, border: '1px solid rgba(49,156,181,0.12)' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: '0.04em', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Timer */}
                {timeRemaining !== null && (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: timeRemaining < 60 ? 'rgba(239,68,68,0.08)' : 'rgba(49,156,181,0.06)', border: `1px solid ${timeRemaining < 60 ? 'rgba(239,68,68,0.2)' : 'rgba(49,156,181,0.15)'}`, textAlign: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Time Remaining</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace', color: timeRemaining < 60 ? '#ef4444' : 'var(--accent)' }}>{fmtTime(timeRemaining)}</div>
                  </div>
                )}

                {/* Verification */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: 10, background: locationVerified ? 'rgba(16,185,129,0.06)' : 'rgba(49,156,181,0.04)', border: `1px solid ${locationVerified ? 'rgba(16,185,129,0.2)' : 'rgba(49,156,181,0.1)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {locationVerified ? <CheckCircle size={20} color="#10b981" /> : <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />}
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Location {locationVerified ? 'Verified' : 'Checking…'}</span>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: 10, background: deviceVerified ? 'rgba(16,185,129,0.06)' : 'rgba(49,156,181,0.04)', border: `1px solid ${deviceVerified ? 'rgba(16,185,129,0.2)' : 'rgba(49,156,181,0.1)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {deviceVerified ? <CheckCircle size={20} color="#10b981" /> : <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />}
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Device {deviceVerified ? 'Verified' : 'Checking…'}</span>
                  </div>
                </div>

                <button className="ap__btn ap__btn--primary" onClick={submitAttendance} disabled={loading || !sessionInfo || timeRemaining === 0} style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700, gap: 8 }}>
                  {loading ? 'Submitting…' : <><Check size={18} /> Accept & Mark Attendance</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <div className="ap__panel" style={{ marginTop: '1.25rem' }}>
          <div className="ap__panel-header">
            <h2 className="ap__panel-title"><BookOpenText size={18} /> Instructions</h2>
          </div>
          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {[
              { icon: <CameraIcon size={14} />, text: 'Choose: Camera, Upload Image, or Manual Entry' },
              { icon: <CheckCircle size={14} />, text: 'Ensure you are within the class location for verification' },
              { icon: <AlertTriangle size={14} />, text: 'QR code expires after set time — scan before expiry' },
              { icon: <XCircle size={14} />, text: 'Only one device can be used per session' },
              { icon: <ClipboardList size={14} />, text: 'Cannot mark attendance twice for the same session' },
              { icon: <Check size={14} />, text: 'After verification, click "Accept" to confirm' },
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(49,156,181,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent)' }}>{t.icon}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScanQREnhanced;
