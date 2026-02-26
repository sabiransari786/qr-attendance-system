import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import { fadeInUp, staggerContainer } from '../animations/animationConfig';
import '../styles/dashboard.css';

function FacultySuspiciousActivity() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const user = authContext?.user;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/faculty/suspicious-activity?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setActivities(data.data || []);
        } else {
          const data = await response.json().catch(() => ({}));
          setError(data.message || 'Failed to fetch suspicious activities');
        }
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Error loading activities. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (token && user?.role === 'faculty') {
      fetchActivities();
    }
  }, [token, user?.role]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const TYPE_META = {
    duplicate_attendance:  { label: 'Duplicate Attendance',   icon: '👥', color: '#eab308', bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.4)' },
    unauthorized_attempt:  { label: 'Unauthorized Attempt',   icon: '🚫', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.4)' },
    invalid_qr:            { label: 'Invalid QR Code',        icon: '❌', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.4)' },
    failed_login:          { label: 'Failed Login',           icon: '🔐', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.4)' },
    system_error:          { label: 'System Error',           icon: '⚠️', color: '#ec4899', bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.4)' },
    suspicious:            { label: 'Suspicious Activity',    icon: '🔍', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.4)' },
  };

  const getMeta = (type) => TYPE_META[type] || TYPE_META.suspicious;

  const handleDismiss = (id) => setDismissed(prev => new Set([...prev, id]));

  const counts = activities.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {});

  const visible = activities
    .filter(a => !dismissed.has(a.id))
    .filter(a => filterType === 'all' || a.type === filterType)
    .sort((a, b) => {
      const da = new Date(a.createdAt || 0), db = new Date(b.createdAt || 0);
      return sortBy === 'recent' ? db - da : da - db;
    });

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
          <h1 className="dashboard__title">🚨 Suspicious Activity Log</h1>
          <p className="dashboard__subtitle">Review and manage flagged attendance attempts</p>
        </div>
        <motion.button
          className="dashboard__button dashboard__button--secondary"
          onClick={() => navigate('/faculty-dashboard')}
          whileHover={{ scale: 1.04, y: -2, transition: { type: 'spring', stiffness: 320, damping: 24 } }}
          whileTap={{ scale: 0.96 }}
        >
          ← Back
        </motion.button>
      </motion.header>

      <main>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)' }}>⏳ Loading activities...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '1.5rem', backgroundColor: 'rgba(255,107,107,0.1)', border: '1px solid #ff6b6b', borderRadius: '10px', color: '#ff6b6b', marginBottom: '2rem' }}>
            ❌ {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Summary chips */}
            {activities.length > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {Object.entries(counts).map(([type, cnt]) => {
                  const m = getMeta(type);
                  return (
                    <span key={type} onClick={() => setFilterType(prev => prev === type ? 'all' : type)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', backgroundColor: filterType === type ? m.color : m.bg, color: filterType === type ? '#fff' : m.color, border: `1px solid ${m.border}`, transition: 'all 0.18s' }}
                    >
                      {m.icon} {m.label} <strong>({cnt})</strong>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>Filter by Type</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <option value="all">All Types</option>
                  <option value="duplicate_attendance">Duplicate Attendance</option>
                  <option value="unauthorized_attempt">Unauthorized Attempts</option>
                  <option value="invalid_qr">Invalid QR</option>
                  <option value="failed_login">Failed Login</option>
                  <option value="system_error">System Errors</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>Sort by</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{ display: 'inline-block', padding: '0.6rem 1rem', backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem' }}>
                  {visible.length} {visible.length === 1 ? 'record' : 'records'}
                </span>
              </div>
            </div>

            {/* Empty state */}
            {visible.length === 0 && (
              <div style={{ textAlign: 'center', padding: '70px 20px', backgroundColor: 'rgba(16,185,129,0.05)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: '#10b981' }}>
                  {filterType === 'all' ? 'No suspicious activities detected!' : 'No records for this filter'}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {filterType === 'all' ? 'All attendance attempts appear legitimate.' : 'Try changing the filter to see other records.'}
                </p>
              </div>
            )}

            {/* Cards */}
            {visible.length > 0 && (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {visible.map((activity) => {
                  const m = getMeta(activity.type);
                  return (
                    <motion.div key={activity.id} variants={fadeInUp}
                      style={{ padding: '1.25rem 1.5rem', border: `1.5px solid ${m.border}`, borderLeft: `4px solid ${m.color}`, borderRadius: '10px', backgroundColor: m.bg, display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                          <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: m.color }}>{m.label}</span>
                          {activity.statusCode && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.15)', color: m.color }}>HTTP {activity.statusCode}</span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.5rem 1.5rem', marginTop: '0.5rem' }}>
                          {activity.studentName && (
                            <div>
                              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</p>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>
                                {activity.studentName}
                                {activity.studentEmail && <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400, fontSize: '0.8rem', marginLeft: '0.35rem' }}>({activity.studentEmail})</span>}
                              </p>
                            </div>
                          )}
                          {activity.subject && (
                            <div>
                              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</p>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{activity.subject}</p>
                            </div>
                          )}
                          {activity.attemptCount && (
                            <div>
                              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attempts</p>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: m.color }}>{activity.attemptCount}×</p>
                            </div>
                          )}
                          {(activity.action || activity.path) && (
                            <div>
                              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</p>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{activity.action || activity.path}</p>
                            </div>
                          )}
                          {activity.ipAddress && (
                            <div>
                              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>IP Address</p>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', fontFamily: 'monospace' }}>{activity.ipAddress}</p>
                            </div>
                          )}
                          <div>
                            <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</p>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>{formatDate(activity.createdAt)}</p>
                          </div>
                          {activity.firstAttempt && activity.lastAttempt && (
                            <div>
                              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Range</p>
                              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.8rem' }}>{formatDate(activity.firstAttempt)} → {formatDate(activity.lastAttempt)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => handleDismiss(activity.id)} title="Dismiss"
                        style={{ background: 'none', border: `1px solid ${m.border}`, borderRadius: '6px', padding: '0.3rem 0.7rem', cursor: 'pointer', color: m.color, fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = m.color; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = m.color; }}
                      >✓ Dismiss</button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </main>
    </motion.div>
  );
}

export default FacultySuspiciousActivity;
