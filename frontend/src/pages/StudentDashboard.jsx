import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/dashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState({
    name: "Student",
    studentId: "STU-0001",
    overallAttendance: 0,
    subjects: []
  });

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        navigate("/login");
        return;
      }

      // Fetch student attendance data
      const response = await fetch(`http://localhost:5001/api/attendance/student/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        processAttendanceData(data);
      } else {
        // Use fallback data
        setStudentData({
          name: localStorage.getItem("userName") || "Student",
          studentId: localStorage.getItem("studentId") || "STU-0001",
          overallAttendance: 85,
          subjects: [
            { id: 1, name: "Data Structures", attendance: 88, total: 25, attended: 22, status: "safe" },
            { id: 2, name: "Web Development", attendance: 92, total: 20, attended: 18, status: "safe" },
            { id: 3, name: "Database Management", attendance: 68, total: 22, attended: 15, status: "low" },
            { id: 4, name: "Operating Systems", attendance: 85, total: 18, attended: 15, status: "safe" }
          ]
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching student data:", error);
      setStudentData({
        name: localStorage.getItem("userName") || "Student",
        studentId: localStorage.getItem("studentId") || "STU-0001",
        overallAttendance: 85,
        subjects: [
          { id: 1, name: "Data Structures", attendance: 88, total: 25, attended: 22, status: "safe" },
          { id: 2, name: "Web Development", attendance: 92, total: 20, attended: 18, status: "safe" },
          { id: 3, name: "Database Management", attendance: 68, total: 22, attended: 15, status: "low" },
          { id: 4, name: "Operating Systems", attendance: 85, total: 18, attended: 15, status: "safe" }
        ]
      });
      setLoading(false);
    }
  };

  const processAttendanceData = (data) => {
    // Process API data to calculate attendance percentages
    const attendanceRecords = data.data || [];
    
    // Group by subject
    const subjectMap = {};
    attendanceRecords.forEach(record => {
      const subject = record.subject || "Unknown";
      if (!subjectMap[subject]) {
        subjectMap[subject] = { total: 0, attended: 0 };
      }
      subjectMap[subject].total++;
      if (record.status === "present" || record.status === "late") {
        subjectMap[subject].attended++;
      }
    });

    // Calculate percentages
    const subjects = Object.keys(subjectMap).map((subject, index) => {
      const { total, attended } = subjectMap[subject];
      const attendance = total > 0 ? Math.round((attended / total) * 100) : 0;
      return {
        id: index + 1,
        name: subject,
        attendance,
        total,
        attended,
        status: attendance >= 75 ? "safe" : "low"
      };
    });

    // Calculate overall attendance
    const totalClasses = attendanceRecords.length;
    const attendedClasses = attendanceRecords.filter(r => r.status === "present" || r.status === "late").length;
    const overallAttendance = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

    setStudentData({
      name: localStorage.getItem("userName") || "Student",
      studentId: localStorage.getItem("studentId") || "STU-0001",
      overallAttendance,
      subjects
    });
  };

  const getAttendanceStatusClass = (percentage) => {
    if (percentage >= 85) return "excellent";
    if (percentage >= 75) return "good";
    if (percentage >= 65) return "warning";
    return "critical";
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Welcome, {studentData.name}</h1>
          <p className="dashboard__subtitle">Student ID: {studentData.studentId}</p>
        </div>
        <div className="header-actions">
          <button
            className="dashboard__button dashboard__button--secondary"
            onClick={() => navigate("/student/profile")}
          >
            👤 Profile
          </button>
          <button
            className="dashboard__button dashboard__button--secondary"
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="student-dashboard">
        {/* Overall Attendance Summary */}
        <section className="attendance-summary">
          <h2 className="section-title">Overall Attendance</h2>
          <div className="attendance-card-large">
            <div className="attendance-percentage">
              <span className={`percentage-value ${getAttendanceStatusClass(studentData.overallAttendance)}`}>
                {studentData.overallAttendance}%
              </span>
            </div>
            <div className="attendance-progress">
              <div 
                className={`progress-bar ${getAttendanceStatusClass(studentData.overallAttendance)}`}
                style={{ width: `${studentData.overallAttendance}%` }}
              ></div>
            </div>
            <p className="attendance-status">
              {studentData.overallAttendance >= 75 
                ? "✓ You're doing great!" 
                : "⚠ Attendance below 75%"}
            </p>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <h2 className="section-title">Quick Actions</h2>
          <div className="action-buttons">
            <Link to="/student/scan-qr" className="action-btn action-btn--primary">
              <span>📱</span> Scan QR Code
            </Link>
            <Link to="/student/attendance-history" className="action-btn action-btn--secondary">
              <span>📊</span> View History
            </Link>
          </div>
        </section>

        {/* Subject-wise Attendance */}
        <section className="subject-attendance">
          <h2 className="section-title">Subject-wise Attendance</h2>
          <div className="subjects-grid">
            {studentData.subjects.map(subject => (
              <Link 
                key={subject.id} 
                to={`/student/subject/${subject.id}`}
                className={`subject-card ${subject.status}`}
              >
                <div className="subject-header">
                  <h3 className="subject-name">{subject.name}</h3>
                  {subject.status === "low" && (
                    <span className="low-attendance-badge">⚠ Low</span>
                  )}
                </div>
                <div className="subject-stats">
                  <div className="stat">
                    <span className="stat-label">Attendance</span>
                    <span className={`stat-value ${getAttendanceStatusClass(subject.attendance)}`}>
                      {subject.attendance}%
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Classes</span>
                    <span className="stat-value">{subject.attended}/{subject.total}</span>
                  </div>
                </div>
                <div className="subject-progress">
                  <div 
                    className={`progress-bar ${getAttendanceStatusClass(subject.attendance)}`}
                    style={{ width: `${subject.attendance}%` }}
                  ></div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Tips Section */}
        <section className="tips-section">
          <h2 className="section-title">Quick Tips</h2>
          <div className="tips-grid">
            <div className="tip-card">
              <span className="tip-icon">💡</span>
              <p>Maintain at least 75% attendance to avoid penalties</p>
            </div>
            <div className="tip-card">
              <span className="tip-icon">📱</span>
              <p>Scan QR code within 5 minutes of class start</p>
            </div>
            <div className="tip-card">
              <span className="tip-icon">📊</span>
              <p>Check your attendance regularly to stay on track</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;
