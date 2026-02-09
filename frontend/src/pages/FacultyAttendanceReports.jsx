import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/dashboard.css';

function FacultyAttendanceReports() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const token = authContext?.token;

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/session', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSessions(data.data || []);
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
  }, [token]);

  const fetchAttendance = async (sessionId) => {
    try {
      setLoadingAttendance(true);
      const response = await fetch(`http://localhost:5001/api/attendance/session/${sessionId}`, {
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

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">📊 Attendance Reports</h1>
          <p className="dashboard__subtitle">View attendance statistics for your sessions</p>
        </div>
        <button
          className="dashboard__button dashboard__button--secondary"
          onClick={handleBack}
        >
          ← Back to Dashboard
        </button>
      </header>

      <main style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
          {/* Sessions List */}
          <div>
            <h3 style={{ marginBottom: '15px' }}>Select Session</h3>
            {loading && <p>Loading sessions...</p>}
            {!loading && sessions.length === 0 && <p>No sessions found</p>}
            {!loading && sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSessionSelect(session)}
                style={{
                  padding: '15px',
                  margin: '10px 0',
                  border: selectedSession?.id === session.id ? '2px solid #6366f1' : '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedSession?.id === session.id ? '#f0f0ff' : 'white',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                  {session.subject}
                </div>
                <div style={{ fontSize: '0.85em', color: '#666' }}>
                  {session.location}
                </div>
                <div style={{ fontSize: '0.8em', color: '#999', marginTop: '5px' }}>
                  {new Date(session.startTime).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* Attendance Details */}
          <div>
            {!selectedSession && (
              <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                <h3>Select a session to view attendance</h3>
              </div>
            )}

            {selectedSession && (
              <>
                <h3 style={{ marginBottom: '20px' }}>{selectedSession.subject}</h3>
                
                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
                  <div className="dashboard__card" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#6366f1' }}>{stats.total}</div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>Total Students</div>
                  </div>
                  <div className="dashboard__card" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#10b981' }}>{stats.present}</div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>Present</div>
                  </div>
                  <div className="dashboard__card" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#f59e0b' }}>{stats.late}</div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>Late</div>
                  </div>
                  <div className="dashboard__card" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#ef4444' }}>{stats.absent}</div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>Absent</div>
                  </div>
                </div>

                <div className="dashboard__card" style={{ padding: '20px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>Attendance Rate</h4>
                  <div style={{ 
                    backgroundColor: '#f3f4f6', 
                    borderRadius: '8px', 
                    height: '30px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      backgroundColor: attendancePercentage >= 75 ? '#10b981' : attendancePercentage >= 50 ? '#f59e0b' : '#ef4444',
                      height: '100%',
                      width: `${attendancePercentage}%`,
                      transition: 'width 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {attendancePercentage}%
                    </div>
                  </div>
                </div>

                {/* Attendance Table */}
                <div className="dashboard__card" style={{ padding: '20px' }}>
                  <h4 style={{ marginTop: 0 }}>Student List</h4>
                  {loadingAttendance && <p>Loading attendance data...</p>}
                  {!loadingAttendance && attendanceData.length === 0 && (
                    <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                      No attendance records found for this session
                    </p>
                  )}
                  {!loadingAttendance && attendanceData.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Student Name</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Roll No</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Marked At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.map((record, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px' }}>{record.student_name || record.studentName || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>{record.student_roll_no || record.studentRollNo || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '0.85em',
                                fontWeight: '500',
                                backgroundColor: 
                                  record.status === 'present' ? '#d1fae5' : 
                                  record.status === 'late' ? '#fed7aa' : '#fee2e2',
                                color: 
                                  record.status === 'present' ? '#065f46' : 
                                  record.status === 'late' ? '#92400e' : '#991b1b'
                              }}>
                                {record.status || 'N/A'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontSize: '0.9em', color: '#666' }}>
                              {record.marked_at ? new Date(record.marked_at).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default FacultyAttendanceReports;
