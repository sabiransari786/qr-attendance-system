import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, BookOpen, ClipboardList, MapPin, Clock, CheckCircle, XCircle, Loader, ArrowLeft, Download, FileText } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import { fadeInUp, staggerContainer } from '../animations/animationConfig';
import '../styles/dashboard.css';
import '../styles/admin-pages.css';

function FacultyAttendanceReports() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const user = authContext?.user;

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [exportMonth, setExportMonth] = useState(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; });
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/session`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) { const data = await response.json(); setSessions((data.data || []).filter(s => s.facultyId === user?.id)); }
      } catch (err) { console.error('Error fetching sessions:', err); setError('Error loading sessions'); }
      finally { setLoading(false); }
    };
    if (token) fetchSessions();
  }, [token, user?.id]);

  const fetchAttendance = async (sessionId) => {
    try {
      setLoadingAttendance(true);
      const response = await fetch(`${API_BASE_URL}/attendance/session/${sessionId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) { const data = await response.json(); setAttendanceData(data.data || data || []); }
      else setAttendanceData([]);
    } catch (err) { console.error('Error fetching attendance:', err); setAttendanceData([]); }
    finally { setLoadingAttendance(false); }
  };

  const handleSessionSelect = (session) => { setSelectedSession(session); fetchAttendance(session.id); };

  const stats = (() => {
    if (!attendanceData.length) return { total: 0, present: 0, late: 0, absent: 0 };
    return { total: attendanceData.length, present: attendanceData.filter(a => a.status === 'present').length, late: attendanceData.filter(a => a.status === 'late').length, absent: attendanceData.filter(a => a.status === 'absent').length };
  })();

  const getMonthKey = (dateValue) => { const d = new Date(dateValue); return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
  const filteredAttendance = exportMonth ? attendanceData.filter(a => getMonthKey(a.marked_at) === exportMonth) : attendanceData;

  const downloadFile = (content, filename, mimeType) => { const blob = new Blob([content], { type: mimeType }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); };

  const exportToCsv = () => {
    if (!selectedSession) return;
    const headers = ['Student Name', 'Roll No', 'Email', 'Status', 'Marked At'];
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filteredAttendance.map(r => [r.student_name || '', r.student_roll_no || '', r.student_email || '', r.status || '', r.marked_at ? new Date(r.marked_at).toLocaleString() : '']);
    const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
    downloadFile(csv, `attendance_${selectedSession.subject}_${exportMonth || 'all'}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportToPdf = () => {
    if (!selectedSession) return;
    const monthLabel = exportMonth || 'All Months';
    const rowsHtml = filteredAttendance.map(r => `<tr><td>${r.student_name || ''}</td><td>${r.student_roll_no || ''}</td><td>${r.student_email || ''}</td><td>${r.status || ''}</td><td>${r.marked_at ? new Date(r.marked_at).toLocaleString() : ''}</td></tr>`).join('');
    const pw = window.open('', '_blank', 'width=900,height=700');
    if (!pw) return;
    pw.document.write(`<html><head><title>Attendance Report</title><style>body{font-family:Arial,sans-serif;padding:24px}h1{margin:0 0 8px}h2{margin:0 0 16px;font-weight:normal;color:#444}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:8px;font-size:12px;text-align:left}th{background:#f3f4f6}</style></head><body><h1>Attendance Report</h1><h2>${selectedSession.subject} • ${monthLabel}</h2><div>Location: ${selectedSession.location || 'N/A'}</div><div>Date: ${selectedSession.startTime ? new Date(selectedSession.startTime).toLocaleDateString() : 'N/A'}</div><table><thead><tr><th>Student Name</th><th>Roll No</th><th>Email</th><th>Status</th><th>Marked At</th></tr></thead><tbody>${rowsHtml || '<tr><td colspan="5">No records found</td></tr>'}</tbody></table></body></html>`);
    pw.document.close(); pw.focus(); setTimeout(() => pw.print(), 400);
  };

  return (
    <motion.div className="dashboard ap" variants={staggerContainer} initial="hidden" animate="visible">
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>
      <div className="ap__inner">
        <motion.div className="ap__header" variants={fadeInUp}>
          <div className="ap__header-left">
            <button className="ap__back-btn" onClick={() => navigate('/faculty-dashboard')}><ArrowLeft size={16} /> Back</button>
            <div>
              <p className="ap__eyebrow">Faculty</p>
              <h1 className="ap__title">Attendance Reports</h1>
              <p className="ap__subtitle">Comprehensive attendance analysis and student tracking</p>
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Session List */}
          <motion.div className="ap__panel" variants={fadeInUp} style={{ position: 'sticky', top: '100px' }}>
            <div className="ap__panel-header"><h3 className="ap__panel-title"><BookOpen size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Sessions</h3><span className="ap__panel-count">{sessions.length}</span></div>
            {loading ? <div className="ap__empty"><Loader size={20} /><p>Loading...</p></div> : sessions.length === 0 ? <div className="ap__empty"><p className="ap__empty-title">No sessions found</p></div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                {sessions.map(session => (
                  <button key={session.id} onClick={() => handleSessionSelect(session)} className={`ap__btn ${selectedSession?.id === session.id ? 'ap__btn--primary' : 'ap__btn--ghost'}`} style={{ textAlign: 'left', padding: '0.85rem 1rem', width: '100%', flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{session.subject}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{session.location} • {new Date(session.startTime).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Report Content */}
          <div>
            {!selectedSession ? (
              <motion.div className="ap__panel" variants={fadeInUp}>
                <div className="ap__empty"><div className="ap__empty-icon"><ClipboardList size={48} /></div><h3 className="ap__empty-title">Select a session</h3><p className="ap__empty-text">Choose a session from the list to view detailed attendance reports</p></div>
              </motion.div>
            ) : (
              <>
                {/* Session Header & Stats */}
                <motion.div variants={fadeInUp}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h2 className="ap__title" style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>{selectedSession.subject}</h2>
                    <p className="ap__subtitle"><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />{selectedSession.location} • <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />{new Date(selectedSession.startTime).toLocaleDateString()}</p>
                  </div>
                  <div className="ap__stats">
                    {[
                      { label: 'Total', value: stats.total, color: '#319cb5' },
                      { label: 'Present', value: stats.present, color: '#10b981' },
                      { label: 'Late', value: stats.late, color: '#f59e0b' },
                      { label: 'Absent', value: stats.absent, color: '#ef4444' },
                    ].map((s, i) => (
                      <div className="ap__stat" key={i}>
                        <p className="ap__stat-label">{s.label}</p>
                        <p className="ap__stat-value" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Export Controls */}
                <motion.div className="ap__panel" variants={fadeInUp} style={{ marginBottom: '1.5rem' }}>
                  <div className="ap__panel-header"><h3 className="ap__panel-title">Export Report</h3></div>
                  <div className="ap__filters">
                    <input className="ap__search" type="month" value={exportMonth} onChange={e => setExportMonth(e.target.value)} style={{ maxWidth: '220px' }} />
                    <button className="ap__btn ap__btn--primary" onClick={exportToCsv} disabled={filteredAttendance.length === 0}><Download size={16} /> CSV</button>
                    <button className="ap__btn ap__btn--outline" onClick={exportToPdf} disabled={filteredAttendance.length === 0}><FileText size={16} /> PDF</button>
                  </div>
                </motion.div>

                {/* Attendance Table */}
                <motion.div className="ap__panel" variants={fadeInUp}>
                  <div className="ap__panel-header"><h3 className="ap__panel-title">Attendance Records</h3><span className="ap__panel-count">{filteredAttendance.length} records</span></div>
                  {loadingAttendance ? (
                    <div className="ap__empty"><Loader size={20} /><p>Loading attendance...</p></div>
                  ) : filteredAttendance.length === 0 ? (
                    <div className="ap__empty"><div className="ap__empty-icon"><ClipboardList size={48} /></div><h3 className="ap__empty-title">No records found</h3><p className="ap__empty-text">No attendance data for this session yet</p></div>
                  ) : (
                    <div className="ap__table-wrap">
                      <table className="ap__table">
                        <thead><tr><th>Student</th><th>Roll No</th><th>Email</th><th>Status</th><th>Marked At</th></tr></thead>
                        <tbody>
                          {filteredAttendance.map((record, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{record.student_name || 'N/A'}</td>
                              <td>{record.student_roll_no || '—'}</td>
                              <td>{record.student_email || '—'}</td>
                              <td><span className={`ap__badge ap__badge--${record.status === 'present' ? 'ok' : record.status === 'late' ? 'warn' : 'error'}`}>{record.status}</span></td>
                              <td>{record.marked_at ? new Date(record.marked_at).toLocaleString() : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default FacultyAttendanceReports;
