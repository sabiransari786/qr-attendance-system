import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, BookOpen, ClipboardList, MapPin, Clock, CheckCircle, Timer, XCircle, Loader } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import { fadeInUp, fadeInDown, staggerContainer } from '../animations/animationConfig';
import '../styles/dashboard.css';

function FacultyAttendanceReports() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const user = authContext?.user;

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/session`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const allSessions = data.data || [];
          const facultySessions = allSessions.filter(s => s.facultyId === user?.id);
          setSessions(facultySessions);
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Error loading sessions');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSessions();
    }
  }, [token, user?.id]);

  const fetchAttendance = async (sessionId) => {
    try {
      setLoadingAttendance(true);
      const response = await fetch(`${API_BASE_URL}/attendance/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.data || data || []);
      } else {
        setAttendanceData([]);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setAttendanceData([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    fetchAttendance(session.id);
  };

  const handleBack = () => {
    navigate('/faculty-dashboard');
  };

  const calculateStats = () => {
    if (!attendanceData || attendanceData.length === 0) return { total: 0, present: 0, late: 0, absent: 0 };
    
    return {
      total: attendanceData.length,
      present: attendanceData.filter(a => a.status === 'present').length,
      late: attendanceData.filter(a => a.status === 'late').length,
      absent: attendanceData.filter(a => a.status === 'absent').length
    };
  };

  const stats = calculateStats();
  const attendancePercentage = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0;

  const getMonthKey = (dateValue) => {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
  };

  const filteredAttendance = exportMonth
    ? attendanceData.filter(a => getMonthKey(a.marked_at) === exportMonth)
    : attendanceData;

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCsv = () => {
    if (!selectedSession) {
      return;
    }

    const rows = filteredAttendance.map((record) => [
      record.student_name || '',
      record.student_roll_no || '',
      record.student_email || '',
      record.status || '',
      record.marked_at ? new Date(record.marked_at).toLocaleString() : ''
    ]);

    const headers = ['Student Name', 'Roll No', 'Email', 'Status', 'Marked At'];
    const escapeValue = (value) => {
      const text = String(value ?? '');
      return `"${text.replace(/"/g, '""')}"`;
    };
    const csv = [headers.map(escapeValue).join(','), ...rows.map(r => r.map(escapeValue).join(','))].join('\n');
    const monthSuffix = exportMonth ? exportMonth : 'all';
    const filename = `attendance_${selectedSession.subject}_${monthSuffix}.csv`;
    downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  };

  const exportToPdf = () => {
    if (!selectedSession) {
      return;
    }

    const monthLabel = exportMonth ? exportMonth : 'All Months';
    const rowsHtml = filteredAttendance.map((record) => (
      `<tr>
        <td>${record.student_name || ''}</td>
        <td>${record.student_roll_no || ''}</td>
        <td>${record.student_email || ''}</td>
        <td>${record.status || ''}</td>
        <td>${record.marked_at ? new Date(record.marked_at).toLocaleString() : ''}</td>
      </tr>`
    )).join('');

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin: 0 0 8px 0; }
            h2 { margin: 0 0 16px 0; font-weight: normal; color: #444; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Attendance Report</h1>
          <h2>${selectedSession.subject} • ${monthLabel}</h2>
          <div>Location: ${selectedSession.location || 'N/A'}</div>
          <div>Date: ${selectedSession.startTime ? new Date(selectedSession.startTime).toLocaleDateString() : 'N/A'}</div>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll No</th>
                <th>Email</th>
                <th>Status</th>
                <th>Marked At</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="5">No records found</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
  };

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
          <h1 className="dashboard__title"><BarChart3 size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />Attendance Reports</h1>
          <p className="dashboard__subtitle">Comprehensive attendance analysis and student tracking</p>
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
        <div className="faculty-reports-layout" style={{ display: 'grid', gap: '2rem', minHeight: 'calc(100vh - 300px)' }}>
          {/* Sessions Sidebar */}
          <aside style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '2rem',
            height: 'fit-content',
            position: 'sticky',
            top: '20px'
          }}>
            <h3 style={{ 
              margin: '0 0 1.5rem 0',
              fontSize: '1.2rem',
              fontWeight: '700',
              color: 'var(--color-text)'
            }}>
              <BookOpen size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Sessions
            </h3>

            {loading && <p style={{ color: 'var(--color-text-secondary)' }}><Loader size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Loading sessions...</p>}
            {!loading && sessions.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>No sessions found</p>
            )}

            {!loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSessionSelect(session)}
                    style={{
                      padding: '1.2rem',
                      border: selectedSession?.id === session.id ? '2px solid var(--primary-accent)' : '1px solid var(--color-border)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      backgroundColor: selectedSession?.id === session.id ? 'rgba(49, 156, 181, 0.1)' : 'transparent',
                      transition: 'all 0.3s ease',
                      textAlign: 'left',
                      color: 'inherit',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = selectedSession?.id !== session.id ? 'var(--card-bg)' : 'rgba(49, 156, 181, 0.1)';
                      e.currentTarget.style.borderColor = 'var(--primary-accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = selectedSession?.id === session.id ? 'rgba(49, 156, 181, 0.1)' : 'transparent';
                      e.currentTarget.style.borderColor = selectedSession?.id === session.id ? 'var(--primary-accent)' : 'var(--color-border)';
                    }}
                  >
                    <div style={{ fontWeight: '700', marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                      {session.subject}
                    </div>
                    <div style={{ fontSize: '0.85em', color: 'var(--color-text-secondary)' }}>
                      {session.location}
                    </div>
                    <div style={{ fontSize: '0.8em', color: 'var(--color-text-secondary)', marginTop: '0.4rem' }}>
                      {new Date(session.startTime).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          {/* Attendance Details */}
          <section>
            {!selectedSession && (
              <div style={{ 
                textAlign: 'center', 
                padding: '5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}><ClipboardList size={48} /></div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                  Select a session
                </h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Choose a session from the list to view detailed attendance reports
                </p>
              </div>
            )}

            {selectedSession && (
              <>
                <div style={{ marginBottom: '2.5rem' }}>
                  <h2 style={{ 
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.8rem',
                    fontWeight: '700',
                    color: 'var(--color-text)'
                  }}>
                    {selectedSession.subject}
                  </h2>
                  <p style={{ 
                    margin: 0,
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.95rem'
                  }}>
                    <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />{selectedSession.location} • <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />{new Date(selectedSession.startTime).toLocaleDateString()}
                  </p>
                </div>

                {/* Export Controls */}
                <div className="dashboard__card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-text)' }}>
                        Export Monthly Report
                      </h4>
                      <p style={{ margin: '0.4rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        Select a month and export attendance to PDF or Excel (CSV).
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center' }}>
                      <input
                        type="month"
                        value={exportMonth}
                        onChange={(e) => setExportMonth(e.target.value)}
                        className="form-input"
                        style={{ minWidth: '160px' }}
                      />
                      <button className="dashboard__button dashboard__button--secondary" onClick={exportToPdf}>
                        Export PDF
                      </button>
                      <button className="dashboard__button dashboard__button--primary" onClick={exportToCsv}>
                        Export Excel
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <div className="dashboard__card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--primary-accent)', marginBottom: '0.5rem' }}>
                      {stats.total}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Total Students
                    </div>
                  </div>

                  <div className="dashboard__card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.4rem', fontWeight: '800', color: '#10b981', marginBottom: '0.5rem' }}>
                      {stats.present}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Present
                    </div>
                  </div>

                  <div className="dashboard__card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.4rem', fontWeight: '800', color: '#f59e0b', marginBottom: '0.5rem' }}>
                      {stats.late}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Late
                    </div>
                  </div>

                  <div className="dashboard__card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.4rem', fontWeight: '800', color: '#ef4444', marginBottom: '0.5rem' }}>
                      {stats.absent}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Absent
                    </div>
                  </div>
                </div>

                {/* Attendance Rate Progress */}
                <div className="dashboard__card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
                  <h4 style={{ 
                    margin: '0 0 1.5rem 0',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    color: 'var(--color-text)'
                  }}>
                    Attendance Rate
                  </h4>
                  <div style={{ 
                    backgroundColor: 'rgba(49, 156, 181, 0.1)',
                    borderRadius: '10px', 
                    height: '40px',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid var(--color-border)'
                  }}>
                    <div style={{
                      backgroundColor: attendancePercentage >= 75 ? '#10b981' : attendancePercentage >= 50 ? '#f59e0b' : '#ef4444',
                      height: '100%',
                      width: `${attendancePercentage}%`,
                      transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '0.95rem'
                    }}>
                      {attendancePercentage}%
                    </div>
                  </div>
                </div>

                {/* Attendance Table */}
                <div className="dashboard__card" style={{ padding: '2rem' }}>
                  <h4 style={{ 
                    margin: '0 0 1.5rem 0',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    color: 'var(--color-text)'
                  }}>
                    Student Attendance
                  </h4>

                  {loadingAttendance && (
                    <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                      <Loader size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Loading attendance data...
                    </p>
                  )}

                  {!loadingAttendance && attendanceData.length === 0 && (
                    <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                      No attendance records found for this session
                    </p>
                  )}

                  {!loadingAttendance && attendanceData.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: 'var(--color-text)' }}>
                              Student Name
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: 'var(--color-text)' }}>
                              Roll No
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: 'var(--color-text)' }}>
                              Status
                            </th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: 'var(--color-text)' }}>
                              Marked At
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceData.map((record, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '1rem', color: 'var(--color-text)' }}>
                                {record.student_name || record.studentName || 'N/A'}
                              </td>
                              <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                                {record.student_roll_no || record.studentRollNo || 'N/A'}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  padding: '0.4rem 0.9rem',
                                  borderRadius: '20px',
                                  fontSize: '0.85em',
                                  fontWeight: '600',
                                  backgroundColor: 
                                    record.status === 'present' ? 'rgba(16, 185, 129, 0.15)' : 
                                    record.status === 'late' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: 
                                    record.status === 'present' ? '#10b981' : 
                                    record.status === 'late' ? '#f59e0b' : '#ef4444',
                                  border: '1px solid currentColor'
                                }}>
                                  <span style={{ fontSize: '1.1em' }}>
                                    {record.status === 'present' ? <CheckCircle size={14} /> : record.status === 'late' ? <Timer size={14} /> : <XCircle size={14} />}
                                  </span>
                                  {record.status || 'N/A'}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.9em', color: 'var(--color-text-secondary)' }}>
                                {record.marked_at ? new Date(record.marked_at).toLocaleString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </motion.div>
  );
}

export default FacultyAttendanceReports;
