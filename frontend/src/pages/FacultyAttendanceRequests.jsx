/**
 * Faculty Attendance Requests — ap__* unified design
 */

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XCircle, CheckCircle, Loader, ClipboardList, AlertTriangle,
  Inbox, BookOpen, MapPin, Calendar, X, Check, ArrowLeft, Search,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import '../styles/dashboard.css';
import '../styles/admin-pages.css';

/* ── Toast ────────────────────────────────────────────────────────────── */
const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
      background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff',
      padding: '0.85rem 1.5rem', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: 420,
    }}>
      {toast.type === 'error' ? <X size={16} /> : <Check size={16} />}
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
    </div>
  );
};

/* ── Reject Modal ─────────────────────────────────────────────────────── */
function RejectModal({ request, onConfirm, onClose }) {
  const [note, setNote] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="ap__panel"
        style={{ width: '100%', maxWidth: 440 }}
      >
        <div className="ap__panel-header">
          <h2 className="ap__panel-title" style={{ color: '#ef4444' }}><XCircle size={18} /> Reject Request</h2>
        </div>
        <div style={{ padding: '1.25rem' }}>
          <p style={{ margin: '0 0 1rem', color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
            Rejecting request for <strong>{request.student_name}</strong> — <em>{request.subject}</em>
          </p>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Reason (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. You were not present during the session."
            rows={3}
            maxLength={500}
            className="ap__search"
            style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', minHeight: 80 }}
          />
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="ap__btn ap__btn--outline" onClick={onClose}>Cancel</button>
            <button className="ap__btn ap__btn--danger" onClick={() => onConfirm(note)}>Reject</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Status helpers ───────────────────────────────────────────────────── */
const STATUS_TABS = ['pending', 'approved', 'rejected', 'all'];
const badgeClass = (s) => {
  if (s === 'approved') return 'ap__badge ap__badge--active';
  if (s === 'rejected') return 'ap__badge ap__badge--error';
  if (s === 'pending')  return 'ap__badge ap__badge--warn';
  return 'ap__badge ap__badge--inactive';
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── Main ─────────────────────────────────────────────────────────────── */
export default function FacultyAttendanceRequests() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [statusTab, setStatusTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [search, setSearch] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchRequests = async (status = statusTab) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/manual-requests/faculty?status=${status}`, { headers });
      const data = await res.json();
      if (data.success) setRequests(data.data || []);
    } catch {
      showToast('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(statusTab); }, [statusTab]);

  const handleApprove = async (id) => {
    setActionLoading(`approve-${id}`);
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/manual-request/${id}/approve`, { method: 'PATCH', headers });
      const data = await res.json();
      if (data.success) { showToast('Attendance approved and marked as Present!'); fetchRequests(); }
      else showToast(data.message || 'Failed to approve', 'error');
    } catch { showToast('Server error', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id, note) => {
    setRejectTarget(null);
    setActionLoading(`reject-${id}`);
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/manual-request/${id}/reject`, { method: 'PATCH', headers, body: JSON.stringify({ note }) });
      const data = await res.json();
      if (data.success) { showToast('Request rejected.'); fetchRequests(); }
      else showToast(data.message || 'Failed to reject', 'error');
    } catch { showToast('Server error', 'error'); }
    finally { setActionLoading(null); }
  };

  const filtered = requests.filter(
    (r) => !search || r.student_name?.toLowerCase().includes(search.toLowerCase()) || r.student_roll?.toLowerCase().includes(search.toLowerCase()) || r.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <div className="ap">
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
      {rejectTarget && (
        <RejectModal request={rejectTarget} onConfirm={(note) => handleReject(rejectTarget.id, note)} onClose={() => setRejectTarget(null)} />
      )}

      <div className="ap__inner">
        {/* Header */}
        <header className="ap__header">
          <div className="ap__header-left">
            <button className="ap__back-btn" onClick={() => navigate('/faculty-dashboard')}>
              <ArrowLeft size={18} /> Back
            </button>
            <p className="ap__eyebrow">Faculty &bull; Requests</p>
            <h1 className="ap__title">
              <ClipboardList size={26} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Student Attendance Requests
            </h1>
            <p className="ap__subtitle">
              Review and approve or reject manual attendance requests
              {pendingCount > 0 && statusTab !== 'pending' && (
                <span style={{ marginLeft: 12, color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem' }}>
                  <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  {pendingCount} pending
                </span>
              )}
            </p>
          </div>
        </header>

        {/* Stats */}
        <div className="ap__stats">
          {STATUS_TABS.map((s) => {
            const count = s === 'all' ? requests.length : requests.filter((r) => r.status === s).length;
            return (
              <div
                key={s}
                className="ap__stat"
                onClick={() => setStatusTab(s)}
                style={{ cursor: 'pointer', outline: statusTab === s ? '2px solid var(--accent)' : 'none', outlineOffset: -2, borderRadius: 12 }}
              >
                <span className="ap__stat-label" style={{ textTransform: 'capitalize' }}>{s}</span>
                <span className="ap__stat-value">{loading ? '…' : count}</span>
              </div>
            );
          })}
        </div>

        {/* Table Panel */}
        <div className="ap__panel">
          {/* Search */}
          <div className="ap__filters" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
              <input className="ap__search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student / subject…" style={{ paddingLeft: 36 }} />
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              <strong>{filtered.length}</strong> request{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>Loading…</p>
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="ap__empty">
              <Inbox size={48} className="ap__empty-icon" />
              <p className="ap__empty-title">{search ? 'No requests match your search' : `No ${statusTab === 'all' ? '' : statusTab} requests`}</p>
              <p className="ap__empty-text">
                {search ? 'Try a different search term.' : 'All caught up!'}
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && filtered.length > 0 && (
            <div className="ap__table-wrap">
              <table className="ap__table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Session Info</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((r) => {
                      const isApproving = actionLoading === `approve-${r.id}`;
                      const isRejecting = actionLoading === `reject-${r.id}`;
                      return (
                        <motion.tr
                          key={r.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <td>
                            <div className="ap__user-name">{r.student_name}</div>
                            {r.student_roll && <div className="ap__user-sub">{r.student_roll}</div>}
                            {r.student_email && <div className="ap__user-sub">{r.student_email}</div>}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.85rem' }}>
                              <span><BookOpen size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /><strong>{r.subject}</strong></span>
                              <span style={{ color: 'var(--color-text-secondary)' }}><MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{r.location}</span>
                              <span style={{ color: 'var(--color-text-secondary)' }}><Calendar size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{fmtDate(r.start_time)}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ maxWidth: 240, fontSize: '0.85rem', lineHeight: 1.4 }}>
                              {r.reason}
                              {r.rejection_note && (
                                <div style={{ marginTop: 6, padding: '0.4rem 0.6rem', background: 'rgba(239,68,68,0.08)', borderLeft: '3px solid #ef4444', borderRadius: 4, fontSize: '0.8rem' }}>
                                  <span style={{ opacity: 0.6, fontSize: '0.72rem' }}>Rejection note: </span>{r.rejection_note}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={badgeClass(r.status)} style={{ textTransform: 'capitalize' }}>{r.status}</span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.83rem' }}>
                            {fmtDate(r.created_at)}
                            {r.reviewed_at && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>Reviewed: {fmtDate(r.reviewed_at)}</div>
                            )}
                          </td>
                          <td>
                            {r.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  className="ap__btn ap__btn--danger"
                                  onClick={() => setRejectTarget(r)}
                                  disabled={isRejecting || isApproving}
                                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
                                >
                                  {isRejecting ? '…' : <><X size={13} /> Reject</>}
                                </button>
                                <button
                                  className="ap__btn ap__btn--primary"
                                  onClick={() => handleApprove(r.id)}
                                  disabled={isApproving || isRejecting}
                                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
                                >
                                  {isApproving ? '…' : <><Check size={13} /> Approve</>}
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>—</span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
