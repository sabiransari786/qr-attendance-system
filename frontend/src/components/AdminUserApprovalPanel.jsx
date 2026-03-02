import { useState, useContext } from "react";
import { X, CheckCircle, Loader } from 'lucide-react';
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import Toast from "./Toast";
import "../styles/admin-approval.css";

function AdminUserApprovalPanel({ isOpen, onClose }) {
  const authContext = useContext(AuthContext);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [registrationFilter, setRegistrationFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

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
        setShowAddForm(false);
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

  if (!isOpen) return null;

  return (
    <section className="admin-approval-panel" aria-label="User approval management">
      <div className="admin-approval-panel__header">
        <div>
          <p className="admin-approval-panel__eyebrow">User Management</p>
          <h3 className="admin-approval-panel__title">
            Approve Users Before Registration ({isLoading ? "Loading..." : approvedUsers.length})
          </h3>
        </div>
        <button
          type="button"
          className="admin-approval-panel__close"
          onClick={onClose}
          aria-label="Close approval panel"
        >
          <X size={18} />
        </button>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="admin-approval-panel__actions">
        <button
          type="button"
          className="admin-approval-panel__btn admin-approval-panel__btn--primary"
          onClick={() => {
            setShowAddForm(!showAddForm);
          }}
        >
          {showAddForm ? "Cancel" : "+ Add New Approval"}
        </button>
        <button
          type="button"
          className="admin-approval-panel__btn"
          onClick={fetchApprovedUsers}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      {showAddForm && (
        <form className="admin-approval-form" onSubmit={handleAddApprovedUser}>
          <h4 className="admin-approval-form__title">Approve New User</h4>

          <div className="admin-approval-form__row">
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
          </div>

          <div className="admin-approval-form__row">
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
          </div>

          <div className="admin-approval-form__row">
            {formData.role === "student" ? (
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

            <div className="admin-approval-form__group">
              <label htmlFor="department">Department</label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleFormChange}
              >
                <option value="">-- Select Department --</option>
                {[
                  "Computer Engineering",
                  "Civil Engineering",
                  "Mechanical Engineering",
                  "Electrical Engineering",
                  "Electronics & Telecommunication Engg",
                ].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.role === "student" && (
            <div className="admin-approval-form__row">
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
                  max="6"
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
            </div>
          )}

          <button
            type="submit"
            className="admin-approval-form__submit"
          >
            Approve User
          </button>
        </form>
      )}

      <div className="admin-approval-panel__filters">
        <input
          type="text"
          placeholder="Search by name, email, or contact..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-approval-panel__search"
        />

        <select
          className="admin-approval-panel__select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
        </select>

        <select
          className="admin-approval-panel__select"
          value={registrationFilter}
          onChange={(e) => setRegistrationFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Not Yet Registered</option>
          <option value="registered">Already Registered</option>
        </select>
      </div>

      {isLoading ? (
        <p className="admin-approval-panel__state">Loading approved users...</p>
      ) : filteredUsers.length > 0 ? (
        <div className="admin-approval-panel__table">
          <table>
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
                  <td className="admin-approval-panel__cell-name">{user.name}</td>
                  <td className="admin-approval-panel__cell-email">{user.email}</td>
                  <td>{user.contact_number}</td>
                  <td>
                    <span className={`admin-approval-panel__role admin-approval-panel__role--${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="admin-approval-panel__cell-id">
                    {user.role === "student" ? user.student_id : user.teacher_id}
                  </td>
                  <td>
                    <span className={`admin-approval-panel__status ${user.is_registered ? "admin-approval-panel__status--registered" : "admin-approval-panel__status--pending"}`}>
                      {user.is_registered ? <><CheckCircle size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />Registered</> : <><Loader size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />Pending</>}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-approval-panel__delete-btn"
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
        <p className="admin-approval-panel__state">No approved users found.</p>
      )}
    </section>
  );
}

export default AdminUserApprovalPanel;
