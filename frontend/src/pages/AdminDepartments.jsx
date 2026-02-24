import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, staggerContainer } from "../animations/animationConfig";
import "../styles/dashboard.css";
import "../styles/admin-pages.css";
import "../styles/admin-departments.css";

/* ═══════════════════════ DUMMY DATA ═══════════════════════ */

const INITIAL_DEPARTMENTS = [
  { id: 1, name: "Computer Science & Engineering", code: "CSE", icon: "💻", color: "#319cb5", hod: "Dr. Anita Sharma", established: 1985, building: "Block A", phone: "+91-11-2345-6701", description: "Focuses on software development, algorithms, AI/ML, and systems programming." },
  { id: 2, name: "Electrical Engineering", code: "EE", icon: "⚡", color: "#8b5cf6", hod: "Dr. Rajesh Kumar", established: 1978, building: "Block B", phone: "+91-11-2345-6702", description: "Covers power systems, control systems, signal processing, and embedded systems." },
  { id: 3, name: "Mechanical Engineering", code: "ME", icon: "⚙️", color: "#f59e0b", hod: "Prof. Suresh Reddy", established: 1972, building: "Block C", phone: "+91-11-2345-6703", description: "Deals with thermodynamics, fluid mechanics, manufacturing, and robotics." },
  { id: 4, name: "Civil Engineering", code: "CE", icon: "🏗️", color: "#10b981", hod: "Dr. Priya Nair", established: 1975, building: "Block D", phone: "+91-11-2345-6704", description: "Encompasses structural, geotechnical, environmental, and transportation engineering." },
  { id: 5, name: "Electronics & Communication", code: "ECE", icon: "📡", color: "#ef4444", hod: "Dr. Vikram Singh", established: 1990, building: "Block E", phone: "+91-11-2345-6705", description: "Covers VLSI design, IoT, wireless communications, and microelectronics." },
  { id: 6, name: "Information Technology", code: "IT", icon: "🌐", color: "#ec4899", hod: "Dr. Kavita Joshi", established: 1998, building: "Block F", phone: "+91-11-2345-6706", description: "Focuses on cloud computing, cybersecurity, full-stack development, and data analytics." },
  { id: 7, name: "Computer Engineering", code: "COMP", icon: "🖥️", color: "#0ea5e9", hod: "Dr. Rajan Mehta", established: 2002, building: "Block G", phone: "+91-11-2345-6707", description: "Covers engineering mathematics, data structures, computer networks, DBMS, and operating systems." },
];

