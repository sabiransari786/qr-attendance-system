/**
 * SubjectAttendance — ap__* unified design
 */

import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, AlertTriangle, BookOpen,
  Lightbulb, Check, X, ArrowLeft, TrendingUp, Users, BarChart3,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import '../styles/dashboard.css';
import '../styles/admin-pages.css';

function SubjectAttendance() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const { subjectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [subjectData, setSubjectData] = useState(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  useEffect(() => { fetchSubjectData(); }, [subjectId]);

  const fetchSubjectData = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      const stored = sessionStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : null;
      const userId = authContext?.user?.id || parsed?.id;

      const res = await fetch(`${API_BASE_URL}/attendance/student/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); processSubjectData(data.data); }
      else loadSampleData();
    } catch { loadSampleData(); }
    finally { setLoading(false); }
  };

  const processSubjectData = () => { loadSampleData(); };

  const loadSampleData = () => {
    const sampleSubjects = {
      1: { name: 'Data Structures', code: 'CS201', faculty: 'Dr. John Smith', totalClasses: 25, attended: 22, absent: 2, late: 1, percentage: 88, records: [
        { date: '2024-01-15', status: 'present', time: '09:00 AM' }, { date: '2024-01-16', status: 'present', time: '09:00 AM' },
        { date: '2024-01-17', status: 'absent', time: '09:00 AM' }, { date: '2024-01-18', status: 'late', time: '09:00 AM' },
        { date: '2024-01-19', status: 'present', time: '09:00 AM' }] },
      2: { name: 'Web Development', code: 'CS301', faculty: 'Prof. Jane Doe', totalClasses: 20, attended: 18, absent: 1, late: 1, percentage: 92, records: [
        { date: '2024-01-15', status: 'present', time: '11:00 AM' }, { date: '2024-01-16', status: 'present', time: '11:00 AM' },
        { date: '2024-01-17', status: 'present', time: '11:00 AM' }, { date: '2024-01-18', status: 'absent', time: '11:00 AM' },
        { date: '2024-01-19', status: 'late', time: '11:00 AM' }] },
      3: { name: 'Database Management', code: 'CS202', faculty: 'Dr. Mike Johnson', totalClasses: 22, attended: 15, absent: 5, late: 2, percentage: 68, records: [
        { date: '2024-01-15', status: 'present', time: '10:00 AM' }, { date: '2024-01-16', status: 'absent', time: '10:00 AM' },
        { date: '2024-01-17', status: 'absent', time: '10:00 AM' }, { date: '2024-01-18', status: 'present', time: '10:00 AM' },
        { date: '2024-01-19', status: 'late', time: '10:00 AM' }] },
      4: { name: 'Operating Systems', code: 'CS302', faculty: 'Prof. Sarah Williams', totalClasses: 18, attended: 15, absent: 2, late: 1, percentage: 85, records: [
        { date: '2024-01-16', status: 'present', time: '02:00 PM' }, { date: '2024-01-17', status: 'late', time: '02:00 PM' },
        { date: '2024-01-18', status: 'present', time: '02:00 PM' }, { date: '2024-01-19', status: 'absent', time: '02:00 PM' },
        { date: '2024-01-20', status: 'present', time: '02:00 PM' }] },
    };
    setSubjectData(sampleSubjects[subjectId] || sampleSubjects[1]);
  };

  const pctColor = (p) => { if (p >= 85) return '#319cb5'; if (p >= 75) return '#2488a8'; if (p >= 65) return '#f59e0b'; return '#ef4444'; };
  const statusIcon = (s) => { if (s === 'present') return <Check size={13} />; if (s === 'absent') return <X size={13} />; if (s === 'late') return <Clock size={13} />; return null; };
  const statusBadge = (s) => { if (s === 'present') return 'ap__badge--active'; if (s === 'absent') return 'ap__badge--error'; if (s === 'late') return 'ap__badge--warn'; return ''; };

  if (loading) return (
    <div className="ap"><div className="ap__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner" /><p style={{ marginLeft: 12 }}>Loading subject details…</p></div></div>
  );
  if (!subjectData) return (
    <div className="ap"><div className="ap__inner" style={{ textAlign: 'center', paddingTop: '20vh' }}><p>Subject not found</p></div></div>
  );

  const color = pctColor(subjectData.percentage);
  const circ = 2 * Math.PI * 52;
  const offset = circ - (subjectData.percentage / 100) * circ;
  const needed = Math.max(0, Math.ceil(0.75 * subjectData.totalClasses - subjectData.attended));

  return (
    <div className="ap">
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>

      <div className="ap__inner" style={{ maxWidth: 920 }}>
        {/* Header */}
        <header className="ap__header">
          <div className="ap__header-left">
            <button className="ap__back-btn" onClick={() => navigate('/student-dashboard')}>
              <ArrowLeft size={18} /> Back
            </button>
            <p className="ap__eyebrow">Student &bull; Subject</p>
            <h1 className="ap__title"><BookOpen size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />{subjectData.name}</h1>
            <p className="ap__subtitle">{subjectData.code} &middot; {subjectData.faculty}</p>
          </div>
        </header>

        {/* Top Grid: Ring + Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.25rem', marginTop: '0.25rem' }}>
          {/* Percentage Ring */}
          <motion.div className="ap__panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
            <div style={{ position: 'relative', width: 130, height: 130, marginBottom: '1rem' }}>
              <svg width="130" height="130" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(49,156,181,0.1)" strokeWidth="8" />
                <motion.circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '2rem', fontWeight: 800, color, letterSpacing: -1 }}>
                {subjectData.percentage}%
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Overall Attendance</p>
            {subjectData.percentage < 75 && (
              <div style={{ marginTop: '0.8rem', padding: '0.45rem 0.75rem', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', fontSize: '0.78rem', fontWeight: 600, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 5 }}>
                <AlertTriangle size={13} /> Below 75%
              </div>
            )}
          </motion.div>

          {/* Stats */}
          <div className="ap__stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {[
              { icon: <Users size={18} />, label: 'Total Classes', value: subjectData.totalClasses },
              { icon: <CheckCircle size={18} />, label: 'Present', value: subjectData.attended },
              { icon: <XCircle size={18} />, label: 'Absent', value: subjectData.absent },
              { icon: <Clock size={18} />, label: 'Late', value: subjectData.late },
            ].map((s, i) => (
              <motion.div className="ap__stat" key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.08 }}>
                <span className="ap__stat-label">{s.icon} {s.label}</span>
                <span className="ap__stat-value">{s.value}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Warning Banner */}
        {subjectData.percentage < 75 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ marginTop: '1.25rem', padding: '0.85rem 1.2rem', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: '#d97706', fontWeight: 500 }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            Your attendance is below 75%. You need to attend at least <strong style={{ margin: '0 3px' }}>{needed}</strong> more classes.
          </motion.div>
        )}

        {/* Recent Records */}
        <div className="ap__panel" style={{ marginTop: '1.25rem' }}>
          <div className="ap__panel-header">
            <h2 className="ap__panel-title"><BarChart3 size={18} /> Recent Attendance</h2>
            <span className="ap__panel-count">{subjectData.records.length} records</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem 1.25rem' }}>
            {subjectData.records.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(49,156,181,0.03)', border: '1px solid rgba(49,156,181,0.06)' }}>
                {/* Date badge */}
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(49,156,181,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1, color: '#319cb5' }}>{new Date(r.date).getDate()}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#319cb5', opacity: 0.7, textTransform: 'uppercase' }}>{new Date(r.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                </div>
                <div style={{ flex: 1, fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>{r.time}</div>
                <span className={`ap__badge ${statusBadge(r.status)}`}>{statusIcon(r.status)} {r.status}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="ap__panel" style={{ marginTop: '1.25rem' }}>
          <div className="ap__panel-header">
            <h2 className="ap__panel-title"><Lightbulb size={18} /> Insights</h2>
          </div>
          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {subjectData.percentage < 75 ? (
              <>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ef4444' }}><AlertTriangle size={14} /></span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>You need at least {needed} more classes to reach the 75% requirement</span>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#f59e0b' }}><TrendingUp size={14} /></span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Try not to miss any upcoming classes to improve steadily</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(49,156,181,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent)' }}><CheckCircle size={14} /></span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Great job! You're maintaining excellent attendance in this subject</span>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(49,156,181,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent)' }}><TrendingUp size={14} /></span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Keep up the consistency — you're well above the minimum threshold</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubjectAttendance;
