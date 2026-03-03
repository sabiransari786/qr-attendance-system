/**
 * Notifications — ap__* unified design
 */

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, ShieldAlert, CheckCircle, TrendingDown, Camera,
  Lock, Bell, Inbox, Trash2, ArrowLeft, Eye, ChevronRight,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import '../styles/dashboard.css';
import '../styles/admin-pages.css';

const TYPE_STYLES = {
  success: { accent: '#319cb5', bg: 'rgba(49,156,181,0.07)', icon: 'rgba(49,156,181,0.12)' },
  warning: { accent: '#f59e0b', bg: 'rgba(245,158,11,0.06)', icon: 'rgba(245,158,11,0.12)' },
  error:   { accent: '#ef4444', bg: 'rgba(239,68,68,0.06)',   icon: 'rgba(239,68,68,0.12)' },
  info:    { accent: '#3b82f6', bg: 'rgba(59,130,246,0.06)',  icon: 'rgba(59,130,246,0.12)' },
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'alerts', label: 'Alerts' },
  { key: 'warnings', label: 'Warnings' },
  { key: 'success', label: 'Success' },
  { key: 'errors', label: 'Errors' },
];

function Notifications() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user?.id) fetchNotifications(); }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/attendance/student/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setNotifications(generateNotifications(data.data || [])); }
    } catch (err) { console.error('Error fetching notifications:', err); }
    finally { setLoading(false); }
  };

  const generateNotifications = (records) => {
    const notifs = [];
    const today = new Date().toISOString().split('T')[0];
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;

    if (pct < 75 && pct > 0)
      notifs.push({ id: 'low', type: 'warning', icon: <AlertTriangle size={18} />, title: 'Low Attendance Alert',
        message: `Your overall attendance is ${pct}%. You need at least 75% to avoid academic issues.`,
        actionText: 'View Details', actionLink: '/attendance-history', timestamp: new Date().toISOString(), unread: true });

    if (pct < 60 && pct > 0)
      notifs.push({ id: 'critical', type: 'error', icon: <ShieldAlert size={18} />, title: 'Critical Attendance Alert',
        message: `Your attendance is only ${pct}%. This may result in academic penalties.`,
        actionText: 'Take Action', actionLink: '/attendance-history', timestamp: new Date().toISOString(), unread: true });

    records.filter((r) => r.date?.startsWith(today)).forEach((r, i) => {
      notifs.push({ id: `today-${i}`, type: 'success', icon: <CheckCircle size={18} />, title: 'Attendance Confirmed',
        message: `Your attendance for ${r.subject} has been marked as ${r.status}.`,
        timestamp: r.marked_at || new Date().toISOString(), unread: false });
    });

    const subMap = {};
    records.forEach((r) => { const s = r.subject || 'Unknown'; if (!subMap[s]) subMap[s] = { t: 0, p: 0 }; subMap[s].t++; if (r.status === 'present') subMap[s].p++; });
    Object.keys(subMap).forEach((s, i) => {
      const sp = Math.round((subMap[s].p / subMap[s].t) * 100);
      if (sp < 75)
        notifs.push({ id: `sub-${i}`, type: 'warning', icon: <TrendingDown size={18} />, title: `${s} — Low Attendance`,
          message: `Only ${sp}% in this subject. Required: 75%.`, actionText: 'View Subject', actionLink: '/attendance-history',
          timestamp: new Date(Date.now() - i * 3600000).toISOString(), unread: true });
    });

    notifs.push({ id: 'qr-1', type: 'info', icon: <Camera size={18} />, title: 'QR Code Available',
      message: 'A new QR code is available for Data Structures class.', actionText: 'Scan Now', actionLink: '/scan-qr',
      timestamp: new Date(Date.now() - 1800000).toISOString(), unread: true });

    notifs.push({ id: 'sus-1', type: 'error', icon: <Lock size={18} />, title: 'Suspicious Activity Detected',
      message: 'Multiple login attempts detected from unknown device. Please verify your account.',
      actionText: 'Review Activity', actionLink: '/student-profile',
      timestamp: new Date(Date.now() - 86400000).toISOString(), unread: false });

    return notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const getFiltered = () => {
    if (filter === 'all') return notifications;
    const map = { alerts: ['info'], warnings: ['warning'], success: ['success'], errors: ['error'] };
    return notifications.filter((n) => map[filter]?.includes(n.type));
  };

  const markAsRead = (id) => setNotifications((p) => p.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  const markAllAsRead = () => setNotifications((p) => p.map((n) => ({ ...n, unread: false })));
  const deleteNotification = (id) => setNotifications((p) => p.filter((n) => n.id !== id));

  const fmtTs = (ts) => {
    const d = Date.now() - new Date(ts).getTime();
    const m = Math.floor(d / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(d / 3600000);
    if (h < 24) return `${h}h ago`;
    const dd = Math.floor(d / 86400000);
    if (dd < 7) return `${dd}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  const list = getFiltered();
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <div className="ap">
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>

      <div className="ap__inner" style={{ maxWidth: 800 }}>
        {/* Header */}
        <header className="ap__header">
          <div className="ap__header-left">
            <button className="ap__back-btn" onClick={() => navigate('/student-dashboard')}>
              <ArrowLeft size={18} /> Back
            </button>
            <p className="ap__eyebrow">Student &bull; Alerts</p>
            <h1 className="ap__title"><Bell size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />Notifications</h1>
            <p className="ap__subtitle">{unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up!'}</p>
          </div>
          {unread > 0 && (
            <button className="ap__btn ap__btn--outline" onClick={markAllAsRead} style={{ gap: 6 }}>
              <Eye size={15} /> Mark All Read
            </button>
          )}
        </header>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {FILTER_TABS.map((t) => (
            <button
              key={t.key}
              className={`ap__btn ${filter === t.key ? 'ap__btn--primary' : 'ap__btn--ghost'}`}
              onClick={() => setFilter(t.key)}
              style={{ padding: '0.45rem 1rem', fontSize: '0.84rem' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="ap__panel" style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Loading notifications…</p>
          </div>
        ) : list.length === 0 ? (
          <div className="ap__empty">
            <span className="ap__empty-icon"><Inbox size={42} /></span>
            <p className="ap__empty-title">No Notifications</p>
            <p className="ap__empty-text">You're all caught up!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <AnimatePresence mode="popLayout">
              {list.map((n, idx) => {
                const ts = TYPE_STYLES[n.type] || TYPE_STYLES.info;
                return (
                  <motion.div
                    key={n.id} layout
                    className="ap__panel"
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: n.unread ? 1 : 0.78, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 60, scale: 0.95 }}
                    transition={{ duration: 0.32, delay: idx * 0.04 }}
                    style={{ borderLeft: `3px solid ${ts.accent}`, padding: '1rem 1.2rem', position: 'relative' }}
                  >
                    {n.unread && (
                      <span style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: ts.accent, boxShadow: `0 0 8px ${ts.accent}55` }} />
                    )}

                    <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: ts.icon, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: ts.accent }}>
                        {n.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{n.title}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{fmtTs(n.timestamp)}</span>
                        </div>
                        <p style={{ margin: '0 0 0.65rem', fontSize: '0.85rem', lineHeight: 1.55, color: 'var(--color-text-secondary)' }}>{n.message}</p>
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {n.actionText && (
                            <button className="ap__btn ap__btn--primary" onClick={() => navigate(n.actionLink)} style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', gap: 4 }}>
                              {n.actionText} <ChevronRight size={13} />
                            </button>
                          )}
                          {n.unread && (
                            <button className="ap__btn ap__btn--ghost" onClick={() => markAsRead(n.id)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                              Mark read
                            </button>
                          )}
                          <button
                            className="ap__btn ap__btn--ghost"
                            onClick={() => deleteNotification(n.id)}
                            title="Delete"
                            style={{ marginLeft: 'auto', padding: '0.35rem', opacity: 0.5 }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
