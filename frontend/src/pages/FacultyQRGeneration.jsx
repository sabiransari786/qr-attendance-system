/**
 * Faculty QR Generation Page
 * 
 * Allows faculty members to:
 * - Select an active session
 * - Configure attendance options (value, duration, radius)
 * - Generate QR code with geolocation validation
 * - View live attendance count
 * - Manage previous QRs
 */

import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import '../styles/qr-generation.css';

function FacultyQRGeneration() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const token = authContext?.token;

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  // Sessions
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // QR Generation Options
  const [attendanceValue, setAttendanceValue] = useState(1); // 1, 2, or 3
  const [duration, setDuration] = useState(1); // minutes
  const [customDuration, setCustomDuration] = useState('');
  const [radius, setRadius] = useState(20); // meters
  const [useCustomDuration, setUseCustomDuration] = useState(false);

  // Location
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  // QR Code
  const [qrData, setQrData] = useState(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [expiryTime, setExpiryTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Live Attendance
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [pollingActive, setPollingActive] = useState(false);
  const pollingInterval = useRef(null);

  // UI State
  const [showConfig, setShowConfig] = useState(true);
  const [showQRDisplay, setShowQRDisplay] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);

  // =========================================================================
  // AUTHENTICATION CHECKS
  // =========================================================================

  useEffect(() => {
    if (!user || user.role !== 'faculty') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  // =========================================================================
  // FETCH ACTIVE SESSIONS
  // =========================================================================

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoadingSessions(true);
        const response = await fetch('http://localhost:5001/api/session', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        let data = [];
        try {
          data = await response.json();
        } catch (e) {
          console.error('Error parsing response');
        }

        // Filter active sessions
        const activeSessions = (data.data || data || []).filter(s => s.status === 'active');
        setSessions(activeSessions);

        if (activeSessions.length > 0) {
          setSelectedSessionId(activeSessions[0].id);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setGenerateError('Failed to load sessions');
      } finally {
        setLoadingSessions(false);
      }
    };

    if (token) {
      fetchSessions();
    }
  }, [token]);

  // =========================================================================
  // COUNTDOWN TIMER LOGIC
  // =========================================================================

  useEffect(() => {
    if (!expiryTime) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiryTime).getTime();
      const remaining = Math.max(0, expiry - now);

      if (remaining === 0) {
        setTimeRemaining('EXPIRED');
        setQrData(null);
        clearInterval(pollingInterval.current);
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiryTime]);

  // =========================================================================
  // GEOLOCATION REQUESTS
  // =========================================================================

  const requestGeolocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          setLocationLoading(false);
          resolve(true);
        },
        (error) => {
          let errorMsg = 'Failed to get location';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Location permission denied. Please enable location services.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Location request timed out';
          }
          setLocationError(errorMsg);
          setLocationLoading(false);
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // =========================================================================
  // GENERATE QR CODE
  // =========================================================================

  const handleGenerateQR = async () => {
    setGenerateError(null);

    // Validate selection
    if (!selectedSessionId) {
      setGenerateError('Please select a session');
      return;
    }

    // Request location
    const hasLocation = await requestGeolocation();
    if (!hasLocation) {
      return;
    }

    // Prepare data
    setGeneratingQR(true);
    const durationValue = useCustomDuration ? parseInt(customDuration) : duration;

    if (!Number.isInteger(durationValue) || durationValue < 1) {
      setGenerateError('Please enter a valid duration');
      setGeneratingQR(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/qr-request/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: selectedSessionId,
          attendance_value: parseInt(attendanceValue),
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          radius_meters: parseInt(radius),
          duration_minutes: durationValue
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Error parsing response');
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate QR');
      }

      // Success!
      setQrData(data.request_id);
      setExpiryTime(data.expires_at);
      setShowConfig(false);
      setShowQRDisplay(true);
      setAttendanceCount(0);

      // Start polling for attendance count
      startAttendancePolling(data.request_id);
    } catch (error) {
      setGenerateError(error.message || 'Failed to generate QR code');
    } finally {
      setGeneratingQR(false);
    }
  };

  // =========================================================================
  // ATTENDANCE POLLING
  // =========================================================================

  const startAttendancePolling = (requestId) => {
    setPollingActive(true);

    // Poll every 2 seconds
    pollingInterval.current = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/qr-request/${requestId}/attendance-count`);
        const data = await response.json();
        setAttendanceCount(data.count || 0);
      } catch (error) {
        console.error('Error polling attendance:', error);
      }
    }, 2000);
  };

  const stopAttendancePolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    setPollingActive(false);
  };

  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // =========================================================================
  // REGENERATE QR
  // =========================================================================

  const handleRegenerateQR = () => {
    stopAttendancePolling();
    setQrData(null);
    setShowConfig(true);
    setShowQRDisplay(false);
    setTimeRemaining(null);
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="qr-generation-container">
      <div className="qr__objects" aria-hidden="true">
        <span className="qr__object qr__object--sphere" />
        <span className="qr__object qr__object--ring" />
        <span className="qr__object qr__object--cube" />
      </div>
      <div className="qr-generation-wrapper">
        <h1 className="qr-generation-title">QR Code Generation for Attendance</h1>
        
        {/* Configuration Panel */}
        {showConfig && (
          <div className="qr-config-panel">
            {/* Session Selection */}
            <div className="config-section">
              <h2>Select Session</h2>
              {loadingSessions ? (
                <p>Loading sessions...</p>
              ) : sessions.length === 0 ? (
                <p className="error-message">No active sessions found</p>
              ) : (
                <select 
                  value={selectedSessionId || ''}
                  onChange={(e) => setSelectedSessionId(parseInt(e.target.value))}
                  className="form-select"
                >
                  <option value="">-- Select a session --</option>
                  {sessions.map(session => (
                    <option key={session.id} value={session.id}>
                      {session.subject} - {session.location} (ID: {session.id})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Attendance Value */}
            <div className="config-section">
              <h2>Attendance Value</h2>
              <div className="radio-group">
                <label className="radio-option">
                  <input 
                    type="radio" 
                    value="1" 
                    checked={attendanceValue === 1}
                    onChange={(e) => setAttendanceValue(parseInt(e.target.value))}
                  />
                  <span className="label-text">Present (P = 1)</span>
                </label>
                <label className="radio-option">
                  <input 
                    type="radio" 
                    value="2" 
                    checked={attendanceValue === 2}
                    onChange={(e) => setAttendanceValue(parseInt(e.target.value))}
                  />
                  <span className="label-text">Double (2P = 2)</span>
                </label>
                <label className="radio-option">
                  <input 
                    type="radio" 
                    value="3" 
                    checked={attendanceValue === 3}
                    onChange={(e) => setAttendanceValue(parseInt(e.target.value))}
                  />
                  <span className="label-text">Triple (3P = 3)</span>
                </label>
              </div>
            </div>

            {/* QR Validity Duration */}
            <div className="config-section">
              <h2>QR Validity Duration</h2>
              <div className="radio-group">
                {[1, 2, 5].map(min => (
                  <label key={min} className="radio-option">
                    <input 
                      type="radio" 
                      value={min}
                      checked={!useCustomDuration && duration === min}
                      onChange={() => {
                        setDuration(min);
                        setUseCustomDuration(false);
                      }}
                    />
                    <span className="label-text">{min} Minute{min > 1 ? 's' : ''}</span>
                  </label>
                ))}
                <label className="radio-option">
                  <input 
                    type="radio" 
                    checked={useCustomDuration}
                    onChange={() => setUseCustomDuration(true)}
                  />
                  <span className="label-text">Custom</span>
                </label>
              </div>
              {useCustomDuration && (
                <input 
                  type="number" 
                  min="1" 
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  placeholder="Enter minutes"
                  className="form-input"
                />
              )}
            </div>

            {/* Location Radius */}
            <div className="config-section">
              <h2>Allowed Location Radius</h2>
              <div className="radio-group">
                {[10, 20, 50].map(r => (
                  <label key={r} className="radio-option">
                    <input 
                      type="radio" 
                      value={r}
                      checked={radius === r}
                      onChange={() => setRadius(r)}
                    />
                    <span className="label-text">{r} Meters</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {generateError && (
              <div className="alert alert-error">
                {generateError}
              </div>
            )}

            {/* Location Error */}
            {locationError && (
              <div className="alert alert-error">
                {locationError}
              </div>
            )}

            {/* Generate Button */}
            <button 
              onClick={handleGenerateQR}
              disabled={generatingQR || locationLoading || !selectedSessionId}
              className="btn btn-primary btn-large"
            >
              {generatingQR ? 'Generating QR...' : 'Generate QR Code'}
            </button>
          </div>
        )}

        {/* QR Display Panel */}
        {showQRDisplay && qrData && (
          <div className="qr-display-panel">
            <div className="qr-header">
              <h2>Active QR Code</h2>
              <div className={`status-badge ${timeRemaining === 'EXPIRED' ? 'expired' : 'active'}`}>
                {timeRemaining === 'EXPIRED' ? 'EXPIRED' : timeRemaining}
              </div>
            </div>

            {/* QR Code Display */}
            <div className="qr-code-container">
              <QRCodeCanvas 
                value={qrData}
                size={300}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Attendance Count */}
            <div className="attendance-info">
              <h3>Live Attendance Count</h3>
              <div className="attendance-count">
                <div className="count-number">{attendanceCount}</div>
                <div className="count-label">Students Attended</div>
              </div>
            </div>

            {/* Location Info */}
            {currentLocation && (
              <div className="location-info">
                <p>
                  <strong>Faculty Location:</strong><br/>
                  Lat: {currentLocation.latitude.toFixed(6)}<br/>
                  Lng: {currentLocation.longitude.toFixed(6)}<br/>
                  Radius: {radius}m
                </p>
              </div>
            )}

            {/* Regenerate Button */}
            <button 
              onClick={handleRegenerateQR}
              className="btn btn-secondary"
            >
              Regenerate QR Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FacultyQRGeneration;
