/**
 * Faculty QR Generation Page — ap__* unified design
 */

import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, BookOpen, Building, MapPin, Clock, Users, ArrowLeft, AlertCircle, RefreshCw, Loader } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { API_BASE_URL } from '../utils/constants';
import '../styles/dashboard.css';
import '../styles/admin-pages.css';

function FacultyQRGeneration() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const token = authContext?.token;

  /* ── state ─────────────────────────────────────────────────────────── */
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [attendanceValue, setAttendanceValue] = useState(1);
  const [duration, setDuration] = useState(1);
  const [customDuration, setCustomDuration] = useState('');
  const [radius, setRadius] = useState(20);
  const [customRadius, setCustomRadius] = useState('');
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const [useCustomRadius, setUseCustomRadius] = useState(false);

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  const [qrData, setQrData] = useState(null);
  const [generateError, setGenerateError] = useState(null);
  const [expiryTime, setExpiryTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const [attendanceCount, setAttendanceCount] = useState(0);
  const pollingInterval = useRef(null);

  const [showConfig, setShowConfig] = useState(true);
  const [showQRDisplay, setShowQRDisplay] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);

  /* ── auth guard ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!user || user.role !== 'faculty') navigate('/unauthorized');
  }, [user, navigate]);

  /* ── fetch sessions ────────────────────────────────────────────────── */
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoadingSessions(true);
        const res = await fetch(`${API_BASE_URL}/session`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let data = [];
        try { data = await res.json(); } catch {}
        const mine = (data.data || data || []).filter(
          (s) => s.status === 'active' && s.facultyId === user?.id
        );
        setSessions(mine);
        if (mine.length > 0) setSelectedSessionId(mine[0].id);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setGenerateError('Failed to load sessions');
      } finally {
        setLoadingSessions(false);
      }
    };
    if (token && user?.id) fetchSessions();
  }, [token, user?.id]);

  /* ── countdown timer ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!expiryTime) { setTimeRemaining(null); return; }
    const tick = () => {
      const rem = Math.max(0, new Date(expiryTime).getTime() - Date.now());
      if (rem === 0) {
        setTimeRemaining('EXPIRED');
        setQrData(null);
        clearInterval(pollingInterval.current);
      } else {
        const m = Math.floor(rem / 60000);
        const s = Math.floor((rem % 60000) / 1000);
        setTimeRemaining(`${m}:${s.toString().padStart(2, '0')}`);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiryTime]);

  /* ── geolocation ───────────────────────────────────────────────────── */
  const requestGeolocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return null;
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCurrentLocation({ latitude, longitude });
          setLocationLoading(false);
          resolve({ latitude, longitude });
        },
        (err) => {
          let msg = 'Failed to get location';
          if (err.code === err.PERMISSION_DENIED) msg = 'Location permission denied. Please enable location services.';
          else if (err.code === err.TIMEOUT) msg = 'Location request timed out';
          setLocationError(msg);
          setLocationLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  /* ── generate QR ───────────────────────────────────────────────────── */
  const handleGenerateQR = async () => {
    setGenerateError(null);
    if (!selectedSessionId) { setGenerateError('Please select a session'); return; }
    const coords = await requestGeolocation();
    if (!coords) return;

    setGeneratingQR(true);
    const durationVal = useCustomDuration ? parseInt(customDuration) : duration;
    const radiusVal = useCustomRadius ? parseInt(customRadius) : radius;

    if (!Number.isInteger(durationVal) || durationVal < 1) { setGenerateError('Please enter a valid duration'); setGeneratingQR(false); return; }
    if (!Number.isInteger(radiusVal) || radiusVal < 1) { setGenerateError('Please enter a valid radius'); setGeneratingQR(false); return; }

    try {
      const res = await fetch(`${API_BASE_URL}/qr-request/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          session_id: selectedSessionId,
          attendance_value: parseInt(attendanceValue),
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius_meters: radiusVal,
          duration_minutes: durationVal,
        }),
      });
      let data;
      try { data = await res.json(); } catch { throw new Error('Invalid response from server'); }
      if (!res.ok) throw new Error(data.message || 'Failed to generate QR');

      setQrData(data.request_id);
      setExpiryTime(data.expires_at);
      setShowConfig(false);
      setShowQRDisplay(true);
      setAttendanceCount(0);
      startAttendancePolling(data.request_id);
    } catch (err) {
      setGenerateError(err.message || 'Failed to generate QR code');
    } finally {
      setGeneratingQR(false);
    }
  };

  /* ── attendance polling ────────────────────────────────────────────── */
  const startAttendancePolling = (requestId) => {
    pollingInterval.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/qr-request/${requestId}/attendance-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAttendanceCount(data.count || 0);
      } catch {}
    }, 2000);
  };

  const stopAttendancePolling = () => {
    if (pollingInterval.current) clearInterval(pollingInterval.current);
  };

  useEffect(() => () => { if (pollingInterval.current) clearInterval(pollingInterval.current); }, []);

  /* ── regenerate ────────────────────────────────────────────────────── */
  const handleRegenerateQR = () => {
    stopAttendancePolling();
    setQrData(null);
    setShowConfig(true);
    setShowQRDisplay(false);
    setTimeRemaining(null);
  };

  /* ── helpers ────────────────────────────────────────────────────────── */
  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <div className="ap">
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>

      <div className="ap__inner" style={{ maxWidth: 720 }}>
        {/* Header */}
        <motion.header
          className="ap__header"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="ap__header-left">
            <button className="ap__back-btn" onClick={() => navigate('/faculty-dashboard')}>
              <ArrowLeft size={18} /> Back
            </button>
            <p className="ap__eyebrow">Faculty &bull; QR Attendance</p>
            <h1 className="ap__title"><QrCode size={26} style={{ verticalAlign: 'middle', marginRight: 8 }} />Generate QR Code</h1>
            <p className="ap__subtitle">Select a session, configure options, and generate a scannable QR code</p>
          </div>
        </motion.header>

        {/* ── Config Panel ─────────────────────────────────────────── */}
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {/* Session Selection */}
            <div className="ap__panel">
              <div className="ap__panel-header">
                <h2 className="ap__panel-title"><BookOpen size={18} /> Select Session</h2>
              </div>
              <div style={{ padding: '1.25rem' }}>
                {loadingSessions ? (
                  <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '1.5rem 0' }}>
                    <Loader size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, animation: 'spin 1s linear infinite' }} />
                    Loading sessions…
                  </p>
                ) : sessions.length === 0 ? (
                  <div className="ap__empty">
                    <BookOpen size={40} className="ap__empty-icon" />
                    <p className="ap__empty-title">No Active Sessions</p>
                    <p className="ap__empty-text">Create a session first from the Sessions page.</p>
                  </div>
                ) : (
                  <>
                    <select
                      className="ap__select"
                      value={selectedSessionId || ''}
                      onChange={(e) => setSelectedSessionId(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    >
                      <option value="">-- Select a session --</option>
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.subject}{s.course?.name ? ` [${s.course.name}]` : ''} - {s.location} (ID: {s.id})
                        </option>
                      ))}
                    </select>

                    {selectedSession && (
                      <div style={{ marginTop: '0.85rem', padding: '0.7rem 1rem', background: 'rgba(49,156,181,0.08)', borderRadius: 8, border: '1px solid rgba(49,156,181,0.25)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.88rem' }}>
                        {selectedSession.course?.name && (
                          <span><BookOpen size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /><strong>{selectedSession.course.name}</strong> ({selectedSession.course.code})</span>
                        )}
                        {selectedSession.department?.name && (
                          <span style={{ color: 'var(--color-text-secondary)' }}><Building size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{selectedSession.department.name}</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Attendance Points */}
            <div className="ap__panel">
              <div className="ap__panel-header">
                <h2 className="ap__panel-title"><Users size={18} /> Attendance Points</h2>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginBottom: '0.85rem' }}>
                  Enter points between 1–10. All marked as Present (P).
                </p>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={attendanceValue}
                  onChange={(e) => setAttendanceValue(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="ap__search"
                  style={{ maxWidth: 140, textAlign: 'center', fontSize: '1.1rem', fontWeight: 700 }}
                  placeholder="1-10"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="ap__panel">
              <div className="ap__panel-header">
                <h2 className="ap__panel-title"><Clock size={18} /> QR Validity Duration</h2>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: useCustomDuration ? '0.85rem' : 0 }}>
                  {[1, 2, 5].map((min) => (
                    <button
                      key={min}
                      type="button"
                      className={!useCustomDuration && duration === min ? 'ap__btn ap__btn--primary' : 'ap__btn ap__btn--outline'}
                      onClick={() => { setDuration(min); setUseCustomDuration(false); }}
                      style={{ minWidth: 90 }}
                    >
                      {min} Min{min > 1 ? 's' : ''}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={useCustomDuration ? 'ap__btn ap__btn--primary' : 'ap__btn ap__btn--outline'}
                    onClick={() => setUseCustomDuration(true)}
                    style={{ minWidth: 90 }}
                  >
                    Custom
                  </button>
                </div>
                {useCustomDuration && (
                  <input
                    type="number"
                    min="1"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    placeholder="Enter minutes"
                    className="ap__search"
                    style={{ maxWidth: 180 }}
                  />
                )}
              </div>
            </div>

            {/* Radius */}
            <div className="ap__panel">
              <div className="ap__panel-header">
                <h2 className="ap__panel-title"><MapPin size={18} /> Allowed Location Radius</h2>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: useCustomRadius ? '0.85rem' : 0 }}>
                  {[10, 20, 50].map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={!useCustomRadius && radius === r ? 'ap__btn ap__btn--primary' : 'ap__btn ap__btn--outline'}
                      onClick={() => { setRadius(r); setUseCustomRadius(false); }}
                      style={{ minWidth: 90 }}
                    >
                      {r}m
                    </button>
                  ))}
                  <button
                    type="button"
                    className={useCustomRadius ? 'ap__btn ap__btn--primary' : 'ap__btn ap__btn--outline'}
                    onClick={() => setUseCustomRadius(true)}
                    style={{ minWidth: 90 }}
                  >
                    Custom
                  </button>
                </div>
                {useCustomRadius && (
                  <input
                    type="number"
                    min="1"
                    value={customRadius}
                    onChange={(e) => setCustomRadius(e.target.value)}
                    placeholder="Enter meters"
                    className="ap__search"
                    style={{ maxWidth: 180 }}
                  />
                )}
              </div>
            </div>

            {/* Errors */}
            {(generateError || locationError) && (
              <div style={{ padding: '0.9rem 1.2rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, color: '#ef4444', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={18} /> {generateError || locationError}
              </div>
            )}

            {/* Generate Button */}
            <button
              className="ap__btn ap__btn--primary"
              onClick={handleGenerateQR}
              disabled={generatingQR || locationLoading || !selectedSessionId}
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700, gap: 8 }}
            >
              {generatingQR ? (
                <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating QR…</>
              ) : (
                <><QrCode size={18} /> Generate QR Code</>
              )}
            </button>
          </motion.div>
        )}

        {/* ── QR Display ───────────────────────────────────────────── */}
        {showQRDisplay && qrData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            {/* Status Bar */}
            <div className="ap__stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
              <div className="ap__stat">
                <span className="ap__stat-label">Status</span>
                <span className="ap__stat-value" style={{ color: timeRemaining === 'EXPIRED' ? '#ef4444' : '#10b981' }}>
                  {timeRemaining === 'EXPIRED' ? 'Expired' : 'Active'}
                </span>
              </div>
              <div className="ap__stat">
                <span className="ap__stat-label">Time Remaining</span>
                <span className="ap__stat-value" style={{ fontFamily: 'monospace', fontSize: '1.5rem' }}>
                  {timeRemaining || '--:--'}
                </span>
              </div>
              <div className="ap__stat">
                <span className="ap__stat-label">Students Attended</span>
                <span className="ap__stat-value">{attendanceCount}</span>
              </div>
            </div>

            {/* QR Code Panel */}
            <div className="ap__panel">
              <div className="ap__panel-header">
                <h2 className="ap__panel-title"><QrCode size={18} /> Active QR Code</h2>
                <span className={timeRemaining === 'EXPIRED' ? 'ap__badge ap__badge--error' : 'ap__badge ap__badge--active'}>
                  {timeRemaining === 'EXPIRED' ? 'EXPIRED' : timeRemaining}
                </span>
              </div>
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: 12 }}>
                  <QRCodeCanvas value={qrData} size={280} level="H" includeMargin={true} />
                </div>

                {/* Live attendance count */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>Live Attendance Count</p>
                  <div style={{ fontSize: '3rem', fontWeight: 800, background: 'linear-gradient(135deg, #319cb5, #67d4ed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {attendanceCount}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Students Attended</p>
                </div>
              </div>
            </div>

            {/* Location Info */}
            {currentLocation && (
              <div className="ap__panel">
                <div className="ap__panel-header">
                  <h2 className="ap__panel-title"><MapPin size={18} /> Faculty Location</h2>
                </div>
                <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', fontSize: '0.88rem' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Latitude</span>
                    <p style={{ margin: '0.25rem 0 0', fontWeight: 600, fontFamily: 'monospace' }}>{currentLocation.latitude.toFixed(6)}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Longitude</span>
                    <p style={{ margin: '0.25rem 0 0', fontWeight: 600, fontFamily: 'monospace' }}>{currentLocation.longitude.toFixed(6)}</p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Radius</span>
                    <p style={{ margin: '0.25rem 0 0', fontWeight: 600 }}>{radius}m</p>
                  </div>
                </div>
              </div>
            )}

            {/* Regenerate */}
            <button
              className="ap__btn ap__btn--outline"
              onClick={handleRegenerateQR}
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', gap: 8 }}
            >
              <RefreshCw size={18} /> Regenerate QR Code
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default FacultyQRGeneration;
