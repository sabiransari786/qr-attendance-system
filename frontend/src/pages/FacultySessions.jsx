import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, MapPin, Clock, Circle, Pencil, Trash2, Lock, XCircle, Search, X, CheckCircle, Calendar, Loader, Plus, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import { fadeInUp, staggerContainer } from '../animations/animationConfig';
import '../styles/dashboard.css';
import '../styles/admin-pages.css';

/* ═══ Modal Overlay Helper (defined outside to avoid re-mount on every render) ═══ */
const ModalOverlay = ({ children, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={onClose}>
    <div className="ap__panel" style={{ width: '100%', maxWidth: '520px', margin: 0 }} onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

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
  const [closeLoading, setCloseLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [editError, setEditError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [closeError, setCloseError] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [newSession, setNewSession] = useState({ subject: '', location: '', startTime: '', duration: 60, courseId: '' });
  const [courseSearch, setCourseSearch] = useState('');
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [editSession, setEditSession] = useState({ subject: '', location: '', startTime: '', duration: 60 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/session`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
          const allSessions = data.data || data || [];
          setSessions(allSessions);
        } else { setError('Failed to fetch sessions'); }
      } catch (err) { console.error('Error fetching sessions:', err); setError('Error loading sessions'); }
      finally { setLoading(false); }
    };
    if (token && user?.id) fetchSessions();
  }, [token, user?.id]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/faculty/my-courses`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) { const data = await response.json(); setCourses(data.data || []); }
      } catch (err) { console.error('Error fetching courses:', err); }
    };
    if (token) fetchCourses();
  }, [token]);

  const formatDate = (dateString) => new Date(dateString).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleGenerateQR = (sessionId) => navigate(`/faculty/qr-generation?sessionId=${sessionId}`);

  const handleOpenEdit = (session) => {
    const date = new Date(session.startTime);
    const localIso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEditSession({ subject: session.subject, location: session.location, startTime: localIso, duration: session.duration || 60 });
    setSelectedSession(session); setEditError(null); setShowEditModal(true);
  };

  const handleEditSession = async (e) => {
    e.preventDefault(); setEditLoading(true); setEditError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/session/${selectedSession.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ subject: editSession.subject.trim(), location: editSession.location.trim(), startTime: editSession.startTime, duration: parseInt(editSession.duration) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update session');
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? data.data : s));
      setShowEditModal(false); setSelectedSession(null);
    } catch (err) { setEditError(err.message); } finally { setEditLoading(false); }
  };

  const handleOpenDelete = (session) => { setSelectedSession(session); setDeleteError(null); setShowDeleteModal(true); };
  const handleOpenClose = (session) => { setSelectedSession(session); setCloseError(null); setShowCloseModal(true); };
  const handleOpenCancel = (session) => { setSelectedSession(session); setCancelReason(''); setCancelError(null); setShowCancelModal(true); };

  const handleCloseSession = async () => {
    setCloseLoading(true); setCloseError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/session/${selectedSession.id}/close`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to close session');
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? { ...s, status: 'closed' } : s));
      setShowCloseModal(false); setSelectedSession(null);
    } catch (err) { setCloseError(err.message); } finally { setCloseLoading(false); }
  };

  const handleCancelSession = async () => {
    setCancelLoading(true); setCancelError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/session/${selectedSession.id}/cancel`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ reason: cancelReason.trim() || 'Cancelled by faculty' }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to cancel session');
      setSessions(prev => prev.map(s => s.id === selectedSession.id ? { ...s, status: 'cancelled' } : s));
      setShowCancelModal(false); setSelectedSession(null);
    } catch (err) { setCancelError(err.message); } finally { setCancelLoading(false); }
  };

  const handleDeleteSession = async () => {
    setDeleteLoading(true); setDeleteError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/session/${selectedSession.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete session');
      setSessions(prev => prev.filter(s => s.id !== selectedSession.id));
      setShowDeleteModal(false); setSelectedSession(null);
    } catch (err) { setDeleteError(err.message); } finally { setDeleteLoading(false); }
  };

  const handleOpenCreate = () => {
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setNewSession({ subject: '', location: '', startTime: localIso, duration: 60, courseId: '' });
    setCourseSearch(''); setShowCourseDropdown(false); setCreateError(null); setShowCreateModal(true);
  };

  const handleCreateSession = async (e) => {
    e.preventDefault(); setCreateLoading(true); setCreateError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/session`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ subject: newSession.subject.trim(), location: newSession.location.trim(), startTime: newSession.startTime, duration: parseInt(newSession.duration), courseId: newSession.courseId ? parseInt(newSession.courseId) : undefined }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create session');
      setSessions(prev => [data.data, ...prev]);
      setShowCreateModal(false);
    } catch (err) { setCreateError(err.message); } finally { setCreateLoading(false); }
  };

  const filtered = sessions.filter(s => {
    const matchSearch = s.subject?.toLowerCase().includes(searchTerm.toLowerCase()) || s.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = { all: sessions.length, active: sessions.filter(s => s.status === 'active').length, closed: sessions.filter(s => s.status === 'closed').length, cancelled: sessions.filter(s => s.status === 'cancelled').length };

  return (
    <motion.div className="dashboard ap" variants={staggerContainer} initial="hidden" animate="visible">
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>
      <div className="ap__inner">
        {/* Header */}
        <motion.div className="ap__header" variants={fadeInUp}>
          <div className="ap__header-left">
            <button className="ap__back-btn" onClick={() => navigate('/faculty-dashboard')}><ArrowLeft size={16} /> Back</button>
            <div>
              <p className="ap__eyebrow">Faculty</p>
              <h1 className="ap__title">Class Sessions</h1>
              <p className="ap__subtitle">Manage and monitor all your class sessions</p>
            </div>
          </div>
          <div className="ap__header-actions">
            <button className="ap__btn ap__btn--primary" onClick={handleOpenCreate}><Plus size={16} /> New Session</button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div className="ap__stats" variants={fadeInUp}>
          {[
            { label: 'Total', value: statusCounts.all, color: '#319cb5' },
            { label: 'Active', value: statusCounts.active, color: '#10b981' },
            { label: 'Closed', value: statusCounts.closed, color: '#ef4444' },
            { label: 'Cancelled', value: statusCounts.cancelled, color: '#f59e0b' },
          ].map((s, i) => (
            <div className="ap__stat" key={i}>
              <p className="ap__stat-label">{s.label}</p>
              <p className="ap__stat-value" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div className="ap__panel" variants={fadeInUp}>
          <div className="ap__filters">
            <input className="ap__search" placeholder="Search sessions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <select className="ap__select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div className="ap__empty"><Loader size={24} className="ap__empty-icon" style={{ animation: 'spin 1s linear infinite' }} /><p className="ap__empty-title">Loading sessions...</p></div>
          ) : error ? (
            <div className="ap__empty"><XCircle size={24} style={{ color: '#ef4444' }} /><p className="ap__empty-title" style={{ color: '#ef4444' }}>{error}</p></div>
          ) : filtered.length === 0 ? (
            <div className="ap__empty"><div className="ap__empty-icon"><BookOpen size={48} /></div><h3 className="ap__empty-title">No sessions found</h3><p className="ap__empty-text">{sessions.length === 0 ? "You haven't created any sessions yet." : 'No sessions match your filter.'}</p></div>
          ) : (
            <div className="ap__table-wrap">
              <table className="ap__table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Location</th>
                    <th>Start Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(session => (
                    <tr key={session.id}>
                      <td>
                        <div className="ap__user-name">{session.subject}</div>
                        {session.course?.name && <div className="ap__user-sub">{session.course.name} ({session.course.code})</div>}
                      </td>
                      <td><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', opacity: 0.6 }} />{session.location}</td>
                      <td>{formatDate(session.startTime)}</td>
                      <td><span className={`ap__badge ap__badge--${session.status === 'active' ? 'active' : session.status === 'cancelled' ? 'warn' : 'inactive'}`}>{session.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button className="ap__btn ap__btn--primary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }} onClick={() => handleGenerateQR(session.id)} disabled={session.status !== 'active'}>QR</button>
                          <button className="ap__btn ap__btn--outline" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }} onClick={() => handleOpenEdit(session)} disabled={session.status !== 'active'}><Pencil size={13} /></button>
                          {session.status === 'active' && <>
                            <button className="ap__btn ap__btn--ghost" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }} onClick={() => handleOpenClose(session)}><Lock size={13} /></button>
                            <button className="ap__btn ap__btn--ghost" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', color: '#f59e0b' }} onClick={() => handleOpenCancel(session)}><XCircle size={13} /></button>
                          </>}
                          <button className="ap__btn ap__btn--danger" style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }} onClick={() => handleOpenDelete(session)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Create Session Modal ── */}
      {showCreateModal && (
        <ModalOverlay onClose={() => setShowCreateModal(false)}>
          <h2 className="ap__panel-title" style={{ marginBottom: '1.25rem' }}>Create New Session</h2>
          <form onSubmit={handleCreateSession}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ position: 'relative' }} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setShowCourseDropdown(false); }}>
                <div className="ap__search" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.75rem', cursor: 'text' }} onClick={() => setShowCourseDropdown(true)}>
                  <Search size={16} style={{ opacity: 0.6 }} />
                  <input type="text" placeholder={newSession.courseId ? courses.find(c => c.id === parseInt(newSession.courseId))?.name || 'Search course...' : 'Search course...'} value={courseSearch} onChange={e => { setCourseSearch(e.target.value); setShowCourseDropdown(true); }} onFocus={() => setShowCourseDropdown(true)} style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontSize: '0.9rem', color: 'var(--color-text)' }} />
                  {newSession.courseId && <button type="button" onClick={e => { e.stopPropagation(); setNewSession(p => ({ ...p, courseId: '', subject: '' })); setCourseSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={14} /></button>}
                </div>
                {newSession.courseId && (() => { const sel = courses.find(c => c.id === parseInt(newSession.courseId)); return sel ? <div style={{ marginTop: '0.4rem', padding: '0.4rem 0.75rem', background: 'rgba(49,156,181,0.12)', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600 }}><CheckCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />{sel.name} ({sel.code}){sel.semester ? ` · Sem ${sel.semester}` : ''} — {sel.department_name}</div> : null; })()}
                {showCourseDropdown && <>
                  <div tabIndex={-1} style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--color-surface)', border: '1px solid rgba(49,156,181,0.25)', borderRadius: '10px', maxHeight: '220px', overflowY: 'auto', zIndex: 11, boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}>
                    {(() => {
                      const q = courseSearch.toLowerCase();
                      const filtered = courses.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.department_name || '').toLowerCase().includes(q) || (c.semester ? `sem ${c.semester}`.includes(q) || `semester ${c.semester}`.includes(q) : false));
                      if (filtered.length === 0) return <div style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>No courses found</div>;
                      const bySem = filtered.reduce((acc, c) => { const key = c.semester ? `Semester ${c.semester}` : 'General'; if (!acc[key]) acc[key] = []; acc[key].push(c); return acc; }, {});
                      return Object.entries(bySem).map(([semLabel, items]) => (
                        <div key={semLabel}>
                          <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(49,156,181,0.08)', letterSpacing: '0.05em', textTransform: 'uppercase' }}><Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />{semLabel}</div>
                          {items.map(c => (
                            <div key={c.id} onClick={() => { setNewSession(p => ({ ...p, courseId: String(c.id), subject: `${c.name} (${c.code})` })); setCourseSearch(''); setShowCourseDropdown(false); }} style={{ padding: '0.55rem 1rem', cursor: 'pointer', fontSize: '0.9rem', background: newSession.courseId === String(c.id) ? 'rgba(49,156,181,0.15)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(49,156,181,0.1)'} onMouseLeave={e => e.currentTarget.style.background = newSession.courseId === String(c.id) ? 'rgba(49,156,181,0.15)' : 'transparent'}>
                              <span style={{ fontWeight: 600 }}>{c.name}</span> <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>({c.code})</span>
                              <span style={{ float: 'right', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{c.department_name}</span>
                            </div>
                          ))}
                        </div>
                      ));
                    })()}
                  </div>
                </>}
              </div>
              <input type="text" required value={newSession.courseId} onChange={() => {}} style={{ display: 'none' }} />
              <input className="ap__search" placeholder="Location" value={newSession.location} onChange={e => setNewSession(p => ({ ...p, location: e.target.value }))} onFocus={() => setShowCourseDropdown(false)} required />
              <input className="ap__search" type="datetime-local" value={newSession.startTime} onChange={e => setNewSession(p => ({ ...p, startTime: e.target.value }))} onFocus={() => setShowCourseDropdown(false)} required />
              <input className="ap__search" type="number" min="1" max="240" placeholder="Duration (minutes)" value={newSession.duration} onChange={e => setNewSession(p => ({ ...p, duration: e.target.value }))} onFocus={() => setShowCourseDropdown(false)} required />
              {createError && <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{createError}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="ap__btn ap__btn--ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="submit" className="ap__btn ap__btn--primary" disabled={createLoading}>{createLoading ? 'Creating...' : 'Create Session'}</button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* ── Edit Session Modal ── */}
      {showEditModal && selectedSession && (
        <ModalOverlay onClose={() => { setShowEditModal(false); setSelectedSession(null); }}>
          <h2 className="ap__panel-title" style={{ marginBottom: '1.25rem' }}>Edit Session</h2>
          <form onSubmit={handleEditSession}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input className="ap__search" placeholder="Subject" value={editSession.subject} onChange={e => setEditSession(p => ({ ...p, subject: e.target.value }))} required />
              <input className="ap__search" placeholder="Location" value={editSession.location} onChange={e => setEditSession(p => ({ ...p, location: e.target.value }))} required />
              <input className="ap__search" type="datetime-local" value={editSession.startTime} onChange={e => setEditSession(p => ({ ...p, startTime: e.target.value }))} required />
              <input className="ap__search" type="number" min="1" max="240" placeholder="Duration" value={editSession.duration} onChange={e => setEditSession(p => ({ ...p, duration: e.target.value }))} required />
              {editError && <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{editError}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className="ap__btn ap__btn--ghost" onClick={() => { setShowEditModal(false); setSelectedSession(null); }}>Cancel</button>
              <button type="submit" className="ap__btn ap__btn--primary" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* ── Close Session Modal ── */}
      {showCloseModal && selectedSession && (
        <ModalOverlay onClose={() => { setShowCloseModal(false); setSelectedSession(null); }}>
          <h2 className="ap__panel-title" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={20} style={{ color: '#6366f1' }} /> Close Session</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>Close <strong>"{selectedSession.subject}"</strong>? No more QR scans will be accepted.</p>
          {closeError && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem' }}>{closeError}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="ap__btn ap__btn--ghost" onClick={() => { setShowCloseModal(false); setSelectedSession(null); }} disabled={closeLoading}>Back</button>
            <button className="ap__btn ap__btn--primary" onClick={handleCloseSession} disabled={closeLoading}>{closeLoading ? 'Closing...' : 'Close Session'}</button>
          </div>
        </ModalOverlay>
      )}

      {/* ── Cancel Session Modal ── */}
      {showCancelModal && selectedSession && (
        <ModalOverlay onClose={() => { setShowCancelModal(false); setSelectedSession(null); }}>
          <h2 className="ap__panel-title" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}><XCircle size={20} /> Cancel Class</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>Cancel <strong>"{selectedSession.subject}"</strong>? Students who already scanned will be marked <strong>Excused</strong>.</p>
          <textarea className="ap__search" placeholder="Reason for cancellation (optional)" value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} style={{ resize: 'vertical', width: '100%', boxSizing: 'border-box', marginBottom: '1rem' }} />
          {cancelError && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem' }}>{cancelError}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="ap__btn ap__btn--ghost" onClick={() => { setShowCancelModal(false); setSelectedSession(null); }} disabled={cancelLoading}>Back</button>
            <button className="ap__btn ap__btn--danger" onClick={handleCancelSession} disabled={cancelLoading}>{cancelLoading ? 'Cancelling...' : 'Cancel Class'}</button>
          </div>
        </ModalOverlay>
      )}

      {/* ── Delete Session Modal ── */}
      {showDeleteModal && selectedSession && (
        <ModalOverlay onClose={() => { setShowDeleteModal(false); setSelectedSession(null); }}>
          <h2 className="ap__panel-title" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}><Trash2 size={20} /> Delete Session</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>Are you sure you want to delete <strong>"{selectedSession.subject}"</strong>? This action cannot be undone.</p>
          {deleteError && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem' }}>{deleteError}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="ap__btn ap__btn--ghost" onClick={() => { setShowDeleteModal(false); setSelectedSession(null); }} disabled={deleteLoading}>Cancel</button>
            <button className="ap__btn ap__btn--danger" onClick={handleDeleteSession} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
          </div>
        </ModalOverlay>
      )}
    </motion.div>
  );
}

export default FacultySessions;
