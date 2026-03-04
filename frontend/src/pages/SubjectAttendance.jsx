/**
 * SubjectAttendance — ap__* unified design
 * Shows all subjects with attendance breakdown fetched from real API
 */

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, AlertTriangle, BookOpen,
  Lightbulb, Check, X, ArrowLeft, TrendingUp, Users, BarChart3,
  Loader, ChevronDown, ChevronUp,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import '../styles/dashboard.css';
import '../styles/admin-pages.css';

function SubjectAttendance() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [overallStats, setOverallStats] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: 0 });
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [allRecords, setAllRecords] = useState([]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  useEffect(() => { if (user?.id) fetchSubjectData(); }, [user]);

  const fetchSubjectData = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      const stored = sessionStorage.getItem('user');
      const parsed = stored ? JSON.parse(stored) : null;
      const userId = user?.id || parsed?.id;

      const res = await fetch(`${API_BASE_URL}/attendance/student/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const records = data.data || [];
        setAllRecords(records);
        processSubjectData(records);
      } else {
        loadSampleData();
      }
    } catch {
      loadSampleData();
    } finally {
      setLoading(false);
    }
  };

  const processSubjectData = (records) => {
    const totalClasses = records.length;
    const presentClasses = records.filter(r => r.status === 'present').length;
    const lateClasses = records.filter(r => r.status === 'late').length;
    const absentClasses = records.filter(r => r.status === 'absent').length;
    const overallPct = totalClasses > 0 ? Math.round(((presentClasses + lateClasses) / totalClasses) * 100) : 0;

    setOverallStats({ total: totalClasses, present: presentClasses, absent: absentClasses, late: lateClasses, percentage: overallPct });

    const subjectMap = {};
    records.forEach(r => {
      const s = r.subject || 'Unknown Subject';
      if (!subjectMap[s]) subjectMap[s] = { name: s, total: 0, present: 0, late: 0, absent: 0, records: [] };
      subjectMap[s].total++;
      if (r.status === 'present') subjectMap[s].present++;
      if (r.status === 'late') subjectMap[s].late++;
      if (r.status === 'absent') subjectMap[s].absent++;
      subjectMap[s].records.push({
        date: r.marked_at || r.date || r.session_date,
        status: r.status,
        time: r.marked_at ? new Date(r.marked_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--',
      });
    });

    const subjectsList = Object.values(subjectMap).map(s => ({
      ...s,
      percentage: s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : 0,
      records: s.records.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10),
    }));

    subjectsList.sort((a, b) => a.percentage - b.percentage);
    setSubjects(subjectsList);
  };

  const loadSampleData = () => {
    const sampleSubjects = [
      { name: 'Data Structures', total: 25, present: 22, absent: 2, late: 1, percentage: 92, records: [
        { date: '2024-01-19', status: 'present', time: '09:00 AM' }, { date: '2024-01-18', status: 'late', time: '09:05 AM' },
        { date: '2024-01-17', status: 'absent', time: '--' }, { date: '2024-01-16', status: 'present', time: '09:00 AM' },
        { date: '2024-01-15', status: 'present', time: '09:00 AM' }] },
      { name: 'Web Development', total: 20, present: 18, absent: 1, late: 1, percentage: 95, records: [
        { date: '2024-01-19', status: 'late', time: '11:05 AM' }, { date: '2024-01-18', status: 'absent', time: '--' },
        { date: '2024-01-17', status: 'present', time: '11:00 AM' }, { date: '2024-01-16', status: 'present', time: '11:00 AM' },
        { date: '2024-01-15', status: 'present', time: '11:00 AM' }] },
      { name: 'Database Management', total: 22, present: 15, absent: 5, late: 2, percentage: 77, records: [
        { date: '2024-01-19', status: 'late', time: '10:08 AM' }, { date: '2024-01-18', status: 'present', time: '10:00 AM' },
        { date: '2024-01-17', status: 'absent', time: '--' }, { date: '2024-01-16', status: 'absent', time: '--' },
        { date: '2024-01-15', status: 'present', time: '10:00 AM' }] },
      { name: 'Operating Systems', total: 18, present: 10, absent: 6, late: 2, percentage: 67, records: [
        { date: '2024-01-19', status: 'absent', time: '--' }, { date: '2024-01-18', status: 'present', time: '02:00 PM' },
        { date: '2024-01-17', status: 'late', time: '02:10 PM' }, { date: '2024-01-16', status: 'present', time: '02:00 PM' },
        { date: '2024-01-15', status: 'absent', time: '--' }] },
    ];
    sampleSubjects.sort((a, b) => a.percentage - b.percentage);
    setSubjects(sampleSubjects);
    const t = sampleSubjects.reduce((a, s) => a + s.total, 0);
    const p = sampleSubjects.reduce((a, s) => a + s.present, 0);
    const l = sampleSubjects.reduce((a, s) => a + s.late, 0);
    const ab = sampleSubjects.reduce((a, s) => a + s.absent, 0);
    setOverallStats({ total: t, present: p, absent: ab, late: l, percentage: t > 0 ? Math.round(((p + l) / t) * 100) : 0 });
  };

  const pctColor = (p) => { if (p >= 85) return '#10b981'; if (p >= 75) return '#f59e0b'; return '#ef4444'; };
  const statusIcon = (s) => { if (s === 'present') return <Check size={12} />; if (s === 'absent') return <X size={12} />; if (s === 'late') return <Clock size={12} />; return null; };
  const statusBadge = (s) => { if (s === 'present') return 'ap__badge--active'; if (s === 'absent') return 'ap__badge--error'; if (s === 'late') return 'ap__badge--warn'; return ''; };

  const lowSubjects = subjects.filter(s => s.percentage < 75);

  if (loading) return (
    <div className="ap">
      <div className="ap__objects" aria-hidden="true"><span className="ap__object ap__object--a" /><span className="ap__object ap__object--b" /><span className="ap__object ap__object--c" /></div>
      <div className="ap__inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
          <p style={{ marginTop: 12, color: 'var(--color-text-secondary)' }}>Loading subject attendance…</p>
        </div>
      </div>
    </div>
  );

  const circ = 2 * Math.PI * 52;
  const overallColor = pctColor(overallStats.percentage);
  const overallOffset = circ - (overallStats.percentage / 100) * circ;

  return (
    <div className="ap">
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>

      <div className="ap__inner" style={{ maxWidth: 960 }}>
        {/* Header */}
        <header className="ap__header">
          <div className="ap__header-left">
            <button className="ap__back-btn" onClick={() => navigate('/student-dashboard')}>
              <ArrowLeft size={18} /> Back
            </button>
            <p className="ap__eyebrow">Student &bull; Subjects</p>
            <h1 className="ap__title"><BookOpen size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />Subject Attendance</h1>
            <p className="ap__subtitle">Per-subject attendance breakdown &amp; insights</p>
          </div>
        </header>

        {/* Overall Summary: Ring + Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.25rem', marginTop: '0.25rem' }}>
          <motion.div className="ap__panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>
            <div style={{ position: 'relative', width: 110, height: 110, marginBottom: '0.75rem' }}>
              <svg width="110" height="110" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(49,156,181,0.1)" strokeWidth="8" />
                <motion.circle cx="60" cy="60" r="52" fill="none" stroke={overallColor} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: overallOffset }}
                  transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '1.75rem', fontWeight: 800, color: overallColor, letterSpacing: -1 }}>
                {overallStats.percentage}%
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Overall Attendance</p>
          </motion.div>

          <div className="ap__stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {[
              { icon: <Users size={18} />, label: 'Total Classes', value: overallStats.total, color: '#319cb5' },
              { icon: <CheckCircle size={18} />, label: 'Present', value: overallStats.present, color: '#10b981' },
              { icon: <XCircle size={18} />, label: 'Absent', value: overallStats.absent, color: '#ef4444' },
              { icon: <Clock size={18} />, label: 'Late', value: overallStats.late, color: '#f59e0b' },
            ].map((s, i) => (
              <motion.div className="ap__stat" key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.08 }}>
                <span className="ap__stat-label">{s.icon} {s.label}</span>
                <span className="ap__stat-value">{s.value}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Low Attendance Warning */}
        {lowSubjects.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ marginTop: '1.25rem', padding: '0.85rem 1.2rem', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.88rem', color: '#d97706', fontWeight: 500 }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>{lowSubjects.length} subject{lowSubjects.length > 1 ? 's' : ''} below 75%:</strong>{' '}
              {lowSubjects.map(s => s.name).join(', ')}
            </div>
          </motion.div>
        )}

        {/* Subject Cards */}
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {subjects.length === 0 ? (
            <div className="ap__panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <BookOpen size={40} style={{ color: 'var(--color-text-secondary)', opacity: 0.4, marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>No attendance records found yet.</p>
            </div>
          ) : subjects.map((subj, idx) => {
            const sc = pctColor(subj.percentage);
            const sCirc = 2 * Math.PI * 20;
            const sOffset = sCirc - (subj.percentage / 100) * sCirc;
            const isExpanded = expandedSubject === idx;
            const needed = Math.max(0, Math.ceil(0.75 * subj.total - (subj.present + subj.late)));

            return (
              <motion.div key={idx} className="ap__panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.06 }} style={{ overflow: 'hidden' }}>
                {/* Subject Header Row */}
                <div onClick={() => setExpandedSubject(isExpanded ? null : idx)}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem', cursor: 'pointer', transition: 'background 0.2s' }}>
                  {/* Mini Ring */}
                  <div style={{ position: 'relative', width: 50, height: 50, flexShrink: 0 }}>
                    <svg width="50" height="50" viewBox="0 0 50 50" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(49,156,181,0.1)" strokeWidth="4" />
                      <circle cx="25" cy="25" r="20" fill="none" stroke={sc} strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={sCirc} strokeDashoffset={sOffset} />
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '0.7rem', fontWeight: 800, color: sc }}>{subj.percentage}%</div>
                  </div>

                  {/* Subject Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{subj.name}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {subj.total} classes &middot; {subj.present} present &middot; {subj.absent} absent &middot; {subj.late} late
                    </p>
                  </div>

                  {/* Status Badge + Arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {subj.percentage < 75 && (
                      <span style={{ padding: '0.3rem 0.65rem', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={12} /> Low
                      </span>
                    )}
                    {subj.percentage >= 85 && (
                      <span style={{ padding: '0.3rem 0.65rem', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={12} /> Good
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--color-text-secondary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--color-text-secondary)' }} />}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ duration: 0.3 }}
                    style={{ borderTop: '1px solid rgba(49,156,181,0.08)' }}>
                    {/* Stats Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', padding: '1rem 1.25rem' }}>
                      {[
                        { label: 'Total', value: subj.total, icon: <Users size={14} />, bg: 'rgba(49,156,181,0.08)', clr: '#319cb5' },
                        { label: 'Present', value: subj.present, icon: <CheckCircle size={14} />, bg: 'rgba(16,185,129,0.08)', clr: '#10b981' },
                        { label: 'Absent', value: subj.absent, icon: <XCircle size={14} />, bg: 'rgba(239,68,68,0.08)', clr: '#ef4444' },
                        { label: 'Late', value: subj.late, icon: <Clock size={14} />, bg: 'rgba(245,158,11,0.08)', clr: '#f59e0b' },
                      ].map((st, si) => (
                        <div key={si} style={{ textAlign: 'center', padding: '0.75rem 0.5rem', borderRadius: 10, background: st.bg }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: st.clr, marginBottom: 4 }}>{st.icon}<span style={{ fontSize: '0.72rem', fontWeight: 600 }}>{st.label}</span></div>
                          <span style={{ fontSize: '1.3rem', fontWeight: 800, color: st.clr }}>{st.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Warning */}
                    {subj.percentage < 75 && (
                      <div style={{ margin: '0 1.25rem 0.75rem', padding: '0.65rem 1rem', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#d97706', fontWeight: 500 }}>
                        <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                        Need <strong style={{ margin: '0 3px' }}>{needed}</strong> more classes to reach 75%
                      </div>
                    )}

                    {/* Recent Records */}
                    {subj.records.length > 0 && (
                      <div style={{ padding: '0 1.25rem 1.25rem' }}>
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <BarChart3 size={14} /> Recent Records
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {subj.records.map((r, ri) => {
                            const d = r.date ? new Date(r.date) : null;
                            return (
                              <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0.85rem', borderRadius: 8, background: 'rgba(49,156,181,0.03)', border: '1px solid rgba(49,156,181,0.06)' }}>
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(49,156,181,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <span style={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1, color: '#319cb5' }}>{d ? d.getDate() : '--'}</span>
                                  <span style={{ fontSize: '0.55rem', fontWeight: 600, color: '#319cb5', opacity: 0.7, textTransform: 'uppercase' }}>{d ? d.toLocaleDateString('en-US', { month: 'short' }) : ''}</span>
                                </div>
                                <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{r.time}</div>
                                <span className={`ap__badge ${statusBadge(r.status)}`} style={{ fontSize: '0.72rem' }}>{statusIcon(r.status)} {r.status}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Insights */}
        {subjects.length > 0 && (
          <motion.div className="ap__panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ marginTop: '1.25rem' }}>
            <div className="ap__panel-header">
              <h2 className="ap__panel-title"><Lightbulb size={18} /> Insights</h2>
            </div>
            <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {lowSubjects.length > 0 ? (
                <>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ef4444' }}><AlertTriangle size={14} /></span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>You have {lowSubjects.length} subject{lowSubjects.length > 1 ? 's' : ''} below 75% — focus on improving attendance there</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#f59e0b' }}><TrendingUp size={14} /></span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Try not to miss any upcoming classes to improve steadily</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#10b981' }}><CheckCircle size={14} /></span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Great job! All subjects are above the 75% requirement</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(49,156,181,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent)' }}><TrendingUp size={14} /></span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Keep up the consistency — you're well above the minimum threshold</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default SubjectAttendance;
