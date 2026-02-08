import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentDashboard from "./pages/StudentDashboard";
import ScanQR from "./pages/ScanQR";
import AttendanceHistory from "./pages/AttendanceHistory";
import SubjectAttendance from "./pages/SubjectAttendance";
import StudentProfile from "./pages/StudentProfile";
import FacultyDashboard from "./pages/FacultyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

import "./App.css";

function App() {
  useEffect(() => {
    // Initialize theme on app load - Default to light
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme ? savedTheme === "dark" : false;
    
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
    }
  }, []);

  return (
    <div className="app-root">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Student Routes */}
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/scan-qr" element={<ScanQR />} />
          <Route path="/student/attendance-history" element={<AttendanceHistory />} />
          <Route path="/student/subject/:subjectId" element={<SubjectAttendance />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          
          {/* Faculty & Admin Routes */}
          <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
