/**
 * Scan QR Enhanced - ap__* unified design
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
  const lastDecodeTsRef = useRef(0);
  const scanAttemptsRef = useRef(0);
  const scanningActiveRef = useRef(false);

  const [qrCode, setQrCode] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const [facingMode] = useState('environment');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [locationVerified, setLocationVerified] = useState(false);
  const [deviceVerified, setDeviceVerified] = useState(false);
  const [precheckToken, setPrecheckToken] = useState('');
  const [secondCheckDelaySeconds, setSecondCheckDelaySeconds] = useState(12);
  const [boundDeviceId, setBoundDeviceId] = useState('');
  const [firstCheckAt, setFirstCheckAt] = useState(null);

  const SCAN_INTERVAL_MS = 80;
  const SCAN_FRAME_SIZE = 360;

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (sessionInfo?.qr_expiry_time) {
      const interval = setInterval(() => {
        const diff = Math.max(0, Math.floor((new Date(sessionInfo.qr_expiry_time) - new Date()) / 1000));
        setTimeRemaining(diff);
        if (diff <= 0) {
          setMessage({ type: 'error', text: 'QR Code has expired' });
          setSessionInfo(null);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionInfo]);

  const fmtTime = (sec) => {
    if (!sec) return '00:00';
    return `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;
  };

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const getSingleLocationReading = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now(),
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Location permission denied. Please allow location access.'));
          return;
        }
        reject(new Error('Unable to fetch location. Please try again.'));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 12000,
      }
    );
  });

  const collectAccurateLocationSamples = async (targetCount = 3) => {
    const samples = [];
    let attempts = 0;

    while (samples.length < targetCount && attempts < 15) {
      attempts += 1;
      const reading = await getSingleLocationReading();

      if (reading.accuracy > 30) {
        setMessage({ type: 'info', text: 'Fetching accurate location, please wait...' });
        await wait(1200);
        continue;
      }

      samples.push(reading);
      if (samples.length < targetCount) {
        await wait(800);
      }
    }

    if (samples.length < targetCount) {
      throw new Error('Could not get accurate location (<= 30m). Please stay in open area and retry.');
    }

    return samples;
  };

  const verifyDevice = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    setDeviceVerified(true);
    setBoundDeviceId(deviceId);
    return { verified: true, deviceId };
  };

  const getCompatibleCameraStream = async () => {
    const candidates = [
      {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 960, max: 1280 },
          height: { ideal: 540, max: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640, max: 960 },
          height: { ideal: 480, max: 720 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: facingMode,
        },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    let lastError = null;
    for (const constraints of candidates) {
      try {
        // Try progressively simpler constraints for maximum device compatibility.
        // eslint-disable-next-line no-await-in-loop
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Unable to access camera');
  };

  const normalizeScannedToken = (rawValue) => {
    const raw = String(rawValue || '').trim();
    if (!raw) return '';

    if (raw.startsWith('q2.') || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)) {
      return raw;
    }

    if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('"') && raw.endsWith('"'))) {
      try {
        const parsed = JSON.parse(raw);
        const candidate = parsed?.qr_token || parsed?.token || parsed?.request_id;
        if (candidate) return String(candidate).trim();
      } catch {
        // ignore invalid JSON
      }
    }

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      try {
        const url = new URL(raw);
        const qp = url.searchParams.get('qr_token') || url.searchParams.get('token') || url.searchParams.get('request_id');
        if (qp) return qp.trim();

        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
          const tail = segments[segments.length - 1];
          if (tail.startsWith('q2.') || /^[0-9a-f-]{36}$/i.test(tail)) {
            return tail;
          }
        }
      } catch {
        // ignore invalid URL
      }
    }

    return raw;
  };

  const verifyQrCode = async (code = null) => {
    const c = normalizeScannedToken(code || qrCode || '');
    if (!c) {
      setMessage({ type: 'error', text: 'Please enter or scan a QR code' });
      return;
    }

    setLoading(true);
    setPrecheckToken('');
    setMessage({ type: 'info', text: 'Collecting accurate location samples...' });

    try {
      const token = sessionStorage.getItem('authToken');
      const samples = await collectAccurateLocationSamples(3);
      setLocationVerified(true);
      const device = verifyDevice();

      setMessage({ type: 'info', text: 'Validating QR code...' });
      const valRes = await fetch(`${API_BASE_URL}/qr-request/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          qr_token: c,
          location_samples: samples,
          device_id: device.deviceId,
          scan_timestamp: Date.now(),
        }),
      });

      const valData = await valRes.json();
      if (!valRes.ok) {
        setMessage({ type: 'error', text: valData.message || valData.reason || 'QR validation failed' });
        return;
      }

      if (!valData.valid) {
        setMessage({ type: 'error', text: valData.reason || valData.message || 'Invalid QR code' });
        return;
      }

      const sessRes = await fetch(`${API_BASE_URL}/session/${valData.session_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!sessRes.ok) {
        const err = await sessRes.json();
        setMessage({ type: 'error', text: err.message || 'Could not fetch session info' });
        setSessionInfo(null);
        return;
      }

      const sessData = await sessRes.json();
      const session = sessData.data;
      if (session.status !== 'active') {
        setMessage({ type: 'error', text: 'Session is not active' });
        return;
      }

      setSessionInfo({ ...session, requestId: valData.request_id });
      setPrecheckToken(valData.precheck_token || '');
      setFirstCheckAt(Date.now());
      setSecondCheckDelaySeconds(valData.second_check_after_seconds || 12);
      setLocationVerified(true);
      setDeviceVerified(true);

      const distMsg = valData.metrics?.average_distance_meters
        ? ` Avg distance: ${valData.metrics.average_distance_meters}m.`
        : '';

      setMessage({
        type: 'success',
        text: `QR verified.${distMsg} Wait ${valData.second_check_after_seconds || 12}s, then click Accept.`
      });
    } catch {
      setMessage({ type: 'error', text: 'Failed to verify QR code.' });
      setSessionInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const submitAttendance = async () => {
    if (!sessionInfo || !precheckToken) return;

    setLoading(true);
    setMessage({ type: 'info', text: 'Running second location verification...' });

    try {
      const token = sessionStorage.getItem('authToken');

      if (firstCheckAt) {
        const elapsed = Date.now() - firstCheckAt;
        const minDelay = secondCheckDelaySeconds * 1000;
        if (elapsed < minDelay) {
          await wait(minDelay - elapsed);
        }
      }

      const secondSamples = await collectAccurateLocationSamples(3);

      const res = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sessionId: sessionInfo.id,
          timestamp: Date.now(),
          qrPrecheckToken: precheckToken,
          secondLocationSamples: secondSamples,
          deviceId: boundDeviceId || localStorage.getItem('deviceId') || '',
          selfieCaptured: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        let msg = err.message || 'Failed to mark attendance';
        if (msg.includes('duplicate') || msg.includes('already')) msg = 'Already marked for this session';
        if (msg.includes('enrolled') || msg.includes('course')) msg = 'Not enrolled in this course';
        setMessage({ type: 'error', text: msg });
        return;
      }

      if (sessionInfo.requestId) {
        try {
          await fetch(`${API_BASE_URL}/qr-request/${sessionInfo.requestId}/accept`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch {
          // no-op: live counter is best-effort
        }
      }

      setMessage({ type: 'success', text: 'Attendance marked successfully!' });
      setQrCode('');
      setSessionInfo(null);
      setPrecheckToken('');
      setTimeout(() => navigate('/student-dashboard'), 2000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to submit attendance.' });
    } finally {
      setLoading(false);
    }
  };

  const activateCamera = async () => {
    try {
      setCameraActive(true);
      scanningActiveRef.current = true;
      setMessage({ type: 'info', text: 'Starting camera...' });

      const stream = await getCompatibleCameraStream();

      streamRef.current = stream;

      const [track] = stream.getVideoTracks();
      if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities();
        const advanced = [];
        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
          advanced.push({ focusMode: 'continuous' });
        }
        if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
          advanced.push({ exposureMode: 'continuous' });
        }
        if (advanced.length > 0) {
          try {
            await track.applyConstraints({ advanced });
          } catch {
            // Ignore unsupported advanced constraints.
          }
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        await videoRef.current.play();
        scanQRFromCamera();
      }

      setMessage({ type: 'success', text: 'Camera active. Point at QR code...' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to access camera' });
      setCameraActive(false);
      scanningActiveRef.current = false;
    }
  };

  const scanQRFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const decodeFrame = () => {
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return null;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return null;

      const side = Math.floor(Math.min(vw, vh) * 0.9);
      const sx = Math.floor((vw - side) / 2);
      const sy = Math.floor((vh - side) / 2);

      canvas.width = SCAN_FRAME_SIZE;
      canvas.height = SCAN_FRAME_SIZE;
      ctx.drawImage(video, sx, sy, side, side, 0, 0, SCAN_FRAME_SIZE, SCAN_FRAME_SIZE);

      const imageData = ctx.getImageData(0, 0, SCAN_FRAME_SIZE, SCAN_FRAME_SIZE);
      const tryBoth = scanAttemptsRef.current % 5 === 0;

      let result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: tryBoth ? 'attemptBoth' : 'dontInvert',
      });

      if (!result && scanAttemptsRef.current % 4 === 0) {
        const fw = Math.min(vw, 720);
        const fh = Math.min(vh, 720);
        canvas.width = fw;
        canvas.height = fh;
        ctx.drawImage(video, 0, 0, fw, fh);
        const fullFrame = ctx.getImageData(0, 0, fw, fh);
        result = jsQR(fullFrame.data, fullFrame.width, fullFrame.height, {
          inversionAttempts: 'attemptBoth',
        });
      }

      return result;
    };

    const scan = () => {
      if (!scanningActiveRef.current) return;

      const now = Date.now();
      if (now - lastDecodeTsRef.current >= SCAN_INTERVAL_MS) {
        lastDecodeTsRef.current = now;
        scanAttemptsRef.current += 1;

        const code = decodeFrame();
        if (code) {
          setScannedCode(code.data);
          setQrCode(code.data);
          setMessage({ type: 'info', text: 'QR detected. Verifying...' });
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
    scanningActiveRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  return (
    <div className="ap">
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>

      <div className="ap__inner">
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

        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
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
                  <div style={{ position: 'relative' }}>
                    <video ref={videoRef} style={{ width: '100%', borderRadius: 10, background: '#000' }} playsInline muted />
                    <div style={{
                      position: 'absolute',
                      inset: '12% 12%',
                      border: '2px solid rgba(16,185,129,0.9)',
                      borderRadius: 14,
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                  <button className="ap__btn ap__btn--outline" onClick={stopCamera} style={{ width: '100%', marginTop: '0.75rem' }}>Stop Camera</button>
                </>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          </div>
        </div>

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

        {sessionInfo && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1.25rem' }}>
            <div className="ap__panel">
              <div className="ap__panel-header">
                <h2 className="ap__panel-title"><ClipboardList size={18} /> Session Details</h2>
                <span className="ap__badge ap__badge--active">Verified</span>
              </div>
              <div style={{ padding: '1.25rem' }}>
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

                {timeRemaining !== null && (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: timeRemaining < 60 ? 'rgba(239,68,68,0.08)' : 'rgba(49,156,181,0.06)', border: `1px solid ${timeRemaining < 60 ? 'rgba(239,68,68,0.2)' : 'rgba(49,156,181,0.15)'}`, textAlign: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Time Remaining</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace', color: timeRemaining < 60 ? '#ef4444' : 'var(--accent)' }}>{fmtTime(timeRemaining)}</div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.75rem', borderRadius: 10, background: locationVerified ? 'rgba(16,185,129,0.06)' : 'rgba(49,156,181,0.04)', border: `1px solid ${locationVerified ? 'rgba(16,185,129,0.2)' : 'rgba(49,156,181,0.1)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {locationVerified ? <CheckCircle size={20} color="#10b981" /> : <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />}
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Location {locationVerified ? 'Verified' : 'Checking...'}</span>
                  </div>
                  <div style={{ padding: '0.75rem', borderRadius: 10, background: deviceVerified ? 'rgba(16,185,129,0.06)' : 'rgba(49,156,181,0.04)', border: `1px solid ${deviceVerified ? 'rgba(16,185,129,0.2)' : 'rgba(49,156,181,0.1)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {deviceVerified ? <CheckCircle size={20} color="#10b981" /> : <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />}
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Device {deviceVerified ? 'Verified' : 'Checking...'}</span>
                  </div>
                </div>

                <button className="ap__btn ap__btn--primary" onClick={submitAttendance} disabled={loading || !sessionInfo || timeRemaining === 0} style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700, gap: 8 }}>
                  {loading ? 'Submitting...' : <><Check size={18} /> Accept & Mark Attendance</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="ap__panel" style={{ marginTop: '1.25rem' }}>
          <div className="ap__panel-header">
            <h2 className="ap__panel-title"><BookOpenText size={18} /> Instructions</h2>
          </div>
          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {[
              { icon: <CameraIcon size={14} />, text: 'Use Camera Scan only to mark attendance' },
              { icon: <CheckCircle size={14} />, text: 'Ensure you are within the class location for verification' },
              { icon: <AlertTriangle size={14} />, text: 'QR code expires after set time - scan before expiry' },
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
