/**
 * AttendanceHistory — ap__* unified design
 */

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check, X, Clock, ScrollText, ArrowLeft, Filter, CheckCircle,
  XCircle, BookOpen, BarChart3,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import '../styles/dashboard.css';
import '../styles/admin-pages.css';

const STATUS_BADGE = {
  present: 'ap__badge--active',
  absent:  'ap__badge--error',
  late:    'ap__badge--warn',
};

function AttendanceHistory() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({ subject: 'all', status: 'all', dateFrom: '', dateTo: '' });

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  useEffect(() => { fetchHistory(); }, []);
  useEffect(() => { applyFilters(); }, [filters, records]);

  /* ── Fetch ─────────────────────────────────────────────────── */
  const fetchHistory = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      const stored = sessionStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : null;
      const userId = authContext?.user?.id || parsed?.id;
      if (!token || !userId) { navigate('/login'); return; }

      const res = await fetch(`${API_BASE_URL}/attendance/student/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.data || []).map((r) => ({
          id: r.id,
          subject: r.subject || 'Unknown Subject',
          date: r.marked_at ? r.marked_at.split('T')[0] : r.session_start_time ? r.session_start_time.split('T')[0] : '-',
          time: r.session_start_time ? new Date(r.session_start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
          status: r.status,
          markedAt: r.marked_at ? new Date(r.marked_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
          faculty: r.faculty_name || '-',
          location: r.location || '-',
        }));
        setRecords(mapped);
        setSubjects([...new Set(mapped.map((r) => r.subject))]);
      } else {
        loadFallback();
      }
    } catch { loadFallback(); }
    finally { setLoading(false); }
  };

  const loadFallback = () => {
    const d = (n) => new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const sample = [
      { id: 1, subject: 'Data Structures', date: today, time: '10:00 AM', status: 'present', markedAt: '10:05 AM', faculty: 'Teacher', location: 'Room 301' },
      { id: 2, subject: 'Database Management', date: d(1), time: '10:00 AM', status: 'present', markedAt: '10:04 AM', faculty: 'Test Faculty', location: 'Room 302' },
      { id: 3, subject: 'Algorithm Design', date: d(1), time: '02:00 PM', status: 'late', markedAt: '02:10 PM', faculty: 'Prof. Kumar', location: 'Room 303' },
      { id: 4, subject: 'Operating Systems', date: d(2), time: '10:00 AM', status: 'present', markedAt: '10:02 AM', faculty: 'Teacher', location: 'Lab 101' },
      { id: 5, subject: 'Data Structures', date: d(2), time: '01:00 PM', status: 'present', markedAt: '01:03 PM', faculty: 'Teacher', location: 'Room 301' },
      { id: 6, subject: 'Web Development', date: d(3), time: '09:00 AM', status: 'absent', markedAt: '-', faculty: 'Teacher', location: 'Lab 201' },
      { id: 7, subject: 'Database Management', date: d(3), time: '02:00 PM', status: 'present', markedAt: '02:05 PM', faculty: 'Test Faculty', location: 'Room 302' },
      { id: 8, subject: 'Operating Systems', date: d(4), time: '10:00 AM', status: 'present', markedAt: '10:03 AM', faculty: 'Teacher', location: 'Lab 101' },
      { id: 9, subject: 'Algorithm Design', date: d(4), time: '01:00 PM', status: 'present', markedAt: '01:04 PM', faculty: 'Prof. Kumar', location: 'Room 303' },
      { id: 10, subject: 'Data Structures', date: d(7), time: '10:00 AM', status: 'present', markedAt: '10:02 AM', faculty: 'Teacher', location: 'Room 301' },
      { id: 11, subject: 'Web Development', date: d(7), time: '01:00 PM', status: 'late', markedAt: '01:12 PM', faculty: 'Teacher', location: 'Lab 201' },
      { id: 12, subject: 'Database Management', date: d(8), time: '10:00 AM', status: 'present', markedAt: '10:01 AM', faculty: 'Test Faculty', location: 'Room 302' },
      { id: 13, subject: 'Operating Systems', date: d(8), time: '02:00 PM', status: 'absent', markedAt: '-', faculty: 'Teacher', location: 'Lab 101' },
    ];
    setRecords(sample);
    setSubjects(['Data Structures', 'Web Development', 'Database Management', 'Algorithm Design', 'Operating Systems']);
  };

  /* ── Filters ───────────────────────────────────────────────── */
  const applyFilters = () => {
    let f = [...records];
    if (filters.subject !== 'all') f = f.filter((r) => r.subject === filters.subject);
    if (filters.status !== 'all') f = f.filter((r) => r.status === filters.status);
    if (filters.dateFrom) f = f.filter((r) => r.date >= filters.dateFrom);
    if (filters.dateTo) f = f.filter((r) => r.date <= filters.dateTo);
    setFiltered(f);
  };

  const set = (k, v) => setFilters((p) => ({ ...p, [k]: v }));
  const clear = () => setFilters({ subject: 'all', status: 'all', dateFrom: '', dateTo: '' });

  const statusIcon = (s) => {
    if (s === 'present') return <Check size={13} />;
    if (s === 'absent') return <X size={13} />;
    if (s === 'late') return <Clock size={13} />;
    return null;
  };

  /* ── Loading ───────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="ap">
        <div className="ap__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="spinner" /><p style={{ marginLeft: 12 }}>Loading attendance history…</p>
        </div>
      </div>
    );
  }

  /* ── Stats ─────────────────────────────────────────────────── */
  const present = filtered.filter((r) => r.status === 'present').length;
  const absent = filtered.filter((r) => r.status === 'absent').length;
  const late = filtered.filter((r) => r.status === 'late').length;

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
            <button className="ap__back-btn" onClick={() => navigate('/student-dashboard')}>
              <ArrowLeft size={18} /> Back
            </button>
            <p className="ap__eyebrow">Student &bull; Records</p>
            <h1 className="ap__title"><ScrollText size={26} style={{ verticalAlign: 'middle', marginRight: 8 }} />Attendance History</h1>
            <p className="ap__subtitle">View your complete attendance records</p>
          </div>
        </header>

        {/* Stats */}
        <div className="ap__stats">
          {[
            { icon: <BarChart3 size={18} />, label: 'Total Classes', value: filtered.length },
            { icon: <CheckCircle size={18} />, label: 'Present', value: present },
            { icon: <XCircle size={18} />, label: 'Absent', value: absent },
            { icon: <Clock size={18} />, label: 'Late', value: late },
          ].map((s, i) => (
            <div className="ap__stat" key={i}>
              <span className="ap__stat-label">{s.icon} {s.label}</span>
              <span className="ap__stat-value">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="ap__panel" style={{ marginTop: '1.25rem' }}>
          <div className="ap__panel-header">
            <h2 className="ap__panel-title"><Filter size={18} /> Filters</h2>
            <button className="ap__btn ap__btn--ghost" onClick={clear}>Clear All</button>
          </div>
          <div className="ap__filters" style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Subject</label>
              <select className="ap__select" value={filters.subject} onChange={(e) => set('subject', e.target.value)}>
                <option value="all">All Subjects</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status</label>
              <select className="ap__select" value={filters.status} onChange={(e) => set('status', e.target.value)}>
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>From</label>
              <input type="date" className="ap__search" value={filters.dateFrom} onChange={(e) => set('dateFrom', e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>To</label>
              <input type="date" className="ap__search" value={filters.dateTo} onChange={(e) => set('dateTo', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="ap__panel" style={{ marginTop: '1.25rem' }}>
          <div className="ap__panel-header">
            <h2 className="ap__panel-title"><BookOpen size={18} /> Records</h2>
            <span className="ap__panel-count">{filtered.length} entries</span>
          </div>

          {filtered.length === 0 ? (
            <div className="ap__empty">
              <span className="ap__empty-icon"><BookOpen size={38} /></span>
              <p className="ap__empty-title">No records found</p>
              <p className="ap__empty-text">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="ap__table-wrap">
              <table className="ap__table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Marked At</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td>{r.date !== '-' ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                      <td style={{ fontWeight: 600 }}>{r.subject}</td>
                      <td>{r.time}</td>
                      <td>
                        <span className={`ap__badge ${STATUS_BADGE[r.status] || ''}`}>
                          {statusIcon(r.status)} {r.status}
                        </span>
                      </td>
                      <td>{r.markedAt}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AttendanceHistory;
