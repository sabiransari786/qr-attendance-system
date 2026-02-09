import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { logout } from "../services/api";
import { API_BASE_URL } from "../utils/constants";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import "../styles/dashboard.css";
import "../styles/enhanced-dashboard.css";

function StudentDashboardWithRecords() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const token = authContext?.token;

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    attendancePercentage: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch student's attendance records
  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      try {
        setLoading(true);
        
        // Fetch sessions to display attendance data
        const response = await fetch(`${API_BASE_URL}/session`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const sessions = data.data || data || [];
          
          // Create mock attendance data for student
          // In production, this would come from a dedicated student attendance endpoint
          const mockAttendanceData = sessions.map(session => {
            const statuses = ['present', 'late', 'absent'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            return {
              id: `${session.id}-${user?.id}`,
              sessionId: session.id,
              studentId: user?.id,
              sessionName: session.subject,
              location: session.location,
              status: randomStatus,
              markedAt: new Date(Math.random() * Date.now()).toISOString(),
              sessionDate: new Date(session.startTime),
              sessionStatus: session.status
            };
          });

          setAttendanceRecords(mockAttendanceData);

          // Calculate statistics
          const presentCount = mockAttendanceData.filter(r => r.status === 'present').length;
          const lateCount = mockAttendanceData.filter(r => r.status === 'late').length;
          const absentCount = mockAttendanceData.filter(r => r.status === 'absent').length;
          const totalSessions = mockAttendanceData.length;
          const attendancePercentage = totalSessions > 0 
            ? Math.round((presentCount / totalSessions) * 100) 
            : 0;

          setStats({
            totalSessions,
            presentCount,
            lateCount,
            absentCount,
            attendancePercentage
          });

          // Prepare chart data
          const chartDataByStatus = [
            { status: 'Present', count: presentCount, fill: '#4CAF50' },
            { status: 'Late', count: lateCount, fill: '#FF9800' },
            { status: 'Absent', count: absentCount, fill: '#F44336' }
          ];
          setChartData(chartDataByStatus);

          // Prepare pie data
          const filteredPieData = chartDataByStatus.filter(d => d.count > 0);
          setPieData(filteredPieData);
        }
      } catch (error) {
        console.error('Error fetching attendance records:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token && user?.id) {
      fetchAttendanceRecords();
    }
  }, [token, user?.id]);

  const handleLogout = async () => {
    try {
      if (token) {
        await logout(token);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      authContext?.logout();
      navigate("/login");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return '#4CAF50';
      case 'late':
        return '#FF9800';
      case 'absent':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return '✅';
      case 'late':
        return '⏰';
      case 'absent':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">👨‍🎓 Student Dashboard</h1>
          <p className="dashboard__subtitle">
            Welcome back, <strong>{user?.name}</strong>! Track your attendance and view your academic records.
          </p>
        </div>
        <button
          className="dashboard__button dashboard__button--secondary"
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <main className="dashboard__content">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            ⏳ Loading your attendance records...
          </div>
        ) : (
          <>
            {/* Attendance Statistics Cards */}
            <section className="dashboard__stats-grid">
              <div className="stat-card stat-card--primary">
                <div className="stat-card__icon">📚</div>
                <div className="stat-card__content">
                  <div className="stat-card__label">Total Sessions</div>
                  <div className="stat-card__value">{stats.totalSessions}</div>
                  <div className="stat-card__detail">Classes attended</div>
                </div>
              </div>

              <div className="stat-card stat-card--success">
                <div className="stat-card__icon">✅</div>
                <div className="stat-card__content">
                  <div className="stat-card__label">Present</div>
                  <div className="stat-card__value">{stats.presentCount}</div>
                  <div className="stat-card__detail">
                    {stats.totalSessions > 0 ? Math.round((stats.presentCount / stats.totalSessions) * 100) : 0}%
                  </div>
                </div>
              </div>

              <div className="stat-card stat-card--warning">
                <div className="stat-card__icon">⏰</div>
                <div className="stat-card__content">
                  <div className="stat-card__label">Late</div>
                  <div className="stat-card__value">{stats.lateCount}</div>
                  <div className="stat-card__detail">
                    {stats.totalSessions > 0 ? Math.round((stats.lateCount / stats.totalSessions) * 100) : 0}%
                  </div>
                </div>
              </div>

              <div className="stat-card stat-card--danger">
                <div className="stat-card__icon">❌</div>
                <div className="stat-card__content">
                  <div className="stat-card__label">Absent</div>
                  <div className="stat-card__value">{stats.absentCount}</div>
                  <div className="stat-card__detail">
                    {stats.totalSessions > 0 ? Math.round((stats.absentCount / stats.totalSessions) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Overall Attendance Percentage */}
              <div className="stat-card stat-card--accent">
                <div className="stat-card__icon">📊</div>
                <div className="stat-card__content">
                  <div className="stat-card__label">Overall Attendance</div>
                  <div className="stat-card__value">{stats.attendancePercentage}%</div>
                  <div 
                    className="stat-card__progress-bar"
                    style={{
                      height: '4px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '2px',
                      marginTop: '0.5rem',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${stats.attendancePercentage}%`,
                        backgroundColor: stats.attendancePercentage >= 75 ? '#4CAF50' : 
                                          stats.attendancePercentage >= 50 ? '#FF9800' : '#F44336',
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Charts Section */}
            {attendanceRecords.length > 0 && (
              <section className="dashboard__charts">
                {/* Attendance Status Distribution */}
                <div className="chart-container chart-container--medium">
                  <h2 className="chart-title">Attendance Distribution</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2196F3" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Attendance Pie Chart */}
                {pieData.length > 0 && (
                  <div className="chart-container chart-container--medium">
                    <h2 className="chart-title">Attendance Breakdown</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ status, count }) => `${status}: ${count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
            )}

            {/* Attendance Records Table */}
            {attendanceRecords.length > 0 && (
              <section className="dashboard__records">
                <h2 className="section-title">📋 Your Attendance Records</h2>
                <div className="table-responsive">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Session</th>
                        <th>Location</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords
                        .sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate))
                        .map((record) => (
                          <tr key={record.id}>
                            <td className="td-bold">{record.sessionName}</td>
                            <td>{record.location}</td>
                            <td>{new Date(record.sessionDate).toLocaleDateString()}</td>
                            <td>
                              <span 
                                className="status-badge"
                                style={{
                                  backgroundColor: `${getStatusColor(record.status)}20`,
                                  color: getStatusColor(record.status),
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '0.25rem',
                                  fontWeight: '500',
                                  display: 'inline-block'
                                }}
                              >
                                {getStatusIcon(record.status)} {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </td>
                            <td style={{ color: 'var(--color-text-secondary)' }}>
                              {record.sessionStatus === 'active' ? '🟢 Active' : '🔴 Closed'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Statistics */}
                <div className="records-summary" style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderRadius: '0.5rem',
                  borderLeft: '4px solid var(--primary-accent)'
                }}>
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                    <strong>Summary:</strong> You have attended {stats.totalSessions} sessions with {stats.presentCount} present, {stats.lateCount} late, and {stats.absentCount} absent marks. Your overall attendance percentage is <strong style={{ color: '#2196F3' }}>{stats.attendancePercentage}%</strong>.
                  </p>
                </div>
              </section>
            )}

            {attendanceRecords.length === 0 && !loading && (
              <section className="empty-state">
                <div className="empty-state__icon">📚</div>
                <h3 className="empty-state__title">No Attendance Records Yet</h3>
                <p className="empty-state__text">Your attendance records will appear here as you join class sessions.</p>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default StudentDashboardWithRecords;
