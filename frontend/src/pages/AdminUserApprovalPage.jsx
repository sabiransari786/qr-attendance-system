import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import Toast from "../components/Toast";
import "../styles/admin-approval-page.css";

function AdminUserApprovalPage() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [registrationFilter, setRegistrationFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState("list");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    role: "student",
    studentId: "",
    teacherId: "",
    department: "",
    semester: "",
    section: ""
  });

  // Fetch approved users
  const fetchApprovedUsers = async () => {
    setIsLoading(true);
    try {
      let url = `${API_BASE_URL}/auth/admin/approved-users`;
      if (roleFilter !== "all") {
        url += `?role=${roleFilter}`;
      }
      if (registrationFilter !== "all") {
        url += `${url.includes("?") ? "&" : "?"}isRegistered=${registrationFilter === "registered"}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authContext?.token}`
        }
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setApprovedUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching approved users:", error);
      setToast({
        type: "error",
        message: "Failed to fetch approved users"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add approved user
  const handleAddApprovedUser = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.email || !formData.contactNumber) {
      setToast({
        type: "error",
        message: "Please fill in all required fields"
      });
      return;
    }

    if (formData.role === "student" && !formData.studentId) {
      setToast({
        type: "error",
        message: "Student ID is required for student role"
      });
      return;
    }

    if (formData.role === "faculty" && !formData.teacherId) {
      setToast({
        type: "error",
        message: "Teacher ID is required for faculty role"
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/approved-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authContext?.token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          type: "success",
          message: "User approved successfully!"
        });
        setFormData({
          name: "",
          email: "",
          contactNumber: "",
          role: "student",
          studentId: "",
          teacherId: "",
          department: "",
          semester: "",
          section: ""
        });
        setActiveTab("list");
        fetchApprovedUsers();
      } else {
        setToast({
          type: "error",
          message: data.message || "Failed to add approved user"
        });
      }
    } catch (error) {
      console.error("Error adding approved user:", error);
      setToast({
        type: "error",
        message: "Error adding user to approval list"
      });
    }
  };

  // Delete approved user
  const handleDeleteApproval = async (id) => {
    if (!window.confirm("Are you sure you want to delete this approval?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/approved-users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authContext?.token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          type: "success",
          message: "Approval deleted successfully"
        });
        fetchApprovedUsers();
      } else {
        setToast({
          type: "error",
          message: data.message || "Failed to delete approval"
        });
      }
    } catch (error) {
      console.error("Error deleting approval:", error);
      setToast({
        type: "error",
        message: "Error deleting approval"
      });
    }
  };

  // Filter approved users
  const filteredUsers = approvedUsers.filter(user => {
    const matchesSearch = searchTerm ? 
      `${user.name} ${user.email} ${user.contact_number}`.toLowerCase().includes(searchTerm.toLowerCase()) 
      : true;
    return matchesSearch;
  });

  return (
    <div className="admin-approval-page">
      <div className="admin-approval-page__objects" aria-hidden="true">
        <span className="admin-approval-page__object admin-approval-page__object--1" />
        <span className="admin-approval-page__object admin-approval-page__object--2" />
        <span className="admin-approval-page__object admin-approval-page__object--3" />
      </div>

      <header className="admin-approval-page__header">
        <div className="admin-approval-page__header-content">
          <button
            type="button"
            className="admin-approval-page__back-btn"
            onClick={() => navigate("/admin-dashboard")}
            aria-label="Go back to dashboard"
          >
            ← Back
          </button>
          <div>
            <h1 className="admin-approval-page__title">User Approvals</h1>
            <p className="admin-approval-page__subtitle">
              Pre-approve users before they register. Verify email, phone, and role.
            </p>
          </div>
        </div>
      </header>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <main className="admin-approval-page__main">
        <div className="admin-approval-page__tabs">
          <button
            type="button"
            className={`admin-approval-page__tab ${activeTab === "list" ? "admin-approval-page__tab--active" : ""}`}
            onClick={() => {
              setActiveTab("list");
              fetchApprovedUsers();
            }}
          >
            Approved Users ({approvedUsers.length})
          </button>
          <button
            type="button"
            className={`admin-approval-page__tab ${activeTab === "add" ? "admin-approval-page__tab--active" : ""}`}
            onClick={() => setActiveTab("add")}
          >
            Add New Approval
          </button>
        </div>

        {activeTab === "add" && (
          <section className="admin-approval-page__section admin-approval-page__section--form">
            <div className="admin-approval-page__section-header">
              <h2 className="admin-approval-page__section-title">Add New User Approval</h2>
              <p className="admin-approval-page__section-text">
                Fill in the user details below to approve them for registration.
              </p>
            </div>

            <form className="admin-approval-form" onSubmit={handleAddApprovedUser}>
              <div className="admin-approval-form__group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="admin-approval-form__row">
                <div className="admin-approval-form__group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="admin-approval-form__group">
                  <label htmlFor="contactNumber">Contact Number *</label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleFormChange}
                    placeholder="9876543210"
                    pattern="^\d{10}$"
                    required
                  />
                </div>
              </div>

              <div className="admin-approval-form__row">
                <div className="admin-approval-form__group">
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                  </select>
                </div>

                <div className="admin-approval-form__group">
                  <label htmlFor="department">Department</label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleFormChange}
                    placeholder="Computer Science"
                  />
                </div>
              </div>

              <div className="admin-approval-form__row">
                {formData.role === "student" ? (
                  <>
                    <div className="admin-approval-form__group">
                      <label htmlFor="studentId">Student ID *</label>
                      <input
                        type="text"
                        id="studentId"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleFormChange}
                        placeholder="STU001"
                        required
                      />
                    </div>

                    <div className="admin-approval-form__group">
                      <label htmlFor="semester">Semester</label>
                      <input
                        type="number"
                        id="semester"
                        name="semester"
                        value={formData.semester}
                        onChange={handleFormChange}
                        placeholder="4"
                        min="1"
                        max="8"
                      />
                    </div>

                    <div className="admin-approval-form__group">
                      <label htmlFor="section">Section</label>
                      <input
                        type="text"
                        id="section"
                        name="section"
                        value={formData.section}
                        onChange={handleFormChange}
                        placeholder="A"
                      />
                    </div>
                  </>
                ) : (
                  <div className="admin-approval-form__group">
                    <label htmlFor="teacherId">Teacher ID *</label>
                    <input
                      type="text"
                      id="teacherId"
                      name="teacherId"
                      value={formData.teacherId}
                      onChange={handleFormChange}
                      placeholder="TEACH001"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="admin-approval-form__actions">
                <button
                  type="submit"
                  className="admin-approval-form__submit"
                >
                  Approve User
                </button>
                <button
                  type="button"
                  className="admin-approval-form__cancel"
                  onClick={() => setActiveTab("list")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {activeTab === "list" && (
          <section className="admin-approval-page__section admin-approval-page__section--list">
            <div className="admin-approval-page__section-header">
              <h2 className="admin-approval-page__section-title">Approved Users List</h2>
              <button
                type="button"
                className="admin-approval-page__refresh-btn"
                onClick={fetchApprovedUsers}
                disabled={isLoading}
              >
                🔄 Refresh
              </button>
            </div>

            <div className="admin-approval-page__filters">
              <input
                type="text"
                placeholder="Search by name, email, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-approval-page__search"
              />

              <select
                className="admin-approval-page__select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>

              <select
                className="admin-approval-page__select"
                value={registrationFilter}
                onChange={(e) => setRegistrationFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Not Yet Registered</option>
                <option value="registered">Already Registered</option>
              </select>
            </div>

            {isLoading ? (
              <div className="admin-approval-page__loading">
                <div className="admin-approval-page__spinner" />
                <p>Loading approved users...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="admin-approval-page__table-container">
                <table className="admin-approval-page__table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Contact</th>
                      <th>Role</th>
                      <th>ID</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="admin-approval-page__cell-name">{user.name}</td>
                        <td className="admin-approval-page__cell-email">{user.email}</td>
                        <td>{user.contact_number}</td>
                        <td>
                          <span className={`admin-approval-page__role admin-approval-page__role--${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="admin-approval-page__cell-id">
                          {user.role === "student" ? user.student_id : user.teacher_id}
                        </td>
                        <td>
                          <span className={`admin-approval-page__status ${user.is_registered ? "admin-approval-page__status--registered" : "admin-approval-page__status--pending"}`}>
                            {user.is_registered ? "✓ Registered" : "⏳ Pending"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="admin-approval-page__delete-btn"
                            onClick={() => handleDeleteApproval(user.id)}
                            disabled={user.is_registered}
                            title={user.is_registered ? "Cannot delete registered users" : "Delete approval"}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-approval-page__empty">
                <p className="admin-approval-page__empty-text">No approved users found.</p>
                <button
                  type="button"
                  className="admin-approval-page__empty-btn"
                  onClick={() => setActiveTab("add")}
                >
                  Add First Approval →
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default AdminUserApprovalPage;
