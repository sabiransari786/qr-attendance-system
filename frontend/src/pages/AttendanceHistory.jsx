import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

function AttendanceHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [filters, setFilters] = useState({
    subject: "all",
    status: "all",
    dateFrom: "",
    dateTo: ""
  });
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, attendanceRecords]);

  const fetchAttendanceHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        navigate("/login");
        return;
      }

      const response = await fetch(`http://localhost:5001/api/attendance/student/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const records = data.data || [];
        setAttendanceRecords(records);
        
        // Extract unique subjects
        const uniqueSubjects = [...new Set(records.map(r => r.subject))];
        setSubjects(uniqueSubjects);
      } else {
        // Use sample data for demonstration
        const sampleData = [
          { id: 1, subject: "Data Structures", date: "2024-01-15", time: "09:00 AM", status: "present", markedAt: "09:05 AM" },
          { id: 2, subject: "Web Development", date: "2024-01-15", time: "11:00 AM", status: "present", markedAt: "11:03 AM" },
          { id: 3, subject: "Database Management", date: "2024-01-16", time: "10:00 AM", status: "absent", markedAt: "-" },
          { id: 4, subject: "Operating Systems", date: "2024-01-16", time: "02:00 PM", status: "late", markedAt: "02:12 PM" },
          { id: 5, subject: "Data Structures", date: "2024-01-17", time: "09:00 AM", status: "present", markedAt: "09:02 AM" }
        ];
        setAttendanceRecords(sampleData);
        setSubjects(["Data Structures", "Web Development", "Database Management", "Operating Systems"]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...attendanceRecords];

    // Filter by subject
    if (filters.subject !== "all") {
      filtered = filtered.filter(record => record.subject === filters.subject);
    }

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter(record => record.status === filters.status);
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(record => 
        new Date(record.date) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(record => 
        new Date(record.date) <= new Date(filters.dateTo)
      );
    }

    setFilteredRecords(filtered);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      subject: "all",
      status: "all",
      dateFrom: "",
      dateTo: ""
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present": return "✓";
      case "absent": return "✗";
      case "late": return "⏰";
      default: return "-";
    }
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">Loading attendance history...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard__objects" aria-hidden="true">
        <span className="dashboard__object dashboard__object--sphere" />
        <span className="dashboard__object dashboard__object--torus" />
        <span className="dashboard__object dashboard__object--diamond" />
      </div>
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Attendance History</h1>
          <p className="dashboard__subtitle">View your complete attendance records</p>
        </div>
        <button
          className="dashboard__button dashboard__button--secondary"
          onClick={() => navigate("/student/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </header>

      <main className="attendance-history-container">
        {/* Filters Section */}
        <section className="filters-section">
          <h2 className="section-title">Filters</h2>
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Subject</label>
              <select 
                className="filter-select"
                value={filters.subject}
                onChange={(e) => handleFilterChange("subject", e.target.value)}
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select 
                className="filter-select"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">From Date</label>
              <input 
                type="date"
                className="filter-input"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">To Date</label>
              <input 
                type="date"
                className="filter-input"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>

            <div className="filter-actions">
              <button 
                className="action-btn action-btn--secondary"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </section>

        {/* Summary Section */}
        <section className="summary-section">
          <div className="summary-cards">
            <div className="summary-card">
              <span className="summary-label">Total Classes</span>
              <span className="summary-value">{filteredRecords.length}</span>
            </div>
            <div className="summary-card present">
              <span className="summary-label">Present</span>
              <span className="summary-value">
                {filteredRecords.filter(r => r.status === "present").length}
              </span>
            </div>
            <div className="summary-card absent">
              <span className="summary-label">Absent</span>
              <span className="summary-value">
                {filteredRecords.filter(r => r.status === "absent").length}
              </span>
            </div>
            <div className="summary-card late">
              <span className="summary-label">Late</span>
              <span className="summary-value">
                {filteredRecords.filter(r => r.status === "late").length}
              </span>
            </div>
          </div>
        </section>

        {/* Records Table */}
        <section className="records-section">
          <h2 className="section-title">
            Records ({filteredRecords.length})
          </h2>
          {filteredRecords.length === 0 ? (
            <div className="no-records">
              <p>No attendance records found</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Marked At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(record => (
                    <tr key={record.id}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>{record.subject}</td>
                      <td>{record.time}</td>
                      <td>
                        <span className={getStatusClass(record.status)}>
                          {getStatusIcon(record.status)} {record.status}
                        </span>
                      </td>
                      <td>{record.markedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AttendanceHistory;
