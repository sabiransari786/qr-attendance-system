import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import { fadeInUp, fadeInDown, staggerContainer } from "../animations/animationConfig";
import "../styles/dashboard.css";

function SubjectAttendance() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const { subjectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [subjectData, setSubjectData] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    fetchSubjectData();
  }, [subjectId]);

  const fetchSubjectData = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const storedUser = sessionStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const userId = authContext?.user?.id || parsedUser?.id;

      // Fetch attendance data and filter by subject
      const response = await fetch(`${API_BASE_URL}/attendance/student/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        processSubjectData(data.data);
      } else {
        // Use sample data
        loadSampleData();
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching subject data:", error);
      loadSampleData();
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    const sampleSubjects = {
      1: {
        name: "Data Structures",
        code: "CS201",
        faculty: "Dr. John Smith",
        totalClasses: 25,
        attended: 22,
        absent: 2,
        late: 1,
        percentage: 88,
        records: [
          { date: "2024-01-15", status: "present", time: "09:00 AM" },
          { date: "2024-01-16", status: "present", time: "09:00 AM" },
          { date: "2024-01-17", status: "absent", time: "09:00 AM" },
          { date: "2024-01-18", status: "late", time: "09:00 AM" },
          { date: "2024-01-19", status: "present", time: "09:00 AM" }
        ]
      },
      2: {
        name: "Web Development",
        code: "CS301",
        faculty: "Prof. Jane Doe",
        totalClasses: 20,
        attended: 18,
        absent: 1,
        late: 1,
        percentage: 92,
        records: [
          { date: "2024-01-15", status: "present", time: "11:00 AM" },
          { date: "2024-01-16", status: "present", time: "11:00 AM" },
          { date: "2024-01-17", status: "present", time: "11:00 AM" },
          { date: "2024-01-18", status: "absent", time: "11:00 AM" },
          { date: "2024-01-19", status: "late", time: "11:00 AM" }
        ]
      },
      3: {
        name: "Database Management",
        code: "CS202",
        faculty: "Dr. Mike Johnson",
        totalClasses: 22,
        attended: 15,
        absent: 5,
        late: 2,
        percentage: 68,
        records: [
          { date: "2024-01-15", status: "present", time: "10:00 AM" },
          { date: "2024-01-16", status: "absent", time: "10:00 AM" },
          { date: "2024-01-17", status: "absent", time: "10:00 AM" },
          { date: "2024-01-18", status: "present", time: "10:00 AM" },
          { date: "2024-01-19", status: "late", time: "10:00 AM" }
        ]
      },
      4: {
        name: "Operating Systems",
        code: "CS302",
        faculty: "Prof. Sarah Williams",
        totalClasses: 18,
        attended: 15,
        absent: 2,
        late: 1,
        percentage: 85,
        records: [
          { date: "2024-01-16", status: "present", time: "02:00 PM" },
          { date: "2024-01-17", status: "late", time: "02:00 PM" },
          { date: "2024-01-18", status: "present", time: "02:00 PM" },
          { date: "2024-01-19", status: "absent", time: "02:00 PM" },
          { date: "2024-01-20", status: "present", time: "02:00 PM" }
        ]
      }
    };

    setSubjectData(sampleSubjects[subjectId] || sampleSubjects[1]);
  };

  const processSubjectData = (records) => {
    // Process real data here
    // For now, load sample data
    loadSampleData();
  };

  const getAttendanceStatusClass = (percentage) => {
    if (percentage >= 85) return "excellent";
    if (percentage >= 75) return "good";
    if (percentage >= 65) return "warning";
    return "critical";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present": return "✓";
      case "absent": return "✗";
      case "late": return "⏰";
      default: return "-";
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">Loading subject details...</div>
      </div>
    );
  }

  if (!subjectData) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">Subject not found</div>
      </div>
    );
  }

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
          <h1 className="dashboard__title">{subjectData.name}</h1>
          <p className="dashboard__subtitle">Code: {subjectData.code} | Faculty: {subjectData.faculty}</p>
        </div>
        <motion.button
          className="dashboard__button dashboard__button--secondary"
          onClick={() => navigate("/student/dashboard")}
          whileHover={{ scale: 1.04, y: -2, transition: { type: 'spring', stiffness: 320, damping: 24 } }}
          whileTap={{ scale: 0.96 }}
        >
          ← Back to Dashboard
        </motion.button>
      </motion.header>

      <main className="subject-detail-container">
        {/* Attendance Overview */}
        <section className="attendance-overview">
          <div className="overview-card large">
            <h2 className="section-title">Attendance Overview</h2>
            <div className="percentage-display">
              <span className={`percentage-large ${getAttendanceStatusClass(subjectData.percentage)}`}>
                {subjectData.percentage}%
              </span>
              <div className="progress-bar-container">
                <div 
                  className={`progress-bar ${getAttendanceStatusClass(subjectData.percentage)}`}
                  style={{ width: `${subjectData.percentage}%` }}
                ></div>
              </div>
            </div>
            {subjectData.percentage < 75 && (
              <div className="warning-message">
                ⚠️ Your attendance is below 75%. Attend more classes to improve.
              </div>
            )}
          </div>
        </section>

        {/* Statistics Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <span className="stat-label">Total Classes</span>
              <span className="stat-value">{subjectData.totalClasses}</span>
            </div>
          </div>
          <div className="stat-card present">
            <div className="stat-icon">✓</div>
            <div className="stat-info">
              <span className="stat-label">Present</span>
              <span className="stat-value">{subjectData.attended}</span>
            </div>
          </div>
          <div className="stat-card absent">
            <div className="stat-icon">✗</div>
            <div className="stat-info">
              <span className="stat-label">Absent</span>
              <span className="stat-value">{subjectData.absent}</span>
            </div>
          </div>
          <div className="stat-card late">
            <div className="stat-icon">⏰</div>
            <div className="stat-info">
              <span className="stat-label">Late</span>
              <span className="stat-value">{subjectData.late}</span>
            </div>
          </div>
        </section>

        {/* Attendance Records */}
        <section className="records-section">
          <h2 className="section-title">Recent Attendance</h2>
          <div className="records-list">
            {subjectData.records.map((record, index) => (
              <div key={index} className={`record-item ${record.status}`}>
                <div className="record-date">
                  <span className="date-day">{new Date(record.date).getDate()}</span>
                  <span className="date-month">
                    {new Date(record.date).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </div>
                <div className="record-details">
                  <span className="record-time">{record.time}</span>
                  <span className={`record-status status-${record.status}`}>
                    {getStatusIcon(record.status)} {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section className="recommendations-section">
          <h2 className="section-title">Recommendations</h2>
          <div className="recommendations-list">
            {subjectData.percentage < 75 ? (
              <>
                <div className="recommendation-item warning">
                  <span className="recommendation-icon">⚠️</span>
                  <p>You need to attend at least {Math.ceil((0.75 * subjectData.totalClasses) - subjectData.attended)} more classes to reach 75%</p>
                </div>
                <div className="recommendation-item">
                  <span className="recommendation-icon">💡</span>
                  <p>Try not to miss any upcoming classes</p>
                </div>
              </>
            ) : (
              <>
                <div className="recommendation-item success">
                  <span className="recommendation-icon">✓</span>
                  <p>Great! You're maintaining good attendance</p>
                </div>
                <div className="recommendation-item">
                  <span className="recommendation-icon">💡</span>
                  <p>Keep up the good work and maintain this level</p>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </motion.div>
  );
}

export default SubjectAttendance;
