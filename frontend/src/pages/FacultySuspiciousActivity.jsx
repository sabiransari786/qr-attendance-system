/**
 * Faculty Suspicious Activity — ap__* unified design
 */

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Ban, XCircle, KeyRound, AlertTriangle, Search,
  ShieldAlert, Loader, CheckCircle, Check, ArrowLeft,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import '../styles/dashboard.css';
import '../styles/admin-pages.css';

const TYPE_META = {
  duplicate_attendance:  { label: 'Duplicate Attendance',  icon: <Users size={16} />,          badge: 'ap__badge--warn' },
  unauthorized_attempt:  { label: 'Unauthorized Attempt',  icon: <Ban size={16} />,            badge: 'ap__badge--error' },
  invalid_qr:            { label: 'Invalid QR Code',       icon: <XCircle size={16} />,        badge: 'ap__badge--warn' },
  failed_login:          { label: 'Failed Login',          icon: <KeyRound size={16} />,       badge: 'ap__badge--inactive' },
  system_error:          { label: 'System Error',          icon: <AlertTriangle size={16} />,  badge: 'ap__badge--error' },
  suspicious:            { label: 'Suspicious Activity',   icon: <Search size={16} />,         badge: 'ap__badge--warn' },
};
const getMeta = (type) => TYPE_META[type] || TYPE_META.suspicious;

function FacultySuspiciousActivity() {
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [dismissed, setDismissed] = useState(new Set());

  /* ── fetch ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/faculty/suspicious-activity?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setActivities(data.data || []);
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.message || 'Failed to fetch suspicious activities');
        }
      } catch {
        setError('Error loading activities. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (token && user?.role === 'faculty') fetchActivities();
  }, [token, user?.role]);

  /* ── helpers ────────────────────────────────────────────────────────── */
  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleDismiss = (id) => setDismissed((p) => new Set([...p, id]));

  const counts = activities.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {});

  const visible = activities
    .filter((a) => !dismissed.has(a.id))
    .filter((a) => filterType === 'all' || a.type === filterType)
    .sort((a, b) => {
      const da = new Date(a.createdAt || 0), db = new Date(b.createdAt || 0);
      return sortBy === 'recent' ? db - da : da - db;
    });

  /* ── render ─────────────────────────────────────────────────────────── */
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
            <button className="ap__back-btn" onClick={() => navigate('/faculty-dashboard')}>
              <ArrowLeft size={18} /> Back
            </button>
            <p className="ap__eyebrow">Faculty &bull; Security</p>
            <h1 className="ap__title"><ShieldAlert size={26} style={{ verticalAlign: 'middle', marginRight: 8 }} />Suspicious Activity Log</h1>
            <p className="ap__subtitle">Review and manage flagged attendance attempts</p>
          </div>
        </header>

        {/* Stats chips */}
        {!loading && activities.length > 0 && (
          <div className="ap__stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
            {Object.entries(counts).map(([type, cnt]) => {
              const m = getMeta(type);
              return (
                <div
                  key={type}
                  className="ap__stat"
                  onClick={() => setFilterType((p) => (p === type ? 'all' : type))}
                  style={{ cursor: 'pointer', outline: filterType === type ? '2px solid var(--accent)' : 'none', outlineOffset: -2, borderRadius: 12 }}
                >
                  <span className="ap__stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{m.icon} {m.label}</span>
                  <span className="ap__stat-value">{cnt}</span>
                </div>
              );
            })}
            <div className="ap__stat">
              <span className="ap__stat-label">Total Visible</span>
              <span className="ap__stat-value">{visible.length}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        {!loading && !error && activities.length > 0 && (
          <div className="ap__panel" style={{ marginBottom: '1.25rem' }}>
            <div style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <select className="ap__select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="duplicate_attendance">Duplicate Attendance</option>
                <option value="unauthorized_attempt">Unauthorized Attempts</option>
                <option value="invalid_qr">Invalid QR</option>
                <option value="failed_login">Failed Login</option>
                <option value="system_error">System Errors</option>
              </select>
              <select className="ap__select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
              </select>
              <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                <strong>{visible.length}</strong> record{visible.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="ap__panel" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)', marginBottom: 12 }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading activities…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, color: '#ef4444', marginBottom: '1.25rem' }}>
            <XCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />{error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && visible.length === 0 && (
          <div className="ap__panel">
            <div className="ap__empty">
              <CheckCircle size={48} className="ap__empty-icon" style={{ color: '#10b981' }} />
              <p className="ap__empty-title" style={{ color: '#10b981' }}>
                {filterType === 'all' ? 'No suspicious activities detected!' : 'No records for this filter'}
              </p>
              <p className="ap__empty-text">
                {filterType === 'all' ? 'All attendance attempts appear legitimate.' : 'Try changing the filter to see other records.'}
              </p>
            </div>
          </div>
        )}

        {/* Activity Table */}
        {!loading && !error && visible.length > 0 && (
          <div className="ap__panel">
            <div className="ap__table-wrap">
              <table className="ap__table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Student</th>
                    <th>Subject / Action</th>
                    <th>Details</th>
                    <th>Time</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {visible.map((a) => {
                      const m = getMeta(a.type);
                      return (
                        <motion.tr
                          key={a.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <td>
                            <span className={m.badge} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {m.icon} {m.label}
                            </span>
                          </td>
                          <td>
                            {a.studentName ? (
                              <div>
                                <div className="ap__user-name">{a.studentName}</div>
                                {a.studentEmail && <div className="ap__user-sub">{a.studentEmail}</div>}
                              </div>
                            ) : '—'}
                          </td>
                          <td>
                            {a.subject || a.action || a.path || '—'}
                            {a.statusCode && <span className="ap__badge ap__badge--inactive" style={{ marginLeft: 6 }}>HTTP {a.statusCode}</span>}
                          </td>
                          <td>
                            {a.attemptCount && <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{a.attemptCount}× attempts</span>}
                            {a.ipAddress && <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>IP: {a.ipAddress}</div>}
                            {a.firstAttempt && a.lastAttempt && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{fmtDate(a.firstAttempt)} → {fmtDate(a.lastAttempt)}</div>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{fmtDate(a.createdAt)}</td>
                          <td>
                            <button className="ap__btn ap__btn--ghost" onClick={() => handleDismiss(a.id)} title="Dismiss" style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}>
                              <Check size={14} /> Dismiss
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FacultySuspiciousActivity;
