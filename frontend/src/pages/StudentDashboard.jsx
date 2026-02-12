import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/dashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Sample data - will be replaced with real API data
  const attendanceStats = {
    overall: 85,
    present: 34,
    total: 40,
    subjects: [
      { name: 'Data Structures', percentage: 90, present: 9, total: 10 },
      { name: 'Web Development', percentage: 85, present: 17, total: 20 },
      { name: 'Operating Systems', percentage: 75, present: 8, total: 10 }
    ]
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 85) return '#10b981';
    if (percentage >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 85) return 'Excellent';
    if (percentage >= 75) return 'Good';
    return 'Low';
  };

  return (
    <div className="dashboard">
      <div className="dashboard__objects" aria-hidden="true">
        <span className="dashboard__object dashboard__object--sphere" />
        <span className="dashboard__object dashboard__object--torus" />
        <span className="dashboard__object dashboard__object--diamond" />
      </div>
      
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">
            <span style={{ fontSize: '2rem', marginRight: '0.5rem' }}>👨‍🎓</span>
            Student Dashboard
          </h1>
          <p className="dashboard__subtitle">
            Welcome back, <strong>{user?.name}</strong>!
          </p>
        </div>
        <div style={{ 
          textAlign: 'right',
          fontSize: '0.9rem',
          color: 'var(--color-text-secondary)'
        }}>
          <div style={{ fontWeight: '600', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
            {formatTime(currentTime)}
          </div>
          <div>{formatDate(currentTime)}</div>
        </div>
      </header>

      {/* Overall Stats Banner */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(49, 156, 181, 0.15) 0%, rgba(49, 156, 181, 0.05) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(49, 156, 181, 0.2)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: '700',
              background: `linear-gradient(135deg, ${getAttendanceColor(attendanceStats.overall)}, var(--color-primary))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem'
            }}>
              {attendanceStats.overall}%
            </div>
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'var(--color-text-secondary)',
              marginBottom: '0.25rem'
            }}>
              Overall Attendance
            </div>
            <div style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600',
              background: `${getAttendanceColor(attendanceStats.overall)}20`,
              color: getAttendanceColor(attendanceStats.overall)
            }}>
              {getAttendanceStatus(attendanceStats.overall)}
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: '700',
              color: 'var(--color-primary)',
              marginBottom: '0.5rem'
            }}>
              {attendanceStats.present}
            </div>
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'var(--color-text-secondary)'
            }}>
              Classes Attended
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '3rem', 
              fontWeight: '700',
              color: 'var(--color-primary)',
              marginBottom: '0.5rem'
            }}>
              {attendanceStats.total}
            </div>
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'var(--color-text-secondary)'
            }}>
              Total Classes
            </div>
          </div>
        </div>
      </section>

      <main className="dashboard__grid" aria-label="Student overview">
        {/* Scan QR - Primary Action (Full Width) */}
        <section 
          className="dashboard__card" 
          style={{ 
            gridColumn: 'span 3',
            background: 'linear-gradient(135deg, rgba(49, 156, 181, 0.15) 0%, rgba(49, 156, 181, 0.08) 100%)',
            border: '2px solid rgba(49, 156, 181, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onClick={() => navigate("/scan-qr")}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 20px 60px rgba(49, 156, 181, 0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2rem'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '3.5rem',
                  background: 'linear-gradient(135deg, var(--color-primary), rgba(49, 156, 181, 0.6))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1
                }}>
                  📱
                </div>
                <div>
                  <h2 className="dashboard__card-title" style={{ marginBottom: '0.5rem' }}>
                    Scan QR Code
                  </h2>
                  <p className="dashboard__card-text" style={{ margin: 0 }}>
                    Mark your attendance by scanning the QR code displayed by your faculty
                  </p>
                </div>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(49, 156, 181, 0.15)',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: 'var(--color-primary)'
              }}>
                <span>✓</span> Quick & Easy Attendance
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/scan-qr");
              }}
              style={{
                padding: '1.25rem 2.5rem',
                background: 'linear-gradient(135deg, var(--color-primary), rgba(49, 156, 181, 0.8))',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '700',
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 20px rgba(49, 156, 181, 0.3)',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(49, 156, 181, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(49, 156, 181, 0.3)';
              }}
            >
              Open Scanner →
            </button>
          </div>
        </section>

        {/* Quick Actions Card */}
        <section className="dashboard__card" style={{ 
          background: 'linear-gradient(135deg, rgba(49, 156, 181, 0.1) 0%, rgba(204, 245, 254, 0.05) 100%)'
        }}>
          <h2 className="dashboard__card-title" style={{ marginBottom: '1.5rem' }}>
            ⚡ Quick Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            
            <button
              onClick={() => navigate("/attendance-history")}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(49, 156, 181, 0.1)',
                border: '1px solid rgba(49, 156, 181, 0.3)',
                borderRadius: '12px',
                color: 'var(--color-text)',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(49, 156, 181, 0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(49, 156, 181, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>📊</span>
              View History
            </button>
            
            <button
              onClick={() => navigate("/student-profile")}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(49, 156, 181, 0.1)',
                border: '1px solid rgba(49, 156, 181, 0.3)',
                borderRadius: '12px',
                color: 'var(--color-text)',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(49, 156, 181, 0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(49, 156, 181, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>👤</span>
              My Profile
            </button>
          </div>
        </section>

        {/* Subject-wise Attendance Card */}
        <section 
          className="dashboard__card"
          style={{
            gridColumn: 'span 2',
            background: 'linear-gradient(135deg, rgba(49, 156, 181, 0.08) 0%, rgba(204, 245, 254, 0.03) 100%)'
          }}
        >
          <h2 className="dashboard__card-title" style={{ marginBottom: '1.5rem' }}>
            📚 Subject-wise Attendance
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {attendanceStats.subjects.map((subject, index) => (
              <div 
                key={index}
                style={{
                  padding: '1.25rem',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.borderColor = 'var(--border-soft)';
                }}
                onClick={() => navigate("/attendance-history")}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '600',
                    color: 'var(--color-text)'
                  }}>
                    {subject.name}
                  </h3>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: getAttendanceColor(subject.percentage)
                  }}>
                    {subject.percentage}%
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div style={{
                    flex: 1,
                    height: '8px',
                    background: 'rgba(49, 156, 181, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${subject.percentage}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${getAttendanceColor(subject.percentage)}, var(--color-primary))`,
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  <span style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-text-secondary)',
                    whiteSpace: 'nowrap'
                  }}>
                    {subject.present}/{subject.total} classes
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/attendance-history")}
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              width: '100%',
              background: 'transparent',
              border: '1px solid rgba(49, 156, 181, 0.3)',
              borderRadius: '12px',
              color: 'var(--color-primary)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(49, 156, 181, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            View All Subjects →
          </button>
        </section>

        {/* Today's Schedule Card */}
        <section className="dashboard__card" style={{
          gridColumn: 'span 3',
          background: 'linear-gradient(135deg, rgba(49, 156, 181, 0.08) 0%, rgba(204, 245, 254, 0.03) 100%)'
        }}>
          <h2 className="dashboard__card-title" style={{ marginBottom: '1.5rem' }}>
            📅 Today's Sessions
          </h2>
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--color-text-secondary)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>
              📭
            </div>
            <p style={{ fontSize: '1rem' }}>
              No sessions scheduled for today
            </p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Check back later or contact your faculty for updates
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;
