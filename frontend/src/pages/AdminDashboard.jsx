import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/dashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  
  // State for students view
  const [showStudents, setShowStudents] = useState(false);
  const [students, setStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Fetch students data
  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const response = await fetch('http://localhost:5001/api/auth/students', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authContext?.token}`
        }
      });
      
      const data = await response.json();
      if (data.success && data.data) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      // Fallback: show mock data
      setStudents([
        { id: 2, name: 'Student', email: 'student@demo.com', student_id: 'STU-0001' },
        { id: 7, name: 'Rahul Singh', email: 'rahul@demo.com', student_id: 'STU-0002' },
        { id: 8, name: 'Priya Verma', email: 'priya@demo.com', student_id: 'STU-0003' },
        { id: 9, name: 'Amit Patel', email: 'amit@demo.com', student_id: 'STU-0004' },
        { id: 10, name: 'Neha Gupta', email: 'neha@demo.com', student_id: 'STU-0005' }
      ]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (showStudents && students.length === 0) {
      fetchStudents();
    }
  }, [showStudents]);

  return (
    <div className="dashboard">
      <div className="dashboard__objects" aria-hidden="true">
        <span className="dashboard__object dashboard__object--sphere" />
        <span className="dashboard__object dashboard__object--torus" />
        <span className="dashboard__object dashboard__object--diamond" />
      </div>
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Admin Dashboard</h1>
          <p className="dashboard__subtitle">
            Welcome, {user?.name}! Oversee platform access, departments, and system-level reporting.
          </p>
        </div>
      </header>

      <main className="dashboard__grid" aria-label="Admin overview">
        <section className="dashboard__card" onClick={() => { setShowStudents(!showStudents); }} style={{ cursor: 'pointer' }}>
          <h2 className="dashboard__card-title">📚 View Students ({students.length || '...'})</h2>
          <p className="dashboard__card-text">Click to view all registered students in the system.</p>
        </section>

        <section className="dashboard__card">
          <h2 className="dashboard__card-title">Manage Users</h2>
          <p className="dashboard__card-text">User provisioning and roles will be managed here.</p>
        </section>

        <section className="dashboard__card">
          <h2 className="dashboard__card-title">Manage Departments/Courses</h2>
          <p className="dashboard__card-text">Department and course data will be configured here.</p>
        </section>

        <section className="dashboard__card">
          <h2 className="dashboard__card-title">System Reports</h2>
          <p className="dashboard__card-text">System health and analytics dashboards will appear here.</p>
        </section>

        {/* Students List View */}
        {showStudents && (
          <section className="dashboard__students-view" style={{ gridColumn: '1 / -1' }}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#319CB5' }}>
                  📊 Student List ({isLoadingStudents ? 'Loading...' : students.length})
                </h3>
                <button 
                  onClick={() => setShowStudents(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#319CB5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Close
                </button>
              </div>

              {isLoadingStudents ? (
                <p style={{ textAlign: 'center', color: '#666' }}>Loading student data...</p>
              ) : students.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    marginTop: '10px'
                  }}>
                    <thead>
                      <tr style={{ background: '#f0f5fa', borderBottom: '2px solid #319CB5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#319CB5' }}>ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#319CB5' }}>Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#319CB5' }}>Email</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#319CB5' }}>Roll Number</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={student.id} style={{
                          borderBottom: '1px solid #e0e0e0',
                          background: index % 2 === 0 ? '#ffffff' : '#f9fbfc',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f5fa'}
                        onMouseLeave={(e) => e.currentTarget.style.background = (index % 2 === 0 ? '#ffffff' : '#f9fbfc')}
                        >
                          <td style={{ padding: '12px' }}>#{student.id}</td>
                          <td style={{ padding: '12px' }}>{student.name}</td>
                          <td style={{ padding: '12px', color: '#666', fontSize: '0.9rem' }}>{student.email}</td>
                          <td style={{ padding: '12px', fontWeight: '500', color: '#319CB5' }}>{student.student_id || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#999' }}>No students found</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
