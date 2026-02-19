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
  const [filterAction, setFilterAction] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [rejectionLoading, setRejectionLoading] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/auth/admin/logs?role=student&limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const logs = data?.data?.logs || [];
          
          // Filter for suspicious activities
          const suspiciousActivities = logs.filter((log) => {
            const action = log.action || '';
            return (
              action.includes('failed') ||
              action.includes('denied') ||
              action.includes('expired') ||
              action.includes('duplicate') ||
              action.includes('invalid') ||
              action.includes('unauthorized')
            );
          });

          setActivities(suspiciousActivities);
        } else {
          setError('Failed to fetch activity logs');
        }
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Error loading activities');
      } finally {
        setLoading(false);
      }
    };

    if (token && user?.role === 'faculty') {
      fetchActivities();
    }
  }, [token, user?.role]);

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

  const getActionColor = (action) => {
    if (action.includes('failed') || action.includes('denied')) return '#ef4444';
    if (action.includes('expired')) return '#f97316';
    if (action.includes('duplicate')) return '#eab308';
    if (action.includes('invalid')) return '#ec4899';
    return '#6366f1';
  };

  const getActionIcon = (action) => {
    if (action.includes('failed') || action.includes('denied')) return '❌';
    if (action.includes('expired')) return '⏰';
    if (action.includes('duplicate')) return '👥';
    if (action.includes('invalid')) return '⚠️';
    return '🔍';
  };

  const handleApprove = async (activity) => {
    // In a real system, this would approve the flagged activity
    setActivities(prev => prev.filter(a => a.id !== activity.id));
  };

  const handleOpenReject = (activity) => {
    setSelectedActivity(activity);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    setRejectionLoading(true);
    // In a real system, this would save the rejection reason to backend
    setTimeout(() => {
      setActivities(prev => prev.filter(a => a.id !== selectedActivity.id));
      setShowRejectModal(false);
      setSelectedActivity(null);
      setRejectionLoading(false);
    }, 500);
  };

  const handleBack = () => {
    navigate('/faculty-dashboard');
  };

  const filteredActivities = activities
    .filter((a) => filterAction === 'all' || a.action.includes(filterAction))
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      return 0;
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
            <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)' }}>⏳ Loading activities...</p>
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

        {!loading && !error && (
          <>
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Filter by Action:
                </label>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Activities</option>
                  <option value="failed">Failed Attempts</option>
                  <option value="expired">Expired QR</option>
                  <option value="duplicate">Duplicates</option>
                  <option value="invalid">Invalid Requests</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    cursor: 'pointer'
                  }}
                >
                  <option value="recent">Most Recent</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              <div style={{ marginLeft: 'auto', padding: '1.75rem 0' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1',
                  borderRadius: '20px',
                  fontWeight: '600'
                }}>
                  {filteredActivities.length} Activities
                </span>
              </div>
            </div>

            {filteredActivities.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: '#10b981' }}>
                  ✅ No suspicious activities detected!
                </h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  All attendance attempts appear to be legitimate. Great job!
                </p>
              </div>
            )}

            {filteredActivities.length > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    style={{
                      padding: '1.5rem',
                      border: `2px solid ${getActionColor(activity.action)}`,
                      borderRadius: '12px',
                      backgroundColor: `${getActionColor(activity.action)}15`,
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '1rem',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{getActionIcon(activity.action)}</span>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: getActionColor(activity.action) }}>
                          {activity.action}
                        </h3>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        marginTop: '1rem',
                        padding: '1rem 0'
                      }}>
                        {activity.entity_id && (
                          <div>
                            <p style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Entity</p>
                            <p style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem' }}>
                              {activity.entity_type} #{activity.entity_id}
                            </p>
                          </div>
                        )}

                        {activity.old_value && (
                          <div>
                            <p style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Attempt</p>
                            <p style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem', fontFamily: 'monospace' }}>
                              {activity.old_value.substring(0, 30)}...
                            </p>
                          </div>
                        )}

                        <div>
                          <p style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Timestamp</p>
                          <p style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem' }}>
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                      </div>

                      {activity.new_value && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem',
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          borderRadius: '8px',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          color: 'var(--color-text-secondary)',
                          wordBreak: 'break-all'
                        }}>
                          <strong>Details:</strong> {activity.new_value}
                        </div>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      minWidth: '150px'
                    }}>
                      <button
                        onClick={() => handleApprove(activity)}
                        style={{
                          padding: '0.75rem 1.25rem',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          transition: 'all 0.2s'
                        }}
                        onHover={(e) => {
                          e.target.style.backgroundColor = '#059669';
                        }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleOpenReject(activity)}
                        style={{
                          padding: '0.75rem 1.25rem',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showRejectModal && selectedActivity && (
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
            <h2 style={{ margin: '0 0 1rem 0', color: '#ef4444' }}>Reject Activity</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Are you sure you want to reject this suspicious activity? Provide a reason for reference.
            </p>

            <textarea
              placeholder="Rejection reason (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text)',
                fontFamily: 'inherit',
                marginBottom: '1.5rem',
                minHeight: '100px',
                resize: 'vertical'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                className="dashboard__button dashboard__button--secondary"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedActivity(null);
                }}
                disabled={rejectionLoading}
              >
                Cancel
              </button>
              <button
                backgroundColor="ef4444"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  disabled: rejectionLoading
                }}
                onClick={handleReject}
              >
                {rejectionLoading ? 'Rejecting...' : '✗ Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default FacultySuspiciousActivity;
