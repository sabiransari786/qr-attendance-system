/**
 * StudentAttendanceRequest — ap__* unified design
 */

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Send, ScrollText, AlertTriangle, Inbox,
  Calendar, UserCheck, ArrowLeft, CheckCircle, XCircle, Loader, X,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import '../styles/dashboard.css';
import '../styles/admin-pages.css';

/* ── Toast ─────────────────────────────────────────────────── */
const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      style={{
        position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
        background: toast.type === 'error' ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#319cb5,#2980a8)',
        color: '#fff', padding: '0.85rem 1.5rem', borderRadius: 14,
        boxShadow: '0 8px 32px rgba(49,156,181,0.3)', fontSize: '0.95rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: 380, backdropFilter: 'blur(12px)',
      }}
    >
      {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
    </motion.div>
  );
};

const STATUS_CFG = {
  pending:  { label: 'Pending',  cls: 'ap__badge--warn' },
  approved: { label: 'Approved', cls: 'ap__badge--active' },
  rejected: { label: 'Rejected', cls: 'ap__badge--error' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function StudentAttendanceRequest() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [tab, setTab] = useState('new');
  const [sessions, setSessions] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedSession, setSelectedSession] = useState('');
  const [reason, setReason] = useState('');

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 5000); };
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try { const res = await fetch(`${API_BASE_URL}/attendance/requestable-sessions`, { headers }); const d = await res.json(); if (d.success) setSessions(d.data || []); }
    catch { showToast('Failed to load sessions', 'error'); }
    finally { setLoadingSessions(false); }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try { const res = await fetch(`${API_BASE_URL}/attendance/manual-requests/student`, { headers }); const d = await res.json(); if (d.success) setMyRequests(d.data || []); }
    catch { showToast('Failed to load request history', 'error'); }
    finally { setLoadingHistory(false); }
  };

  useEffect(() => { fetchSessions(); fetchHistory(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSession) { showToast('Please select a session', 'error'); return; }
    if (!reason.trim() || reason.trim().length < 10) { showToast('Please provide a reason (min 10 characters)', 'error'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/manual-request`, { method: 'POST', headers, body: JSON.stringify({ session_id: Number(selectedSession), reason: reason.trim() }) });
      const d = await res.json();
      if (d.success) { showToast('Attendance request sent to teacher successfully!'); setSelectedSession(''); setReason(''); fetchSessions(); fetchHistory(); setTab('history'); }
      else showToast(d.message || 'Failed to submit request', 'error');
    } catch { showToast('Server error. Please try again.', 'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="ap">
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>

      <AnimatePresence>{toast && <Toast toast={toast} onClose={() => setToast(null)} />}</AnimatePresence>

      <div className="ap__inner" style={{ maxWidth: 780 }}>
        {/* Header */}
        <header className="ap__header">
          <div className="ap__header-left">
            <button className="ap__back-btn" onClick={() => navigate('/student-dashboard')}>
              <ArrowLeft size={18} /> Back
            </button>
            <p className="ap__eyebrow">Student &bull; Request</p>
            <h1 className="ap__title"><ClipboardList size={26} style={{ verticalAlign: 'middle', marginRight: 8 }} />Attendance Request</h1>
            <p className="ap__subtitle">Couldn't scan QR? Send a request to your teacher for manual attendance.</p>
          </div>
        </header>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[
            { key: 'new', icon: <Send size={14} />, label: 'New Request' },
            { key: 'history', icon: <ScrollText size={14} />, label: `My Requests (${myRequests.length})` },
          ].map((t) => (
            <button
              key={t.key}
              className={`ap__btn ${tab === t.key ? 'ap__btn--primary' : 'ap__btn--ghost'}`}
              onClick={() => setTab(t.key)}
              style={{ gap: 5 }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── New Request ────────────────────────────────────────── */}
          {tab === 'new' && (
            <motion.div key="new" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <div className="ap__panel">
                <div className="ap__panel-header">
                  <h2 className="ap__panel-title"><Send size={18} /> Send Attendance Request</h2>
                  <span className="ap__badge ap__badge--active">New</span>
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    Select the session you attended and briefly explain why you couldn't scan the QR.
                  </p>

                  {loadingSessions ? (
                    <div className="ap__empty">
                      <div className="spinner" style={{ width: 40, height: 40 }} />
                      <p className="ap__empty-text">Loading available sessions…</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                      {/* Session */}
                      <div>
                        <label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem', fontWeight: 600 }}>Select Session *</label>
                        {sessions.length === 0 ? (
                          <div style={{ padding: '0.85rem 1rem', borderRadius: 10, background: 'rgba(49,156,181,0.06)', border: '1px solid rgba(49,156,181,0.15)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: 4, color: '#319cb5' }} />
                            No sessions available for requesting right now.
                          </div>
                        ) : (
                          <select className="ap__select" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} required style={{ width: '100%' }}>
                            <option value="">— Select a session —</option>
                            {sessions.map((s) => <option key={s.id} value={s.id}>{s.subject} | {s.location} | {fmtDate(s.start_time)} | {s.faculty_name}</option>)}
                          </select>
                        )}
                      </div>

                      {/* Reason */}
                      <div>
                        <label style={{ display: 'block', marginBottom: 5, fontSize: '0.85rem', fontWeight: 600 }}>
                          Reason * <span style={{ opacity: 0.5, fontWeight: 400 }}>(min 10 characters)</span>
                        </label>
                        <textarea
                          className="ap__search"
                          value={reason} onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g. I was present in class but couldn't scan the QR code due to poor network."
                          required maxLength={500} rows={4}
                          style={{ resize: 'vertical', lineHeight: 1.5, width: '100%', boxSizing: 'border-box' }}
                        />
                        <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', opacity: 0.5, textAlign: 'right' }}>{reason.length}/500</p>
                      </div>

                      {/* Info */}
                      <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(49,156,181,0.06)', border: '1px solid rgba(49,156,181,0.15)', fontSize: '0.82rem', lineHeight: 1.55, color: 'var(--color-text-secondary)' }}>
                        <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4, color: '#319cb5' }} />
                        Your teacher will review this request. If approved, your attendance will be marked as <strong>Present</strong>.
                      </div>

                      <button
                        type="submit" disabled={submitting || sessions.length === 0}
                        className="ap__btn ap__btn--primary"
                        style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700, gap: 6 }}
                      >
                        {submitting ? <><Loader size={14} /> Sending…</> : <><Send size={14} /> Send Request to Teacher</>}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── History ────────────────────────────────────────────── */}
          {tab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {loadingHistory ? (
                <div className="ap__panel" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ width: 40, height: 40 }} />
                  <p style={{ color: 'var(--color-text-secondary)', marginTop: 12 }}>Loading…</p>
                </div>
              ) : myRequests.length === 0 ? (
                <div className="ap__empty">
                  <span className="ap__empty-icon"><Inbox size={40} /></span>
                  <p className="ap__empty-title">No requests submitted yet</p>
                  <p className="ap__empty-text">Your request history will appear here</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {myRequests.map((r, idx) => {
                    const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending;
                    return (
                      <motion.div
                        key={r.id} className="ap__panel"
                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06, type: 'spring', stiffness: 260, damping: 24 }}
                        style={{ padding: '1.1rem 1.25rem' }}
                      >
                        {/* Top */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.55rem' }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{r.subject}</span>
                            <span style={{ marginLeft: '0.6rem', opacity: 0.6, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{r.location}</span>
                          </div>
                          <span className={`ap__badge ${cfg.cls}`}>{cfg.label}</span>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                          <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          Session: {fmtDate(r.start_time)} &nbsp;|&nbsp;
                          <UserCheck size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{r.faculty_name}
                        </div>

                        {/* Reason */}
                        <div style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', background: 'rgba(49,156,181,0.04)', border: '1px solid rgba(49,156,181,0.08)', borderRadius: 10, marginBottom: r.rejection_note ? '0.5rem' : 0 }}>
                          <span style={{ opacity: 0.6, fontSize: '0.78rem' }}>Your reason: </span>{r.reason}
                        </div>

                        {r.rejection_note && (
                          <div style={{ fontSize: '0.83rem', padding: '0.45rem 0.75rem', background: 'rgba(239,68,68,0.06)', borderRadius: 10, borderLeft: '3px solid #ef4444' }}>
                            <span style={{ opacity: 0.6, fontSize: '0.78rem' }}>Teacher note: </span>{r.rejection_note}
                          </div>
                        )}

                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)', opacity: 0.6 }}>
                          Submitted: {fmtDate(r.created_at)}
                          {r.reviewed_at && ` · Reviewed: ${fmtDate(r.reviewed_at)}`}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
