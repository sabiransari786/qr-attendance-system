import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/dashboard.css';

function FacultySessions() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const user = authContext?.user;

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/session', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSessions(data.data || []);
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
  }, [token]);

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
    </div>
  );
}

export default FacultySessions;
