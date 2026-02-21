import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import { fadeInUp, fadeInDown, staggerContainer, buttonHover, buttonTap } from '../animations/animationConfig';
import '../styles/dashboard.css';

function FacultySessions() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const user = authContext?.user;

  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [editError, setEditError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [newSession, setNewSession] = useState({
    subject: '',
    location: '',
    startTime: '',
    duration: 60,
    courseId: ''
  });
  const [editSession, setEditSession] = useState({
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

  // Fetch faculty's courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/faculty/my-courses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setCourses(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
      }
    };
    if (token) fetchCourses();
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

  const handleOpenEdit = (session) => {
    const date = new Date(session.startTime);
    const localIso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEditSession({
      subject: session.subject,
      location: session.location,
      startTime: localIso,
      duration: session.duration || 60
    });
    setSelectedSession(session);
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditSession = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/session/${selectedSession.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: editSession.subject.trim(),
          location: editSession.location.trim(),
          startTime: editSession.startTime,
          duration: parseInt(editSession.duration)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update session');
      }

      setSessions((prev) =>
        prev.map((s) => (s.id === selectedSession.id ? data.data : s))
      );
      setShowEditModal(false);
      setSelectedSession(null);
    } catch (err) {
      setEditError(err.message || 'Failed to update session');
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenDelete = (session) => {
    setSelectedSession(session);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDeleteSession = async () => {
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/session/${selectedSession.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete session');
      }

      setSessions((prev) => prev.filter((s) => s.id !== selectedSession.id));
      setShowDeleteModal(false);
      setSelectedSession(null);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete session');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenCreate = () => {
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setNewSession({
      subject: '',
      location: '',
      startTime: localIso,
      duration: 60,
      courseId: ''
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
          duration: parseInt(newSession.duration),
          courseId: newSession.courseId ? parseInt(newSession.courseId) : undefined
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
    <motion.div
      className="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="dashboard__objects" aria-hidden="true">
        <span className="dashboard__object dashboard__object--sphere" />
        <span className="dashboard__object dashboard__object--torus" />
        <span className="dashboard__object dashboard__object--diamond" />
      </div>
      <motion.header
        className="dashboard__header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <h1 className="dashboard__title">📚 My Class Sessions</h1>
          <p className="dashboard__subtitle">Manage and monitor all your active class sessions</p>
        </div>
        <motion.button
          className="dashboard__button dashboard__button--secondary"
          onClick={handleBack}
          whileHover={{ scale: 1.04, y: -2, transition: { type: 'spring', stiffness: 320, damping: 24 } }}
          whileTap={{ scale: 0.96 }}
        >
          ← Back
        </motion.button>
      </motion.header>

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
          <motion.div
            className="dashboard__grid"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="dashboard__card dashboard__card--clickable" onClick={handleOpenCreate} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && handleOpenCreate()} style={{ cursor: 'pointer', minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
              variants={fadeInUp}
              whileHover={{ y: -10, scale: 1.02, boxShadow: '0 20px 50px rgba(49,156,181,0.22)', transition: { type: 'spring', stiffness: 280, damping: 22 } }}
              whileTap={{ scale: 0.97 }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.9 }}>➕</div>
              <h3 className="dashboard__card-title">Add New Session</h3>
              <p className="dashboard__card-text">Create a new class session with subject, location, and time.</p>
              <button className="dashboard__card-action" style={{ marginTop: '1.2rem' }}>
                Create Session →
              </button>
            </motion.div>
            {sessions.map((session) => (
              <motion.div key={session.id} className="dashboard__card"
                variants={fadeInUp}
                whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(49,156,181,0.18)', transition: { type: 'spring', stiffness: 280, damping: 24 } }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: '0 0 0.25rem 0', 
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    color: 'var(--color-text)'
                  }}>
                    {session.subject}
                  </h3>
                  {session.course?.name && (
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: '600' }}>
                      📚 {session.course.name} ({session.course.code})
                    </p>
                  )}

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

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    className="dashboard__button dashboard__button--secondary"
                    onClick={() => handleOpenEdit(session)}
                    style={{ flex: 1 }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="dashboard__button"
                    onClick={() => handleOpenDelete(session)}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid #ef4444'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
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
                <select
                  className="form-input"
                  value={newSession.courseId}
                  onChange={(e) => {
                    const selected = courses.find(c => c.id === parseInt(e.target.value));
                    setNewSession((prev) => ({
                      ...prev,
                      courseId: e.target.value,
                      subject: selected ? `${selected.name} (${selected.code})` : prev.subject
                    }));
                  }}
                  required
                >
                  <option value="">-- Select Your Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) — {c.department_name}
                    </option>
                  ))}
                </select>
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

      {showEditModal && selectedSession && (
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
            <h2 style={{ margin: '0 0 1rem 0' }}>Edit Session</h2>
            <form onSubmit={handleEditSession}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <select
                  className="form-input"
                  value={editSession.subject}
                  onChange={(e) => setEditSession((prev) => ({ ...prev, subject: e.target.value }))}
                  required
                >
                  <option value="">-- Select Subject --</option>
                  {COURSES.map((c) => (
                    <option key={c.code} value={`${c.name} (${c.code})`}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Location"
                  value={editSession.location}
                  onChange={(e) => setEditSession((prev) => ({ ...prev, location: e.target.value }))}
                  required
                />
                <input
                  type="datetime-local"
                  className="form-input"
                  value={editSession.startTime}
                  onChange={(e) => setEditSession((prev) => ({ ...prev, startTime: e.target.value }))}
                  required
                />
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="240"
                  placeholder="Duration (minutes)"
                  value={editSession.duration}
                  onChange={(e) => setEditSession((prev) => ({ ...prev, duration: e.target.value }))}
                  required
                />
                {editError && (
                  <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{editError}</div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="dashboard__button dashboard__button--secondary" onClick={() => { setShowEditModal(false); setSelectedSession(null); }}>
                  Cancel
                </button>
                <button type="submit" className="dashboard__button dashboard__button--primary" disabled={editLoading}>
                  {editLoading ? 'Updating...' : 'Update Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedSession && (
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
            maxWidth: '420px',
            border: '1px solid var(--color-border)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#ef4444' }}>🗑️ Delete Session</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
              Are you sure you want to delete the session <strong>"{selectedSession.subject}"</strong>? This action cannot be undone.
            </p>
            {deleteError && (
              <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem' }}>{deleteError}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                className="dashboard__button dashboard__button--secondary" 
                onClick={() => { setShowDeleteModal(false); setSelectedSession(null); }}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                className="dashboard__button" 
                onClick={handleDeleteSession}
                disabled={deleteLoading}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none'
                }}
              >
                {deleteLoading ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default FacultySessions;
