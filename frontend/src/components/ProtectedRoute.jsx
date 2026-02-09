import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * ProtectedRoute Component
 * 
 * Ensures that only authenticated users can access certain routes
 * If user is not authenticated, redirects to login page
 * If user role doesn't match required roles, redirects to unauthorized page
 */
function ProtectedRoute({ children, requiredRoles = [] }) {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    return <Navigate to="/login" replace />;
  }

  const { isAuthenticated, isLoading, user } = authContext;

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user role is allowed (if requiredRoles is specified)
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;
