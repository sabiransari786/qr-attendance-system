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
          <h1 className="dashboard__title">My Class Sessions</h1>
          <p className="dashboard__subtitle">View and manage all your class sessions</p>
        </div>
        <button
          className="dashboard__button dashboard__button--secondary"
          onClick={handleBack}
        >
          ← Back to Dashboard
        </button>
      </header>

      <main style={{ padding: '20px' }}>
        {loading && <p>Loading sessions...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        {!loading && !error && sessions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>No sessions found</h3>
            <p>You haven't created any sessions yet.</p>
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div style={{ display: 'grid', gap: '20px' }}>
            {sessions.map((session) => (
              <div 
                key={session.id} 
                className="dashboard__card"
                style={{ padding: '20px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2em' }}>
                      {session.subject}
                    </h3>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      📍 {session.location}
                    </p>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      🕐 {formatDate(session.startTime)}
                    </p>
                    <div style={{ marginTop: '10px' }}>
                      <span 
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.85em',
                          fontWeight: '500',
                          backgroundColor: session.status === 'active' ? '#d4edda' : '#f8d7da',
                          color: session.status === 'active' ? '#155724' : '#721c24'
                        }}
                      >
                        {session.status === 'active' ? '🟢 Active' : '🔴 Closed'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <button
                      className="dashboard__button dashboard__button--primary"
                      onClick={() => handleGenerateQR(session.id)}
                      disabled={session.status !== 'active'}
                      style={{
                        opacity: session.status !== 'active' ? 0.5 : 1,
                        cursor: session.status !== 'active' ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Generate QR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default FacultySessions;
