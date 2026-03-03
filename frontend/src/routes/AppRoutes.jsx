import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Pages
import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import ForgotPassword from "../pages/ForgotPassword";
import StudentDashboardEnhanced from "../pages/StudentDashboardEnhanced";
import FacultyDashboard from "../pages/FacultyDashboardWithCharts";
import FacultyProfile from "../pages/FacultyProfile";
import FacultySessions from "../pages/FacultySessions";
import FacultyAttendanceReports from "../pages/FacultyAttendanceReports";
import FacultySuspiciousActivity from "../pages/FacultySuspiciousActivity";
import AdminDashboard from "../pages/AdminDashboard";
import AdminProfile from "../pages/AdminProfile";
import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/Unauthorized";
import FacultyQRGeneration from "../pages/FacultyQRGeneration";
import StudentProfile from "../pages/StudentProfile";
import ScanQREnhanced from "../pages/ScanQREnhanced";
import AttendanceHistory from "../pages/AttendanceHistory";
import Notifications from "../pages/Notifications";
import AdminUserApprovalPage from "../pages/AdminUserApprovalPage";
import AdminStudentDirectory from "../pages/AdminStudentDirectory";
import AdminUserAccess from "../pages/AdminUserAccess";
import AdminActivityLogs from "../pages/AdminActivityLogs";
import AdminDepartments from "../pages/AdminDepartments";
import AdminSystemReports from "../pages/AdminSystemReports";
import AdminTeacherManagement from "../pages/AdminTeacherManagement";
import StudentAttendanceRequest from "../pages/StudentAttendanceRequest";
import FacultyAttendanceRequests from "../pages/FacultyAttendanceRequests";
import TermsAndConditions from "../pages/TermsAndConditions";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import CookiePolicy from "../pages/CookiePolicy";
import StudentGuide from "../pages/StudentGuide";
import SecurityInfo from "../pages/SecurityInfo";
import Support from "../pages/Support";
import Feedback from "../pages/Feedback";

// Components
import ProtectedRoute from "../components/ProtectedRoute";

/**
 * AppRoutes Component
 * 
 * Defines all application routes with proper protection
 * - Public routes: Home, Login, Signup
 * - Protected routes: Dashboards (role-based)
 */
function AppRoutes() {
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated || false;

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to={`/${authContext.user.role}-dashboard`} replace /> : <Login />} 
      />
      <Route 
        path="/signup" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />} 
      />
      <Route 
        path="/forgot-password" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />} 
      />
      <Route path="/terms" element={<TermsAndConditions />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/cookies" element={<CookiePolicy />} />
      <Route path="/student-guide" element={<StudentGuide />} />
      <Route path="/security" element={<SecurityInfo />} />
      <Route path="/support" element={<Support />} />
      <Route path="/feedback" element={<Feedback />} />

      {/* Protected Routes - Role-based dashboards */}
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <StudentDashboardEnhanced />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student-profile"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <StudentProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scan-qr"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <ScanQREnhanced />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance-history"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <AttendanceHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance-request"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <StudentAttendanceRequest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty-dashboard"
        element={
          <ProtectedRoute requiredRoles={["faculty"]}>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty-profile"
        element={
          <ProtectedRoute requiredRoles={["faculty"]}>
            <FacultyProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/sessions"
        element={
          <ProtectedRoute requiredRoles={["faculty"]}>
            <FacultySessions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/attendance-reports"
        element={
          <ProtectedRoute requiredRoles={["faculty"]}>
            <FacultyAttendanceReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/qr-generation"
        element={
          <ProtectedRoute requiredRoles={["faculty"]}>
            <FacultyQRGeneration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/suspicious-activity"
        element={
          <ProtectedRoute requiredRoles={["faculty"]}>
            <FacultySuspiciousActivity />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/attendance-requests"
        element={
          <ProtectedRoute requiredRoles={["faculty"]}>
            <FacultyAttendanceRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-profile"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <AdminProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/approvals"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <AdminUserApprovalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <AdminStudentDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <AdminUserAccess />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/activity-logs"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <AdminActivityLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <AdminDepartments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <AdminSystemReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teachers"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <AdminTeacherManagement />
          </ProtectedRoute>
        }
      />

      {/* Error Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
