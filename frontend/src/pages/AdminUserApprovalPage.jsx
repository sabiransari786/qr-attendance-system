import { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, CheckCircle, Loader, UserPlus, X, Check,
  Search, Filter, Trash2, Users, Upload, Download, FileText, AlertCircle,
  CheckCircle2
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";
import { fadeInUp, staggerContainer } from "../animations/animationConfig";
import { DEPARTMENTS } from "../config/dummyData";
import "../styles/dashboard.css";
import "../styles/admin-pages.css";

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
  });

  // Bulk upload state
  const fileInputRef = useRef(null);
  const [csvData, setCsvData] = useState([]);
  const [bulkResults, setBulkResults] = useState(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [csvError, setCsvError] = useState("");

  // CSV Template download
  const handleDownloadTemplate = () => {
    const headers = "name,email,contactNumber,role,studentId,teacherId,department,semester";
    const sampleRows = [
      "Rahul Sharma,rahul@example.com,9876543210,student,STU001,,Computer Engineering,3",
      "Priya Singh,priya@example.com,9876543211,student,STU002,,Civil Engineering,5",
      "Dr. Amit Kumar,amit@example.com,9876543212,faculty,,TEACH001,Computer Engineering,",
    ];
    const csv = [headers, ...sampleRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_approval_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse CSV file
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError("");
    setBulkResults(null);

    if (!file.name.endsWith(".csv")) {
      setCsvError("Please upload a .csv file only.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) {
          setCsvError("CSV file must have a header row and at least one data row.");
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const requiredHeaders = ["name", "email", "contactnumber", "role"];
        const missing = requiredHeaders.filter((h) => !headers.includes(h));
        if (missing.length > 0) {
          setCsvError(`Missing required columns: ${missing.join(", ")}`);
          return;
        }

        const headerMap = {};
        headers.forEach((h, i) => { headerMap[h] = i; });

        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          // Simple CSV parse (handles basic commas, not quoted commas)
          const cols = lines[i].split(",").map((c) => c.trim());
          const row = {
            name: cols[headerMap["name"]] || "",
            email: cols[headerMap["email"]] || "",
            contactNumber: cols[headerMap["contactnumber"]] || "",
            role: (cols[headerMap["role"]] || "student").toLowerCase(),
            studentId: cols[headerMap["studentid"]] || "",
            teacherId: cols[headerMap["teacherid"]] || "",
            department: cols[headerMap["department"]] || "",
            semester: cols[headerMap["semester"]] || "",
          };
          // Skip completely empty rows
          if (row.name || row.email) parsed.push(row);
        }

        if (parsed.length === 0) {
          setCsvError("No valid data rows found in the CSV.");
          return;
        }
        if (parsed.length > 500) {
          setCsvError("Maximum 500 users allowed per upload. Please split your file.");
          return;
        }

        setCsvData(parsed);
      } catch (err) {
        setCsvError("Failed to parse CSV file. Please check the format.");
      }
    };
    reader.readAsText(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  // Submit bulk upload
  const handleBulkUpload = async () => {
    if (csvData.length === 0) return;
    setIsBulkUploading(true);
    setBulkResults(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/approved-users/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authContext?.token}`,
        },
        body: JSON.stringify({ users: csvData }),
      });

      const data = await response.json();
      if (data.success) {
        setBulkResults(data);
        showToast(`${data.added} users added successfully!${data.failed > 0 ? ` ${data.failed} failed.` : ""}`);
        fetchApprovedUsers();
      } else {
        showToast(data.message || "Bulk upload failed", "error");
      }
    } catch (error) {
      console.error("Bulk upload error:", error);
      showToast("Bulk upload failed. Please try again.", "error");
    } finally {
      setIsBulkUploading(false);
    }
  };

  // Clear bulk upload state
  const handleClearBulk = () => {
    setCsvData([]);
    setBulkResults(null);
    setCsvError("");
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch approved users
  const fetchApprovedUsers = async () => {
    setIsLoading(true);
    try {
      let url = `${API_BASE_URL}/auth/admin/approved-users`;
      if (roleFilter !== "all") url += `?role=${roleFilter}`;
      if (registrationFilter !== "all") {
        url += `${url.includes("?") ? "&" : "?"}isRegistered=${registrationFilter === "registered"}`;
      }

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authContext?.token}`,
        },
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setApprovedUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching approved users:", error);
      showToast("Failed to fetch approved users", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddApprovedUser = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.contactNumber) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    if (formData.role === "student" && !formData.studentId) {
      showToast("Student ID is required for student role", "error");
      return;
    }
    if (formData.role === "faculty" && !formData.teacherId) {
      showToast("Teacher ID is required for faculty role", "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/approved-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authContext?.token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast("User approved successfully!");
        setFormData({
          name: "", email: "", contactNumber: "", role: "student",
          studentId: "", teacherId: "", department: "", semester: "",
        });
        setActiveTab("list");
        fetchApprovedUsers();
      } else {
        showToast(data.message || "Failed to add approved user", "error");
      }
    } catch (error) {
      console.error("Error adding approved user:", error);
      showToast("Error adding user to approval list", "error");
    }
  };

  const handleDeleteApproval = async (id) => {
    if (!window.confirm("Are you sure you want to delete this approval?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/approved-users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authContext?.token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        showToast("Approval deleted successfully");
        fetchApprovedUsers();
      } else {
        showToast(data.message || "Failed to delete approval", "error");
      }
    } catch (error) {
      console.error("Error deleting approval:", error);
      showToast("Error deleting approval", "error");
    }
  };

  const filteredUsers = approvedUsers.filter((user) => {
    const matchesSearch = searchTerm
      ? `${user.name} ${user.email} ${user.contact_number}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      : true;
    return matchesSearch;
  });

  const stats = [
    { label: "Total Approved", value: approvedUsers.length, sub: "Users" },
    { label: "Students", value: approvedUsers.filter((u) => u.role === "student").length, sub: "Approved" },
    { label: "Faculty", value: approvedUsers.filter((u) => u.role === "faculty").length, sub: "Approved" },
    { label: "Registered", value: approvedUsers.filter((u) => u.is_registered).length, sub: "Completed" },
  ];

  const getInitials = (name = "") =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <motion.div className="dashboard ap" variants={staggerContainer} initial="hidden" animate="visible">
      {/* Floating objects */}
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed", top: 20, right: 20, zIndex: 9999,
              background: toast.type === "error" ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.18)",
              border: `1px solid ${toast.type === "error" ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.4)"}`,
              color: toast.type === "error" ? "#f87171" : "#4ade80",
              padding: "0.75rem 1.25rem", borderRadius: "12px",
              fontSize: "0.875rem", backdropFilter: "blur(16px)",
              display: "flex", alignItems: "center", gap: "0.5rem",
            }}
          >
            {toast.type === "error" ? <X size={14} /> : <Check size={14} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ap__inner">
        {/* Header */}
        <motion.div className="ap__header" variants={fadeInUp}>
          <div className="ap__header-left">
            <button className="ap__back-btn" onClick={() => navigate("/admin-dashboard")}>
              ← Dashboard
            </button>
            <div>
              <p className="ap__eyebrow">Admin Panel</p>
              <h1 className="ap__title">User Approvals</h1>
              <p className="ap__subtitle">
                Pre-approve users before they register. Verify email, phone, and role.
              </p>
            </div>
          </div>
          <div className="ap__header-actions">
            <button
              className={`ap__btn ${activeTab === "list" ? "ap__btn--primary" : "ap__btn--outline"}`}
              onClick={() => { setActiveTab("list"); fetchApprovedUsers(); }}
            >
              <Users size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
              Approved List
            </button>
            <button
              className={`ap__btn ${activeTab === "add" ? "ap__btn--primary" : "ap__btn--outline"}`}
              onClick={() => setActiveTab("add")}
            >
              <UserPlus size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
              Add New
            </button>
            <button
              className={`ap__btn ${activeTab === "bulk" ? "ap__btn--primary" : "ap__btn--outline"}`}
              onClick={() => setActiveTab("bulk")}
            >
              <Upload size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
              Bulk Upload
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div className="ap__stats" variants={staggerContainer}>
          {stats.map((s, i) => (
            <motion.div className="ap__stat" key={i} variants={fadeInUp}>
              <p className="ap__stat-label">{s.label}</p>
              <p className="ap__stat-value">{s.value}</p>
              <p className="ap__stat-sub">{s.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── Add New Form ──────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === "add" && (
            <motion.div
              className="ap__panel"
              key="add-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="ap__panel-header">
                <h2 className="ap__panel-title">Add New User Approval</h2>
                <span className="ap__panel-count">Fill in user details below</span>
              </div>

              <form onSubmit={handleAddApprovedUser} style={{ display: "grid", gap: "1rem" }}>
                {/* Name */}
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Full Name *
                  </label>
                  <input
                    className="ap__search"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="John Doe"
                    required
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>

                {/* Email + Contact */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Email *
                    </label>
                    <input
                      className="ap__search"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="john@example.com"
                      required
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Contact Number *
                    </label>
                    <input
                      className="ap__search"
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleFormChange}
                      placeholder="9876543210"
                      pattern="^\d{10}$"
                      required
                      style={{ width: "100%", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                {/* Role + Department */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Role *
                    </label>
                    <select
                      className="ap__select"
                      name="role"
                      value={formData.role}
                      onChange={handleFormChange}
                      required
                      style={{ width: "100%" }}
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Department
                    </label>
                    <select
                      className="ap__select"
                      name="department"
                      value={formData.department}
                      onChange={handleFormChange}
                      style={{ width: "100%" }}
                    >
                      <option value="">-- Select Department --</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conditional role fields */}
                <div style={{ display: "grid", gridTemplateColumns: formData.role === "student" ? "1fr 1fr 1fr" : "1fr", gap: "1rem" }}>
                  {formData.role === "student" ? (
                    <>
                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Student ID *
                        </label>
                        <input
                          className="ap__search"
                          type="text"
                          name="studentId"
                          value={formData.studentId}
                          onChange={handleFormChange}
                          placeholder="STU001"
                          required
                          style={{ width: "100%", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Semester
                        </label>
                        <input
                          className="ap__search"
                          type="number"
                          name="semester"
                          value={formData.semester}
                          onChange={handleFormChange}
                          placeholder="4"
                          min="1"
                          max="8"
                          style={{ width: "100%", boxSizing: "border-box" }}
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Teacher ID *
                      </label>
                      <input
                        className="ap__search"
                        type="text"
                        name="teacherId"
                        value={formData.teacherId}
                        onChange={handleFormChange}
                        placeholder="TEACH001"
                        required
                        style={{ width: "100%", boxSizing: "border-box" }}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button type="submit" className="ap__btn ap__btn--primary" style={{ flex: 1 }}>
                    <CheckCircle size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                    Approve User
                  </button>
                  <button
                    type="button"
                    className="ap__btn ap__btn--ghost"
                    style={{ flex: 1 }}
                    onClick={() => setActiveTab("list")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ─── Bulk Upload ───────────────────────────────────── */}
          {activeTab === "bulk" && (
            <motion.div
              className="ap__panel"
              key="bulk-upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="ap__panel-header">
                <h2 className="ap__panel-title">Bulk Upload Users</h2>
                <button
                  className="ap__btn ap__btn--outline"
                  onClick={handleDownloadTemplate}
                >
                  <Download size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                  Download CSV Template
                </button>
              </div>

              {/* Instructions */}
              <div style={{
                background: "rgba(49,156,181,0.06)",
                border: "1px solid rgba(49,156,181,0.15)",
                borderRadius: "12px",
                padding: "1rem 1.25rem",
                marginBottom: "1.25rem",
                fontSize: "0.85rem",
                color: "var(--color-text-secondary)",
                lineHeight: 1.7,
              }}>
                <p style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <FileText size={15} /> CSV Format Instructions
                </p>
                <p>Required columns: <strong>name, email, contactNumber, role</strong></p>
                <p>For students: also include <strong>studentId</strong> | For faculty: include <strong>teacherId</strong></p>
                <p>Optional: <strong>department, semester</strong></p>
                <p style={{ marginTop: "0.3rem", opacity: 0.8 }}>
                  Maximum 500 users per upload. Download the template above for reference.
                </p>
              </div>

              {/* File Upload Area */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />

              {csvData.length === 0 && !bulkResults ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed rgba(49,156,181,0.3)",
                    borderRadius: "16px",
                    padding: "3rem 1.5rem",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    background: "rgba(49,156,181,0.02)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(49,156,181,0.6)"; e.currentTarget.style.background = "rgba(49,156,181,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(49,156,181,0.3)"; e.currentTarget.style.background = "rgba(49,156,181,0.02)"; }}
                >
                  <Upload size={48} style={{ color: "var(--color-primary)", opacity: 0.5, marginBottom: "1rem" }} />
                  <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "0.4rem" }}>
                    Click to select CSV file
                  </p>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
                    or drag & drop your file here
                  </p>
                </div>
              ) : null}

              {/* CSV Error */}
              {csvError && (
                <div style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: "12px",
                  padding: "0.85rem 1.1rem",
                  marginTop: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                  color: "#f87171",
                }}>
                  <AlertCircle size={16} />
                  {csvError}
                </div>
              )}

              {/* CSV Preview Table */}
              {csvData.length > 0 && !bulkResults && (
                <div style={{ marginTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                      Preview — {csvData.length} users found
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="ap__btn ap__btn--ghost" onClick={handleClearBulk} style={{ fontSize: "0.8rem" }}>
                        <X size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                        Clear
                      </button>
                      <button className="ap__btn ap__btn--outline" onClick={() => fileInputRef.current?.click()} style={{ fontSize: "0.8rem" }}>
                        <RefreshCw size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                        Change File
                      </button>
                    </div>
                  </div>

                  <div className="ap__table-wrap" style={{ maxHeight: "350px", overflowY: "auto" }}>
                    <table className="ap__table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Contact</th>
                          <th>Role</th>
                          <th>ID</th>
                          <th>Dept</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.map((row, i) => (
                          <tr key={i}>
                            <td style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{i + 1}</td>
                            <td style={{ fontSize: "0.85rem", fontWeight: 500 }}>{row.name || "—"}</td>
                            <td style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>{row.email || "—"}</td>
                            <td style={{ fontSize: "0.82rem" }}>{row.contactNumber || "—"}</td>
                            <td>
                              <span className={`ap__badge ap__badge--${row.role}`} style={{ fontSize: "0.75rem" }}>
                                {row.role}
                              </span>
                            </td>
                            <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--color-primary)" }}>
                              {row.role === "student" ? row.studentId : row.teacherId || "—"}
                            </td>
                            <td style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{row.department || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Upload Button */}
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
                    <button
                      className="ap__btn ap__btn--primary"
                      style={{ flex: 1, padding: "0.75rem" }}
                      onClick={handleBulkUpload}
                      disabled={isBulkUploading}
                    >
                      {isBulkUploading ? (
                        <>
                          <Loader size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px", animation: "spin 1s linear infinite" }} />
                          Uploading {csvData.length} users...
                        </>
                      ) : (
                        <>
                          <Upload size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
                          Upload & Approve {csvData.length} Users
                        </>
                      )}
                    </button>
                    <button className="ap__btn ap__btn--ghost" style={{ flex: 0.4 }} onClick={handleClearBulk}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Bulk Upload Results */}
              {bulkResults && (
                <div style={{ marginTop: "1rem" }}>
                  {/* Summary Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                    <div style={{
                      background: "rgba(49,156,181,0.06)",
                      border: "1px solid rgba(49,156,181,0.15)",
                      borderRadius: "12px",
                      padding: "1rem",
                      textAlign: "center",
                    }}>
                      <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary)" }}>{bulkResults.total}</p>
                      <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</p>
                    </div>
                    <div style={{
                      background: "rgba(34,197,94,0.06)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      borderRadius: "12px",
                      padding: "1rem",
                      textAlign: "center",
                    }}>
                      <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#4ade80" }}>{bulkResults.added}</p>
                      <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Added</p>
                    </div>
                    <div style={{
                      background: bulkResults.failed > 0 ? "rgba(239,68,68,0.06)" : "rgba(100,116,139,0.06)",
                      border: `1px solid ${bulkResults.failed > 0 ? "rgba(239,68,68,0.2)" : "rgba(100,116,139,0.15)"}`,
                      borderRadius: "12px",
                      padding: "1rem",
                      textAlign: "center",
                    }}>
                      <p style={{ fontSize: "1.5rem", fontWeight: 700, color: bulkResults.failed > 0 ? "#f87171" : "var(--color-text-secondary)" }}>{bulkResults.failed}</p>
                      <p style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Failed</p>
                    </div>
                  </div>

                  {/* Detailed Results Table */}
                  <div className="ap__table-wrap" style={{ maxHeight: "350px", overflowY: "auto" }}>
                    <table className="ap__table">
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkResults.results.map((r, i) => (
                          <tr key={i}>
                            <td style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>{r.row}</td>
                            <td style={{ fontSize: "0.85rem", fontWeight: 500 }}>{r.name}</td>
                            <td style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>{r.email}</td>
                            <td>
                              {r.status === "success" ? (
                                <span className="ap__badge ap__badge--active" style={{ fontSize: "0.75rem" }}>
                                  <CheckCircle2 size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                                  Added
                                </span>
                              ) : (
                                <span className="ap__badge ap__badge--danger" style={{ fontSize: "0.75rem" }}>
                                  <AlertCircle size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                                  Failed
                                </span>
                              )}
                            </td>
                            <td style={{ fontSize: "0.8rem", color: r.status === "failed" ? "#f87171" : "var(--color-text-secondary)" }}>
                              {r.status === "failed" ? r.error : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
                    <button
                      className="ap__btn ap__btn--primary"
                      style={{ flex: 1 }}
                      onClick={() => { handleClearBulk(); }}
                    >
                      <Upload size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
                      Upload Another File
                    </button>
                    <button
                      className="ap__btn ap__btn--outline"
                      style={{ flex: 1 }}
                      onClick={() => { handleClearBulk(); setActiveTab("list"); fetchApprovedUsers(); }}
                    >
                      <Users size={15} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
                      View Approved List
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── Approved Users List ─────────────────────────────── */}
          {activeTab === "list" && (
            <motion.div
              className="ap__panel"
              key="user-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="ap__panel-header">
                <h2 className="ap__panel-title">
                  Approved Users{" "}
                  <span className="ap__panel-count">
                    ({isLoading ? "…" : filteredUsers.length} users)
                  </span>
                </h2>
                <button
                  className="ap__btn ap__btn--outline"
                  onClick={fetchApprovedUsers}
                  disabled={isLoading}
                >
                  <RefreshCw size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                  Refresh
                </button>
              </div>

              <div className="ap__filters">
                <input
                  className="ap__search"
                  placeholder="Search by name, email, or contact…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="ap__select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
                <select
                  className="ap__select"
                  value={registrationFilter}
                  onChange={(e) => setRegistrationFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Not Yet Registered</option>
                  <option value="registered">Already Registered</option>
                </select>
              </div>

              <div className="ap__table-wrap">
                <table className="ap__table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Contact</th>
                      <th>Role</th>
                      <th>ID</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          {[1, 2, 3, 4, 5, 6].map((c) => (
                            <td key={c}>
                              <div className="ap__skeleton" style={{ width: `${40 + c * 10}%` }} />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="ap__empty">
                            <div className="ap__empty-icon">
                              <UserPlus size={48} />
                            </div>
                            <p className="ap__empty-title">No approved users found</p>
                            <p className="ap__empty-text">
                              Add the first user to the approval list.
                            </p>
                            <button
                              className="ap__btn ap__btn--primary"
                              style={{ marginTop: "1rem" }}
                              onClick={() => setActiveTab("add")}
                            >
                              + Add First Approval
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, idx) => (
                        <motion.tr
                          key={user.id}
                          variants={fadeInUp}
                          initial="hidden"
                          animate="visible"
                          transition={{ delay: idx * 0.03 }}
                        >
                          <td>
                            <div className="ap__avatar-cell">
                              <div className={`ap__avatar ap__avatar--${user.role}`}>
                                {getInitials(user.name)}
                              </div>
                              <div>
                                <p className="ap__user-name">{user.name}</p>
                                <p className="ap__user-sub">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                            {user.contact_number}
                          </td>
                          <td>
                            <span className={`ap__badge ap__badge--${user.role}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              fontFamily: "monospace",
                              fontSize: "0.82rem",
                              color: "var(--color-primary)",
                              background: "rgba(49,156,181,0.08)",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "6px",
                            }}>
                              {user.role === "student" ? user.student_id : user.teacher_id}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`ap__badge ${user.is_registered ? "ap__badge--active" : "ap__badge--warn"}`}
                            >
                              {user.is_registered ? (
                                <>
                                  <CheckCircle size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "2px" }} />
                                  Registered
                                </>
                              ) : (
                                <>
                                  <Loader size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "2px" }} />
                                  Pending
                                </>
                              )}
                            </span>
                          </td>
                          <td>
                            <button
                              className="ap__btn ap__btn--danger"
                              style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                              onClick={() => handleDeleteApproval(user.id)}
                              disabled={user.is_registered}
                              title={user.is_registered ? "Cannot delete registered users" : "Remove approval"}
                            >
                              <Trash2 size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
                              Remove
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default AdminUserApprovalPage;
