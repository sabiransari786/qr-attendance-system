import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import "../styles/dashboard.css";
import "../styles/enhanced-dashboard.css";

function Notifications() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, alerts, warnings, success
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      
      // Fetch attendance data to generate notifications
      const response = await fetch(`${API_BASE_URL}/attendance/student/${user.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const records = data.data || [];
        const generatedNotifications = generateNotifications(records);
        setNotifications(generatedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNotifications = (records) => {
    const notifs = [];
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate overall attendance
    const totalClasses = records.length;
    const presentClasses = records.filter(r => r.status === 'present').length;
    const overallPercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    // Low attendance warning
    if (overallPercentage < 75 && overallPercentage > 0) {
      notifs.push({
        id: 'low-attendance',
        type: 'warning',
        icon: '⚠️',
        title: 'Low Attendance Alert',
        message: `Your overall attendance is ${overallPercentage}%. You need at least 75% to avoid academic issues.`,
        actionText: 'View Details',
        actionLink: '/attendance-history',
        timestamp: new Date().toISOString(),
        unread: true
      });
    }

    // Critical attendance warning
    if (overallPercentage < 60 && overallPercentage > 0) {
      notifs.push({
        id: 'critical-attendance',
        type: 'error',
        icon: '🚨',
        title: 'Critical Attendance Alert',
        message: `URGENT: Your attendance is only ${overallPercentage}%. This may result in academic penalties.`,
        actionText: 'Take Action',
        actionLink: '/attendance-history',
        timestamp: new Date().toISOString(),
        unread: true
      });
    }

    // Recent attendance marked
    const todayRecords = records.filter(r => r.date?.startsWith(today));
    todayRecords.forEach((record, idx) => {
      notifs.push({
        id: `today-${idx}`,
        type: 'success',
        icon: '✅',
        title: 'Attendance Confirmed',
        message: `Your attendance for ${record.subject} has been marked as ${record.status}.`,
        timestamp: record.marked_at || new Date().toISOString(),
        unread: false
      });
    });

    // Subject-wise warnings
    const subjectMap = {};
    records.forEach(record => {
      const subject = record.subject || 'Unknown';
      if (!subjectMap[subject]) {
        subjectMap[subject] = { total: 0, present: 0 };
      }
      subjectMap[subject].total++;
      if (record.status === 'present') subjectMap[subject].present++;
    });

    Object.keys(subjectMap).forEach((subject, idx) => {
      const percentage = Math.round((subjectMap[subject].present / subjectMap[subject].total) * 100);
      if (percentage < 75) {
        notifs.push({
          id: `subject-${idx}`,
          type: 'warning',
          icon: '📉',
          title: `${subject} - Low Attendance`,
          message: `Only ${percentage}% attendance in this subject. Required: 75%.`,
          actionText: 'View Subject',
          actionLink: '/attendance-history',
          timestamp: new Date(Date.now() - idx * 3600000).toISOString(),
          unread: true
        });
      }
    });

    // Mock: QR request alerts
    notifs.push({
      id: 'qr-request-1',
      type: 'info',
      icon: '📷',
      title: 'QR Code Available',
      message: 'A new QR code is available for Data Structures class.',
      actionText: 'Scan Now',
      actionLink: '/scan-qr',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      unread: true
    });

    // Mock: Suspicious activity notice
    notifs.push({
      id: 'suspicious-1',
      type: 'error',
      icon: '🔒',
      title: 'Suspicious Activity Detected',
      message: 'Multiple login attempts detected from unknown device. Please verify your account.',
      actionText: 'Review Activity',
      actionLink: '/student-profile',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      unread: false
    });

    // Sort by timestamp (newest first)
    return notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    
    const typeMap = {
      'alerts': ['info'],
      'warnings': ['warning'],
      'success': ['success'],
      'errors': ['error']
    };
    
    return notifications.filter(n => typeMap[filter]?.includes(n.type));
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, unread: false } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getNotificationStyle = (type) => {
    const styles = {
      success: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
      warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
      error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
      info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }
    };
    return styles[type] || styles.info;
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="dashboard">
      <div className="dashboard__objects" aria-hidden="true">
        <span className="dashboard__object dashboard__object--sphere" />
        <span className="dashboard__object dashboard__object--torus" />
      </div>

      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">🔔 Notifications</h1>
          <p className="dashboard__subtitle">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="dashboard__buttons">
          {unreadCount > 0 && (
            <button
              className="dashboard__button dashboard__button--primary"
              onClick={markAllAsRead}
            >
              Mark All as Read
            </button>
          )}
          <button
            className="dashboard__button dashboard__button--secondary"
            onClick={() => navigate("/student-dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="dashboard__content">
        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          {['all', 'alerts', 'warnings', 'success', 'errors'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: filter === f ? '2px solid #667eea' : '2px solid #e5e7eb',
                background: filter === f ? '#667eea' : 'white',
                color: filter === f ? 'white' : '#666',
                fontWeight: filter === f ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            ⏳ Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="dashboard__card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
            <h2 style={{ marginBottom: '0.5rem', color: '#666' }}>No Notifications</h2>
            <p style={{ color: '#999' }}>You're all caught up!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredNotifications.map(notification => {
              const style = getNotificationStyle(notification.type);
              return (
                <div
                  key={notification.id}
                  className="dashboard__card"
                  style={{
                    background: style.bg,
                    borderLeft: `4px solid ${style.border}`,
                    position: 'relative',
                    opacity: notification.unread ? 1 : 0.8
                  }}
                >
                  {notification.unread && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#ef4444'
                    }} />
                  )}
                  
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ fontSize: '2rem', flexShrink: 0 }}>
                      {notification.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontWeight: '600', 
                        marginBottom: '0.5rem',
                        color: style.text 
                      }}>
                        {notification.title}
                      </h3>
                      <p style={{ 
                        marginBottom: '0.75rem',
                        color: style.text,
                        lineHeight: '1.6'
                      }}>
                        {notification.message}
                      </p>
                      <div style={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          color: '#666' 
                        }}>
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {notification.actionText && (
                          <button
                            onClick={() => navigate(notification.actionLink)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: style.border,
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            {notification.actionText} →
                          </button>
                        )}
                        {notification.unread && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: 'transparent',
                              color: style.text,
                              border: `1px solid ${style.border}`,
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              cursor: 'pointer'
                            }}
                          >
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          style={{
                            marginLeft: 'auto',
                            padding: '0.5rem',
                            background: 'transparent',
                            color: '#999',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1.25rem'
                          }}
                          title="Delete notification"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default Notifications;
