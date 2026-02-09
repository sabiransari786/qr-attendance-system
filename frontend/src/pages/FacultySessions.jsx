import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import '../styles/dashboard.css';

function FacultySessions() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const user = authContext?.user;

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [newSession, setNewSession] = useState({
    subject: '',
    location: '',
    startTime: '',
    duration: 60
  });

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/session`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const allSessions = data.data || [];
          const facultySessions = allSessions.filter(s => s.facultyId === user?.id);
          setSessions(facultySessions);
        } else {
          setError('Failed to fetch sessions');
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Error loading sessions');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSessions();
    }
  }, [token, user?.id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGenerateQR = (sessionId) => {
    navigate(`/faculty/qr-generation?sessionId=${sessionId}`);
  };

  const handleOpenCreate = () => {
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setNewSession({
      subject: '',
      location: '',
      startTime: localIso,
      duration: 60
    });
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: newSession.subject.trim(),
          location: newSession.location.trim(),
          startTime: newSession.startTime,
          duration: parseInt(newSession.duration)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create session');
      }

      const createdSession = data.data;
      setSessions((prev) => [createdSession, ...prev]);
      setShowCreateModal(false);
    } catch (err) {
      setCreateError(err.message || 'Failed to create session');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/faculty-dashboard');
  };

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">📚 My Class Sessions</h1>
          <p className="dashboard__subtitle">Manage and monitor all your active class sessions</p>
        </div>
        <button
          className="dashboard__button dashboard__button--secondary"
          onClick={handleBack}
        >
          ← Back
        </button>
      </header>

      <main>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)' }}>⏳ Loading sessions...</p>
          </div>
        )}

        {error && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid #ff6b6b',
            borderRadius: '10px',
            color: '#ff6b6b',
            marginBottom: '2rem'
          }}>
            ❌ {error}
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No sessions found</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>You haven't created any sessions yet.</p>
            <button
              className="dashboard__button dashboard__button--primary"
              onClick={handleBack}
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="dashboard__grid">
            <div className="dashboard__card dashboard__card--clickable" onClick={handleOpenCreate} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && handleOpenCreate()} style={{ cursor: 'pointer', minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.9 }}>➕</div>
              <h3 className="dashboard__card-title">Add New Session</h3>
              <p className="dashboard__card-text">Create a new class session with subject, location, and time.</p>
              <button className="dashboard__card-action" style={{ marginTop: '1.2rem' }}>
                Create Session →
              </button>
            </div>
            {sessions.map((session) => (
              <div key={session.id} className="dashboard__card">
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: '0 0 0.75rem 0', 
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    color: 'var(--color-text)'
                  }}>
                    {session.subject}
                  </h3>

                  <div style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
                    <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
                      📍 <strong>{session.location}</strong>
                    </p>
                    <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
                      🕐 {formatDate(session.startTime)}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.4rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      backgroundColor: session.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: session.status === 'active' ? '#10b981' : '#ef4444',
                      border: `1px solid ${session.status === 'active' ? '#10b981' : '#ef4444'}`
                    }}>
                      <span style={{ fontSize: '1.1em' }}>{session.status === 'active' ? '🟢' : '🔴'}</span>
                      {session.status === 'active' ? 'Active' : 'Closed'}
                    </span>
                  </div>
                </div>

                <button
                  className="dashboard__button dashboard__button--primary"
                  onClick={() => handleGenerateQR(session.id)}
                  disabled={session.status !== 'active'}
                  style={{
                    opacity: session.status !== 'active' ? 0.5 : 1,
                    cursor: session.status !== 'active' ? 'not-allowed' : 'pointer',
                    marginTop: '1.5rem',
                    width: '100%'
                  }}
                >
                  Generate QR →
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '520px',
            border: '1px solid var(--color-border)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0' }}>Create New Session</h2>
            <form onSubmit={handleCreateSession}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Subject"
                  value={newSession.subject}
                  onChange={(e) => setNewSession((prev) => ({ ...prev, subject: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Location"
                  value={newSession.location}
                  onChange={(e) => setNewSession((prev) => ({ ...prev, location: e.target.value }))}
                  required
                />
                <input
                  type="datetime-local"
                  className="form-input"
                  value={newSession.startTime}
                  onChange={(e) => setNewSession((prev) => ({ ...prev, startTime: e.target.value }))}
                  required
                />
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="240"
                  placeholder="Duration (minutes)"
                  value={newSession.duration}
                  onChange={(e) => setNewSession((prev) => ({ ...prev, duration: e.target.value }))}
                  required
                />
                {createError && (
                  <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{createError}</div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="dashboard__button dashboard__button--secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="dashboard__button dashboard__button--primary" disabled={createLoading}>
                  {createLoading ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultySessions;