const INITIAL_FACULTY = {
  1: [
    { id: 101, name: "Dr. Anita Sharma", designation: "Professor & HOD", email: "anita.sharma@college.edu", phone: "9812300001", specialization: "Machine Learning", experience: 18, status: "Active" },
    { id: 102, name: "Prof. Manoj Gupta", designation: "Associate Professor", email: "manoj.gupta@college.edu", phone: "9812300002", specialization: "Computer Networks", experience: 12, status: "Active" },
    { id: 103, name: "Dr. Sneha Iyer", designation: "Assistant Professor", email: "sneha.iyer@college.edu", phone: "9812300003", specialization: "Database Systems", experience: 8, status: "Active" },
    { id: 104, name: "Mr. Arjun Mehta", designation: "Assistant Professor", email: "arjun.mehta@college.edu", phone: "9812300004", specialization: "Web Technologies", experience: 5, status: "Active" },
    { id: 105, name: "Dr. Pooja Kapoor", designation: "Professor", email: "pooja.kapoor@college.edu", phone: "9812300005", specialization: "Algorithms", experience: 15, status: "On Leave" },
  ],
  2: [
    { id: 201, name: "Dr. Rajesh Kumar", designation: "Professor & HOD", email: "rajesh.kumar@college.edu", phone: "9812300006", specialization: "Power Systems", experience: 20, status: "Active" },
    { id: 202, name: "Prof. Neha Verma", designation: "Associate Professor", email: "neha.verma@college.edu", phone: "9812300007", specialization: "Control Systems", experience: 11, status: "Active" },
    { id: 203, name: "Dr. Amit Tiwari", designation: "Assistant Professor", email: "amit.tiwari@college.edu", phone: "9812300008", specialization: "Signal Processing", experience: 7, status: "Active" },
    { id: 204, name: "Ms. Ritu Sharma", designation: "Assistant Professor", email: "ritu.sharma@college.edu", phone: "9812300009", specialization: "Embedded Systems", experience: 4, status: "Active" },
  ],
  3: [
    { id: 301, name: "Prof. Suresh Reddy", designation: "Professor & HOD", email: "suresh.reddy@college.edu", phone: "9812300010", specialization: "Thermodynamics", experience: 22, status: "Active" },
    { id: 302, name: "Dr. Kavya Rao", designation: "Associate Professor", email: "kavya.rao@college.edu", phone: "9812300011", specialization: "Manufacturing Processes", experience: 13, status: "Active" },
    { id: 303, name: "Mr. Deepak Nair", designation: "Assistant Professor", email: "deepak.nair@college.edu", phone: "9812300012", specialization: "Robotics", experience: 6, status: "Active" },
    { id: 304, name: "Dr. Sunita Mishra", designation: "Professor", email: "sunita.mishra@college.edu", phone: "9812300013", specialization: "Fluid Mechanics", experience: 16, status: "On Leave" },
  ],
  4: [
    { id: 401, name: "Dr. Priya Nair", designation: "Professor & HOD", email: "priya.nair@college.edu", phone: "9812300014", specialization: "Structural Engineering", experience: 19, status: "Active" },
    { id: 402, name: "Prof. Rohit Patil", designation: "Associate Professor", email: "rohit.patil@college.edu", phone: "9812300015", specialization: "Geotechnical Engg", experience: 10, status: "Active" },
    { id: 403, name: "Dr. Aisha Khan", designation: "Assistant Professor", email: "aisha.khan@college.edu", phone: "9812300016", specialization: "Transportation Engg", experience: 7, status: "Active" },
  ],
  5: [
    { id: 501, name: "Dr. Vikram Singh", designation: "Professor & HOD", email: "vikram.singh@college.edu", phone: "9812300017", specialization: "VLSI Design", experience: 17, status: "Active" },
    { id: 502, name: "Prof. Meena Devi", designation: "Associate Professor", email: "meena.devi@college.edu", phone: "9812300018", specialization: "IoT Systems", experience: 9, status: "Active" },
    { id: 503, name: "Dr. Kiran Babu", designation: "Assistant Professor", email: "kiran.babu@college.edu", phone: "9812300019", specialization: "Wireless Communications", experience: 6, status: "Active" },
    { id: 504, name: "Mr. Sanjay Yadav", designation: "Assistant Professor", email: "sanjay.yadav@college.edu", phone: "9812300020", specialization: "Microelectronics", experience: 4, status: "Active" },
  ],
  6: [
    { id: 601, name: "Dr. Kavita Joshi", designation: "Professor & HOD", email: "kavita.joshi@college.edu", phone: "9812300021", specialization: "Cloud Computing", experience: 14, status: "Active" },
    { id: 602, name: "Prof. Rahul Das", designation: "Associate Professor", email: "rahul.das@college.edu", phone: "9812300022", specialization: "Cybersecurity", experience: 10, status: "Active" },
    { id: 603, name: "Dr. Divya Menon", designation: "Assistant Professor", email: "divya.menon@college.edu", phone: "9812300023", specialization: "Full-Stack Development", experience: 5, status: "Active" },
    { id: 604, name: "Ms. Ankita Roy", designation: "Assistant Professor", email: "ankita.roy@college.edu", phone: "9812300024", specialization: "Data Analytics", experience: 3, status: "Active" },
  ],
  7: [
    { id: 701, name: "Dr. Rajan Mehta", designation: "Professor & HOD", email: "rajan.mehta@college.edu", phone: "9812300025", specialization: "Engineering Mathematics", experience: 16, status: "Active" },
    { id: 702, name: "Prof. Nisha Yadav", designation: "Associate Professor", email: "nisha.yadav@college.edu", phone: "9812300026", specialization: "Data Structures", experience: 11, status: "Active" },
    { id: 703, name: "Dr. Sameer Qureshi", designation: "Associate Professor", email: "sameer.qureshi@college.edu", phone: "9812300027", specialization: "Computer Networks", experience: 9, status: "Active" },
    { id: 704, name: "Dr. Preeti Sharma", designation: "Assistant Professor", email: "preeti.sharma@college.edu", phone: "9812300028", specialization: "Database Management Systems", experience: 7, status: "Active" },
    { id: 705, name: "Mr. Vivek Tiwari", designation: "Assistant Professor", email: "vivek.tiwari@college.edu", phone: "9812300029", specialization: "Operating Systems", experience: 5, status: "Active" },
  ],
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const SLOTS = ["9:00–10:00", "10:00–11:00", "11:00–12:00", "12:00–1:00", "2:00–3:00", "3:00–4:00"];

const INITIAL_COURSES = {
  1: [
    { id: "c101", code: "CS101", name: "Programming Fundamentals", credits: 4, semester: 1, type: "Core", facultyId: 104, enrolled: 62, attendance: 87, schedule: { Mon: 0, Wed: 0, Fri: 1 } },
    { id: "c102", code: "DS202", name: "Data Structures", credits: 4, semester: 3, type: "Core", facultyId: 103, enrolled: 58, attendance: 82, schedule: { Tue: 1, Thu: 2 } },
    { id: "c103", code: "CN301", name: "Computer Networks", credits: 3, semester: 5, type: "Core", facultyId: 102, enrolled: 50, attendance: 78, schedule: { Mon: 3, Wed: 4 } },
    { id: "c104", code: "DB301", name: "Database Systems", credits: 3, semester: 5, type: "Core", facultyId: 103, enrolled: 48, attendance: 85, schedule: { Tue: 3, Thu: 3 } },
    { id: "c105", code: "ALGO301", name: "Design & Analysis of Algorithms", credits: 4, semester: 5, type: "Core", facultyId: 105, enrolled: 52, attendance: 76, schedule: { Mon: 2, Fri: 2 } },
    { id: "c106", code: "WD201", name: "Web Development", credits: 3, semester: 4, type: "Elective", facultyId: 104, enrolled: 45, attendance: 91, schedule: { Wed: 1, Fri: 3 } },
    { id: "c107", code: "ML401", name: "Machine Learning", credits: 4, semester: 7, type: "Elective", facultyId: 101, enrolled: 40, attendance: 88, schedule: { Tue: 4, Thu: 5 } },
    { id: "c108", code: "AI402", name: "Artificial Intelligence", credits: 3, semester: 7, type: "Elective", facultyId: 101, enrolled: 38, attendance: 90, schedule: { Mon: 5, Wed: 5 } },
  ],
  2: [
    { id: "e101", code: "EE101", name: "Basic Electrical Engineering", credits: 4, semester: 1, type: "Core", facultyId: 201, enrolled: 55, attendance: 83, schedule: { Mon: 0, Wed: 0 } },
    { id: "e102", code: "CS301", name: "Control Systems", credits: 4, semester: 5, type: "Core", facultyId: 202, enrolled: 46, attendance: 79, schedule: { Tue: 2, Thu: 2 } },
    { id: "e103", code: "PS401", name: "Power Systems", credits: 3, semester: 7, type: "Core", facultyId: 201, enrolled: 42, attendance: 81, schedule: { Mon: 4, Fri: 4 } },
    { id: "e104", code: "DSP201", name: "Digital Signal Processing", credits: 3, semester: 5, type: "Core", facultyId: 203, enrolled: 44, attendance: 77, schedule: { Wed: 3, Fri: 3 } },
    { id: "e105", code: "ES201", name: "Embedded Systems", credits: 3, semester: 4, type: "Elective", facultyId: 204, enrolled: 38, attendance: 86, schedule: { Tue: 0, Thu: 0 } },
    { id: "e106", code: "PE301", name: "Power Electronics", credits: 3, semester: 6, type: "Elective", facultyId: 202, enrolled: 35, attendance: 80, schedule: { Mon: 3, Thu: 4 } },
  ],
  3: [
    { id: "m101", code: "ME101", name: "Engineering Mechanics", credits: 4, semester: 2, type: "Core", facultyId: 301, enrolled: 58, attendance: 80, schedule: { Mon: 1, Wed: 1, Fri: 0 } },
    { id: "m102", code: "TD401", name: "Thermodynamics", credits: 4, semester: 4, type: "Core", facultyId: 301, enrolled: 50, attendance: 75, schedule: { Tue: 2, Thu: 2 } },
    { id: "m103", code: "FM301", name: "Fluid Mechanics", credits: 3, semester: 5, type: "Core", facultyId: 304, enrolled: 47, attendance: 78, schedule: { Mon: 3, Fri: 3 } },
    { id: "m104", code: "MFG301", name: "Manufacturing Processes", credits: 3, semester: 5, type: "Core", facultyId: 302, enrolled: 45, attendance: 82, schedule: { Tue: 3, Thu: 4 } },
    { id: "m105", code: "ROB301", name: "Robotics & Automation", credits: 3, semester: 6, type: "Elective", facultyId: 303, enrolled: 36, attendance: 90, schedule: { Wed: 4, Fri: 4 } },
    { id: "m106", code: "CNC201", name: "CNC & CAD/CAM", credits: 2, semester: 4, type: "Elective", facultyId: 302, enrolled: 30, attendance: 85, schedule: { Mon: 5 } },
  ],
  4: [
    { id: "cv101", code: "CV101", name: "Engineering Drawing", credits: 3, semester: 1, type: "Core", facultyId: 401, enrolled: 48, attendance: 88, schedule: { Mon: 0, Wed: 0 } },
    { id: "cv102", code: "SE401", name: "Structural Engineering", credits: 4, semester: 6, type: "Core", facultyId: 401, enrolled: 40, attendance: 79, schedule: { Tue: 2, Thu: 2 } },
    { id: "cv103", code: "GEO301", name: "Geotechnical Engineering", credits: 3, semester: 5, type: "Core", facultyId: 402, enrolled: 38, attendance: 76, schedule: { Mon: 3, Fri: 3 } },
    { id: "cv104", code: "RCC301", name: "RCC Design", credits: 4, semester: 6, type: "Core", facultyId: 401, enrolled: 42, attendance: 81, schedule: { Wed: 2, Fri: 1 } },
    { id: "cv105", code: "TE301", name: "Transportation Engg", credits: 3, semester: 5, type: "Elective", facultyId: 403, enrolled: 32, attendance: 84, schedule: { Tue: 4, Thu: 5 } },
    { id: "cv106", code: "TRP201", name: "Traffic Planning", credits: 2, semester: 4, type: "Elective", facultyId: 403, enrolled: 28, attendance: 87, schedule: { Mon: 4 } },
  ],
  5: [
    { id: "ec101", code: "EC101", name: "Electronic Devices & Circuits", credits: 4, semester: 3, type: "Core", facultyId: 501, enrolled: 52, attendance: 83, schedule: { Mon: 0, Wed: 0, Fri: 0 } },
    { id: "ec102", code: "DSD301", name: "Digital System Design", credits: 3, semester: 5, type: "Core", facultyId: 501, enrolled: 45, attendance: 80, schedule: { Tue: 2, Thu: 2 } },
    { id: "ec103", code: "VLSI401", name: "VLSI Design", credits: 4, semester: 7, type: "Elective", facultyId: 501, enrolled: 38, attendance: 88, schedule: { Mon: 4, Wed: 4 } },
    { id: "ec104", code: "WC301", name: "Wireless Communication", credits: 3, semester: 6, type: "Core", facultyId: 503, enrolled: 42, attendance: 77, schedule: { Tue: 3, Thu: 3 } },
    { id: "ec105", code: "IOT301", name: "Internet of Things", credits: 3, semester: 6, type: "Elective", facultyId: 502, enrolled: 36, attendance: 91, schedule: { Wed: 5, Fri: 5 } },
    { id: "ec106", code: "MC201", name: "Microcontrollers", credits: 3, semester: 4, type: "Core", facultyId: 504, enrolled: 48, attendance: 84, schedule: { Mon: 2, Fri: 2 } },
  ],
  6: [
    { id: "it101", code: "IT101", name: "Introduction to IT", credits: 3, semester: 1, type: "Core", facultyId: 601, enrolled: 45, attendance: 89, schedule: { Mon: 0, Wed: 0 } },
    { id: "it102", code: "FS301", name: "Full-Stack Development", credits: 4, semester: 5, type: "Elective", facultyId: 603, enrolled: 42, attendance: 92, schedule: { Tue: 1, Thu: 1 } },
    { id: "it103", code: "CC401", name: "Cloud Computing", credits: 3, semester: 7, type: "Elective", facultyId: 601, enrolled: 38, attendance: 85, schedule: { Mon: 3, Fri: 3 } },
    { id: "it104", code: "CYB301", name: "Cybersecurity", credits: 3, semester: 6, type: "Core", facultyId: 602, enrolled: 40, attendance: 87, schedule: { Wed: 2, Fri: 2 } },
    { id: "it105", code: "DA201", name: "Data Analytics", credits: 3, semester: 4, type: "Elective", facultyId: 604, enrolled: 35, attendance: 88, schedule: { Tue: 3, Thu: 4 } },
    { id: "it106", code: "NS201", name: "Network Security", credits: 3, semester: 5, type: "Core", facultyId: 602, enrolled: 37, attendance: 82, schedule: { Mon: 4, Wed: 4 } },
    { id: "it107", code: "BE201", name: "Business Intelligence", credits: 2, semester: 4, type: "Elective", facultyId: 604, enrolled: 30, attendance: 86, schedule: { Thu: 5 } },
  ],
  7: [
    { id: "cp101", code: "COMP301", name: "Engineering Mathematics-III", credits: 4, semester: 3, type: "Core", facultyId: 701, enrolled: 55, attendance: 84, schedule: { Mon: 0, Wed: 0, Fri: 1 } },
    { id: "cp102", code: "COMP302", name: "Data Structures", credits: 4, semester: 3, type: "Core", facultyId: 702, enrolled: 52, attendance: 88, schedule: { Tue: 1, Thu: 1 } },
    { id: "cp103", code: "COMP303", name: "Computer Networks", credits: 3, semester: 5, type: "Core", facultyId: 703, enrolled: 48, attendance: 79, schedule: { Mon: 2, Wed: 3 } },
    { id: "cp104", code: "COMP304", name: "Database Management Systems", credits: 3, semester: 5, type: "Core", facultyId: 704, enrolled: 50, attendance: 85, schedule: { Tue: 2, Thu: 3 } },
    { id: "cp105", code: "COMP305", name: "Operating Systems", credits: 4, semester: 5, type: "Core", facultyId: 705, enrolled: 47, attendance: 82, schedule: { Wed: 4, Fri: 4 } },
  ],
};

/* ═══════════════════════ MODAL ═══════════════════════ */

function Modal({ title, onClose, children }) {
  return (
    <AnimatePresence>
      <motion.div className="dept-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="dept-modal" initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 26 }} onClick={e => e.stopPropagation()}>
          <div className="dept-modal__head">
            <h3 className="dept-modal__title">{title}</h3>
            <button className="dept-modal__close" onClick={onClose}>✕</button>
          </div>
          <div className="dept-modal__body">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══════════════════════ TIMETABLE VIEW ═══════════════════════ */

function TimetableView({ courses, faculty }) {
  const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const grid = {};
  DAY_ABBR.forEach(d => { grid[d] = Array(SLOTS.length).fill(null); });
  courses.forEach(course => {
    Object.entries(course.schedule || {}).forEach(([day, slot]) => {
      if (grid[day] && slot < SLOTS.length) grid[day][slot] = course;
    });
  });
  return (
    <div className="dept-timetable-wrap">
      <table className="dept-timetable">
        <thead>
          <tr>
            <th className="dept-tt-corner">Day / Time</th>
            {SLOTS.map(s => <th key={s} className="dept-tt-slot-head">{s}</th>)}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, di) => {
            const abbr = DAY_ABBR[di];
            return (
              <tr key={day} className="dept-tt-row">
                <td className="dept-tt-day">{day}</td>
                {SLOTS.map((_, si) => {
                  const course = grid[abbr][si];
                  const fac = course ? faculty.find(f => f.id === course.facultyId) : null;
                  return (
                    <td key={si} className={`dept-tt-cell${course ? " dept-tt-cell--filled" : ""}`}>
                      {course && (
                        <>
                          <span className="dept-tt-code">{course.code}</span>
                          <span className="dept-tt-name">{course.name}</span>
                          {fac && <span className="dept-tt-fac">{fac.name.split(" ").slice(-1)[0]}</span>}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */

function AdminDepartments() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [allFaculty, setAllFaculty] = useState(INITIAL_FACULTY);
  const [allCourses, setAllCourses] = useState(INITIAL_COURSES);

  const [activeDept, setActiveDept] = useState(null);
  const [activeTab, setActiveTab] = useState("courses");

  const [deptSearch, setDeptSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [semFilter, setSemFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [facultySearch, setFacultySearch] = useState("");

  const [modal, setModal] = useState(null);
  const [formData, setFormData] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const field = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  /* ── DEPT CRUD ── */
  const openAddDept = () => { setFormData({ name: "", code: "", icon: "🏫", color: "#319cb5", hod: "", established: new Date().getFullYear(), building: "", phone: "", description: "" }); setModal("add-dept"); };
  const openEditDept = d => { setFormData({ ...d }); setModal("edit-dept"); };
  const saveDept = () => {
    if (!formData.name || !formData.code) return showToast("Name and Code are required", "error");
    if (modal === "add-dept") {
      const nd = { ...formData, id: Date.now() };
      setDepartments(p => [...p, nd]);
      setAllFaculty(p => ({ ...p, [nd.id]: [] }));
      setAllCourses(p => ({ ...p, [nd.id]: [] }));
      showToast("Department added!");
    } else {
      setDepartments(p => p.map(d => d.id === formData.id ? formData : d));
      if (activeDept?.id === formData.id) setActiveDept(formData);
      showToast("Department updated!");
    }
    setModal(null);
  };
  const deleteDept = id => {
    setDepartments(p => p.filter(d => d.id !== id));
    setAllFaculty(p => { const n = { ...p }; delete n[id]; return n; });
    setAllCourses(p => { const n = { ...p }; delete n[id]; return n; });
    if (activeDept?.id === id) setActiveDept(null);
    showToast("Department deleted!");
  };

  /* ── COURSE CRUD ── */
  const openAddCourse = () => { setFormData({ code: "", name: "", credits: 3, semester: 1, type: "Core", facultyId: "", enrolled: 0, attendance: 0, schedule: {} }); setModal("add-course"); };
  const openEditCourse = c => { setFormData({ ...c }); setModal("edit-course"); };
  const saveCourse = () => {
    if (!formData.code || !formData.name) return showToast("Code and Name are required", "error");
    const did = activeDept.id;
    if (modal === "add-course") {
      setAllCourses(p => ({ ...p, [did]: [...(p[did] || []), { ...formData, id: `c${Date.now()}`, facultyId: Number(formData.facultyId) || null }] }));
      showToast("Course added!");
    } else {
      setAllCourses(p => ({ ...p, [did]: p[did].map(c => c.id === formData.id ? { ...formData, facultyId: Number(formData.facultyId) || null } : c) }));
      showToast("Course updated!");
    }
    setModal(null);
  };
  const deleteCourse = cid => {
    setAllCourses(p => ({ ...p, [activeDept.id]: p[activeDept.id].filter(c => c.id !== cid) }));
    showToast("Course deleted!");
  };

  /* ── FACULTY CRUD ── */
  const openAddFaculty = () => { setFormData({ name: "", designation: "Assistant Professor", email: "", phone: "", specialization: "", experience: 1, status: "Active" }); setModal("add-faculty"); };
  const openEditFaculty = f => { setFormData({ ...f }); setModal("edit-faculty"); };
  const saveFaculty = () => {
    if (!formData.name || !formData.email) return showToast("Name and Email are required", "error");
    const did = activeDept.id;
    if (modal === "add-faculty") {
      setAllFaculty(p => ({ ...p, [did]: [...(p[did] || []), { ...formData, id: Date.now() }] }));
      showToast("Faculty added!");
    } else {
      setAllFaculty(p => ({ ...p, [did]: p[did].map(f => f.id === formData.id ? formData : f) }));
      showToast("Faculty updated!");
    }
    setModal(null);
  };
  const deleteFaculty = fid => {
    setAllFaculty(p => ({ ...p, [activeDept.id]: p[activeDept.id].filter(f => f.id !== fid) }));
    showToast("Faculty removed!");
  };

  /* ── FILTERED DATA ── */
  const filteredDepts = useMemo(() => departments.filter(d =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    d.code.toLowerCase().includes(deptSearch.toLowerCase())
  ), [departments, deptSearch]);

  const deptCourses = useMemo(() => (activeDept ? (allCourses[activeDept.id] || []) : []).filter(c =>
    (!courseSearch || c.name.toLowerCase().includes(courseSearch.toLowerCase()) || c.code.toLowerCase().includes(courseSearch.toLowerCase())) &&
    (!semFilter || String(c.semester) === semFilter) &&
    (!typeFilter || c.type === typeFilter)
  ), [activeDept, allCourses, courseSearch, semFilter, typeFilter]);

  const deptFaculty = useMemo(() => (activeDept ? (allFaculty[activeDept.id] || []) : []).filter(f =>
    !facultySearch || f.name.toLowerCase().includes(facultySearch.toLowerCase()) || f.specialization.toLowerCase().includes(facultySearch.toLowerCase())
  ), [activeDept, allFaculty, facultySearch]);

  const totalStudents = useMemo(() => departments.reduce((a) => a + Math.floor(Math.random() * 80 + 120), 0), [departments]);

  /* ── STATS ── */
  const statsData = [
    { label: "Departments", value: departments.length, sub: "Active" },
    { label: "Total Faculty", value: Object.values(allFaculty).reduce((a, arr) => a + arr.length, 0), sub: "Teaching" },
    { label: "Total Courses", value: Object.values(allCourses).reduce((a, arr) => a + arr.length, 0), sub: "Offered" },
    { label: "Avg Attendance", value: `${Math.round(Object.values(allCourses).flat().reduce((a, c) => a + c.attendance, 0) / Math.max(1, Object.values(allCourses).flat().length))}%`, sub: "This Semester" },
  ];

  /* ═══════════════════════ RENDER ═══════════════════════ */

  return (
    <motion.div className="dashboard ap" variants={staggerContainer} initial="hidden" animate="visible">
      <div className="ap__objects" aria-hidden="true">
        <span className="ap__object ap__object--a" />
        <span className="ap__object ap__object--b" />
        <span className="ap__object ap__object--c" />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className={`dept-toast dept-toast--${toast.type}`} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {toast.type === "success" ? "✓" : "✕"} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      {modal && (
        <Modal
          title={
            modal === "add-dept" ? "Add Department" :
            modal === "edit-dept" ? "Edit Department" :
            modal === "add-course" ? "Add Course" :
            modal === "edit-course" ? "Edit Course" :
            modal === "add-faculty" ? "Add Faculty" : "Edit Faculty"
          }
          onClose={() => setModal(null)}
        >
          {/* DEPT FORM */}
          {(modal === "add-dept" || modal === "edit-dept") && (
            <div className="dept-form">
              <div className="dept-form-row2">
                <div><label>Department Name*</label><input className="dept-input" value={formData.name || ""} onChange={e => field("name", e.target.value)} placeholder="e.g. Computer Science" /></div>
                <div><label>Code*</label><input className="dept-input" value={formData.code || ""} onChange={e => field("code", e.target.value.toUpperCase())} placeholder="CSE" /></div>
              </div>
              <div className="dept-form-row2">
                <div><label>Icon (emoji)</label><input className="dept-input" value={formData.icon || ""} onChange={e => field("icon", e.target.value)} placeholder="💻" /></div>
                <div><label>Color</label><input className="dept-input" type="color" value={formData.color || "#319cb5"} onChange={e => field("color", e.target.value)} /></div>
              </div>
              <div className="dept-form-row2">
                <div><label>Head of Department</label><input className="dept-input" value={formData.hod || ""} onChange={e => field("hod", e.target.value)} placeholder="Dr. Name" /></div>
                <div><label>Established</label><input className="dept-input" type="number" value={formData.established || ""} onChange={e => field("established", e.target.value)} placeholder="1985" /></div>
              </div>
              <div className="dept-form-row2">
                <div><label>Building</label><input className="dept-input" value={formData.building || ""} onChange={e => field("building", e.target.value)} placeholder="Block A" /></div>
                <div><label>Phone</label><input className="dept-input" value={formData.phone || ""} onChange={e => field("phone", e.target.value)} placeholder="+91-..." /></div>
              </div>
              <div><label>Description</label><textarea className="dept-textarea" rows={3} value={formData.description || ""} onChange={e => field("description", e.target.value)} placeholder="Brief description..." /></div>
              <div className="dept-form-actions">
                <button className="ap__btn ap__btn--outline" onClick={() => setModal(null)}>Cancel</button>
                <button className="ap__btn ap__btn--primary" onClick={saveDept}>Save Department</button>
              </div>
            </div>
          )}
          {/* COURSE FORM */}
          {(modal === "add-course" || modal === "edit-course") && (
            <div className="dept-form">
              <div className="dept-form-row2">
                <div><label>Course Code*</label><input className="dept-input" value={formData.code || ""} onChange={e => field("code", e.target.value.toUpperCase())} placeholder="CS101" /></div>
                <div><label>Course Name*</label><input className="dept-input" value={formData.name || ""} onChange={e => field("name", e.target.value)} placeholder="Programming Fundamentals" /></div>
              </div>
              <div className="dept-form-row2">
                <div><label>Credits</label><input className="dept-input" type="number" min="1" max="6" value={formData.credits || ""} onChange={e => field("credits", Number(e.target.value))} /></div>
                <div><label>Semester</label>
                  <select className="dept-input" value={formData.semester || ""} onChange={e => field("semester", Number(e.target.value))}>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                </div>
              </div>
              <div className="dept-form-row2">
                <div><label>Type</label>
                  <select className="dept-input" value={formData.type || "Core"} onChange={e => field("type", e.target.value)}>
                    <option>Core</option><option>Elective</option>
                  </select>
                </div>
                <div><label>Assign Faculty</label>
                  <select className="dept-input" value={formData.facultyId || ""} onChange={e => field("facultyId", e.target.value)}>
                    <option value="">None</option>
                    {(allFaculty[activeDept?.id] || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="dept-form-row2">
                <div><label>Enrolled Students</label><input className="dept-input" type="number" value={formData.enrolled || ""} onChange={e => field("enrolled", Number(e.target.value))} /></div>
                <div><label>Attendance %</label><input className="dept-input" type="number" min="0" max="100" value={formData.attendance || ""} onChange={e => field("attendance", Number(e.target.value))} /></div>
              </div>
              <div className="dept-form-actions">
                <button className="ap__btn ap__btn--outline" onClick={() => setModal(null)}>Cancel</button>
                <button className="ap__btn ap__btn--primary" onClick={saveCourse}>Save Course</button>
              </div>
            </div>
          )}
          {/* FACULTY FORM */}
          {(modal === "add-faculty" || modal === "edit-faculty") && (
            <div className="dept-form">
              <div><label>Full Name*</label><input className="dept-input" value={formData.name || ""} onChange={e => field("name", e.target.value)} placeholder="Dr. Full Name" /></div>
              <div className="dept-form-row2">
                <div><label>Designation</label>
                  <select className="dept-input" value={formData.designation || ""} onChange={e => field("designation", e.target.value)}>
                    <option>Professor & HOD</option><option>Professor</option><option>Associate Professor</option><option>Assistant Professor</option>
                  </select>
                </div>
                <div><label>Status</label>
                  <select className="dept-input" value={formData.status || "Active"} onChange={e => field("status", e.target.value)}>
                    <option>Active</option><option>On Leave</option><option>Retired</option>
                  </select>
                </div>
              </div>
              <div className="dept-form-row2">
                <div><label>Email*</label><input className="dept-input" type="email" value={formData.email || ""} onChange={e => field("email", e.target.value)} placeholder="name@college.edu" /></div>
                <div><label>Phone</label><input className="dept-input" value={formData.phone || ""} onChange={e => field("phone", e.target.value)} placeholder="98XXXXXXXX" /></div>
              </div>
              <div className="dept-form-row2">
                <div><label>Specialization</label><input className="dept-input" value={formData.specialization || ""} onChange={e => field("specialization", e.target.value)} placeholder="Machine Learning" /></div>
                <div><label>Experience (years)</label><input className="dept-input" type="number" min="0" value={formData.experience || ""} onChange={e => field("experience", Number(e.target.value))} /></div>
              </div>
              <div className="dept-form-actions">
                <button className="ap__btn ap__btn--outline" onClick={() => setModal(null)}>Cancel</button>
                <button className="ap__btn ap__btn--primary" onClick={saveFaculty}>Save Faculty</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      <div className="ap__inner">
        {/* Header */}
        <motion.div className="ap__header" variants={fadeInUp}>
          <div className="ap__header-left">
            <button className="ap__back-btn" onClick={activeDept ? () => setActiveDept(null) : () => navigate("/admin-dashboard")}>
              {activeDept ? `← Departments` : "← Dashboard"}
            </button>
            <div>
              <p className="ap__eyebrow">Admin Panel</p>
              <h1 className="ap__title">{activeDept ? `${activeDept.icon} ${activeDept.code} — ${activeDept.name}` : "Departments & Courses"}</h1>
              <p className="ap__subtitle">{activeDept ? `HOD: ${activeDept.hod} · ${activeDept.building} · ${activeDept.phone}` : "Manage departments, faculty, courses, and timetables"}</p>
            </div>
          </div>
          <div className="ap__header-actions">
            {!activeDept && <button className="ap__btn ap__btn--primary" onClick={openAddDept}>+ Add Department</button>}
            {activeDept && activeTab === "courses" && <button className="ap__btn ap__btn--primary" onClick={openAddCourse}>+ Add Course</button>}
            {activeDept && activeTab === "faculty" && <button className="ap__btn ap__btn--primary" onClick={openAddFaculty}>+ Add Faculty</button>}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div className="ap__stats" variants={staggerContainer}>
          {statsData.map((s, i) => (
            <motion.div className="ap__stat" key={i} variants={fadeInUp}>
              <p className="ap__stat-label">{s.label}</p>
              <p className="ap__stat-value">{s.value}</p>
              <p className="ap__stat-sub">{s.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ════ DEPT LIST VIEW ════ */}
        {!activeDept && (
          <motion.div className="ap__panel" variants={fadeInUp}>
            <div className="ap__panel-header">
              <h2 className="ap__panel-title">All Departments <span className="ap__panel-count">({filteredDepts.length})</span></h2>
              <div className="ap__filters" style={{ marginTop: 0 }}>
                <input className="ap__search" placeholder="Search departments..." value={deptSearch} onChange={e => setDeptSearch(e.target.value)} />
              </div>
            </div>
            <div className="ap__dept-grid">
              {filteredDepts.map((dept, i) => {
                const fCount = (allFaculty[dept.id] || []).length;
                const cCount = (allCourses[dept.id] || []).length;
                return (
                  <motion.div className="ap__dept-card" key={dept.id} variants={fadeInUp} transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 24 } }}
                    style={{ "--dept-color": dept.color }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div className="ap__dept-icon" style={{ background: `${dept.color}20` }}>{dept.icon}</div>
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button className="dept-icon-btn" title="Edit" onClick={() => openEditDept(dept)}>✏️</button>
                        <button className="dept-icon-btn dept-icon-btn--del" title="Delete" onClick={() => deleteDept(dept.id)}>🗑️</button>
                      </div>
                    </div>
                    <p className="ap__dept-name" style={{ marginTop: "0.5rem" }}>{dept.name}</p>
                    <p className="ap__dept-meta">Code: <strong style={{ color: dept.color }}>{dept.code}</strong> · Est. {dept.established}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.75rem", lineHeight: 1.4 }}>{dept.description}</p>
                    <div className="ap__dept-stats">
                      <div className="ap__dept-stat">
                        <span className="ap__dept-stat-val" style={{ color: dept.color }}>{fCount}</span>
                        <span className="ap__dept-stat-label">Faculty</span>
                      </div>
                      <div className="ap__dept-stat">
                        <span className="ap__dept-stat-val" style={{ color: dept.color }}>{cCount}</span>
                        <span className="ap__dept-stat-label">Courses</span>
                      </div>
                    </div>
                    <button className="dept-view-btn" style={{ "--dept-color": dept.color }} onClick={() => { setActiveDept(dept); setActiveTab("courses"); }}>
                      View Details →
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ════ DEPT DETAIL VIEW ════ */}
        {activeDept && (
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            {/* Tabs */}
            <div className="dept-tabs">
              {["courses", "faculty", "timetable"].map(tab => (
                <button key={tab} className={`dept-tab${activeTab === tab ? " dept-tab--active" : ""}`}
                  style={{ "--tab-color": activeDept.color }} onClick={() => setActiveTab(tab)}>
                  {tab === "courses" ? "📚 Courses" : tab === "faculty" ? "👩‍🏫 Faculty" : "🗓️ Timetable"}
                </button>
              ))}
            </div>

            {/* ── COURSES TAB ── */}
            {activeTab === "courses" && (
              <motion.div className="ap__panel" variants={fadeInUp}>
                <div className="ap__panel-header">
                  <h2 className="ap__panel-title">Courses <span className="ap__panel-count">({deptCourses.length})</span></h2>
                </div>
                <div className="ap__filters">
                  <input className="ap__search" placeholder="Search courses..." value={courseSearch} onChange={e => setCourseSearch(e.target.value)} />
                  <select className="ap__select" value={semFilter} onChange={e => setSemFilter(e.target.value)}>
                    <option value="">All Semesters</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                  </select>
                  <select className="ap__select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                    <option value="">All Types</option>
                    <option>Core</option><option>Elective</option>
                  </select>
                </div>
                <div className="ap__table-wrap">
                  <table className="ap__table">
                    <thead><tr><th>Code</th><th>Name</th><th>Credits</th><th>Sem</th><th>Type</th><th>Faculty</th><th>Enrolled</th><th>Attendance</th><th>Actions</th></tr></thead>
                    <tbody>
                      {deptCourses.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-secondary)" }}>No courses found</td></tr>}
                      {deptCourses.map(course => {
                        const fac = (allFaculty[activeDept.id] || []).find(f => f.id === course.facultyId);
                        return (
                          <tr key={course.id}>
                            <td><code style={{ color: activeDept.color, fontWeight: 700 }}>{course.code}</code></td>
                            <td style={{ fontWeight: 500 }}>{course.name}</td>
                            <td style={{ textAlign: "center" }}>{course.credits}</td>
                            <td style={{ textAlign: "center" }}>
                              <span className="ap__badge ap__badge--student">Sem {course.semester}</span>
                            </td>
                            <td>
                              <span className={`ap__badge ${course.type === "Core" ? "ap__badge--active" : "ap__badge--warn"}`}>{course.type}</span>
                            </td>
                            <td style={{ fontSize: "0.8rem" }}>{fac ? fac.name : <span className="ap__badge ap__badge--error">Unassigned</span>}</td>
                            <td style={{ textAlign: "center" }}>{course.enrolled}</td>
                            <td>
                              <div className="dept-card-bar">
                                <div style={{ flex: 1, height: "6px", background: "var(--color-border)", borderRadius: "3px", overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${course.attendance}%`, background: course.attendance >= 75 ? "#10b981" : "#ef4444", borderRadius: "3px", transition: "width 0.6s ease" }} />
                                </div>
                                <span style={{ fontSize: "0.75rem", color: course.attendance >= 75 ? "#10b981" : "#ef4444", minWidth: "34px" }}>{course.attendance}%</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "0.35rem" }}>
                                <button className="dept-icon-btn" onClick={() => openEditCourse(course)}>✏️</button>
                                <button className="dept-icon-btn dept-icon-btn--del" onClick={() => deleteCourse(course.id)}>🗑️</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ── FACULTY TAB ── */}
            {activeTab === "faculty" && (
              <motion.div className="ap__panel" variants={fadeInUp}>
                <div className="ap__panel-header">
                  <h2 className="ap__panel-title">Faculty <span className="ap__panel-count">({deptFaculty.length})</span></h2>
                </div>
                <div className="ap__filters">
                  <input className="ap__search" placeholder="Search faculty..." value={facultySearch} onChange={e => setFacultySearch(e.target.value)} />
                </div>
                <div className="dept-faculty-grid">
                  {deptFaculty.length === 0 && <p style={{ color: "var(--color-text-secondary)", textAlign: "center", padding: "2rem" }}>No faculty found</p>}
                  {deptFaculty.map(f => (
                    <motion.div className="dept-faculty-card" key={f.id} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
                      <div className="dept-faculty-card__avatar" style={{ background: `${activeDept.color}22`, color: activeDept.color }}>
                        {f.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="dept-faculty-card__info">
                        <p className="dept-faculty-card__name">{f.name}</p>
                        <p className="dept-faculty-card__desig">{f.designation}</p>
                        <p className="dept-faculty-card__meta">🎓 {f.specialization}</p>
                        <p className="dept-faculty-card__meta">📧 {f.email}</p>
                        <p className="dept-faculty-card__meta">📞 {f.phone} · {f.experience} yrs exp</p>
                        <span className={`ap__badge ${f.status === "Active" ? "ap__badge--active" : "ap__badge--warn"}`} style={{ marginTop: "0.5rem" }}>{f.status}</span>
                      </div>
                      <div className="dept-faculty-card__actions">
                        <button className="dept-icon-btn" onClick={() => openEditFaculty(f)}>✏️</button>
                        <button className="dept-icon-btn dept-icon-btn--del" onClick={() => deleteFaculty(f.id)}>🗑️</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── TIMETABLE TAB ── */}
            {activeTab === "timetable" && (
              <motion.div className="ap__panel" variants={fadeInUp}>
                <div className="ap__panel-header">
                  <h2 className="ap__panel-title">Weekly Timetable</h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", margin: 0 }}>Showing schedule for all {(allCourses[activeDept.id] || []).length} courses</p>
                </div>
                <TimetableView courses={allCourses[activeDept.id] || []} faculty={allFaculty[activeDept.id] || []} />
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default AdminDepartments;
