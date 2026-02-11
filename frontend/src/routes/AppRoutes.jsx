import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Pages
import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import ForgotPassword from "../pages/ForgotPassword";
import StudentDashboard from "../pages/StudentDashboardWithRecords";
import FacultyDashboard from "../pages/FacultyDashboardWithCharts";
import FacultyProfile from "../pages/FacultyProfile";
import FacultySessions from "../pages/FacultySessions";
import FacultyAttendanceReports from "../pages/FacultyAttendanceReports";
import AdminDashboard from "../pages/AdminDashboard";
import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/Unauthorized";
import FacultyQRGeneration from "../pages/FacultyQRGeneration";
import StudentProfile from "../pages/StudentProfile";

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

      {/* Protected Routes - Role-based dashboards */}
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <StudentDashboard />
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
        path="/admin-dashboard"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <AdminDashboard />
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
