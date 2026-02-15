import { useNavigate } from "react-router-dom";
import "../styles/unauthorized.css";

/**
 * Unauthorized Component
 *
 * Purpose:
 * - Inform user that access is denied
 * - Guide user to a valid page based on authentication status
 * - Support role-based access control
 *
 * Security Note:
 * - Display-only page
 * - No backend interaction
 * - No state management
 */

function Unauthorized() {
  const navigate = useNavigate();

  /**
   * Check if user is authenticated by looking for auth token
   */
  const isAuthenticated = !!sessionStorage.getItem("authToken");

  /**
   * Handle redirect based on authentication status
   * - If authenticated: Go to home/dashboard
   * - If not authenticated: Go to login
   */
  const handleRedirect = () => {
    if (isAuthenticated) {
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="unauthorized__container">
      <div className="unauthorized__objects" aria-hidden="true">
        <span className="unauthorized__object unauthorized__object--sphere" />
        <span className="unauthorized__object unauthorized__object--ring" />
        <span className="unauthorized__object unauthorized__object--cube" />
      </div>
      {/* Start of card */}
      <section className="unauthorized__card" aria-labelledby="unauthorized-title">
        {/* Message Section */}
        <header className="unauthorized__header">
          <h1 id="unauthorized-title" className="unauthorized__title">
            Access Denied
          </h1>
          <p className="unauthorized__message">
            You do not have permission to access this page.
          </p>
          <p className="unauthorized__description">
            If you believe this is an error, please contact your administrator or sign in with a different account.
          </p>
        </header>

        {/* Action Button */}
        <footer className="unauthorized__footer">
          <button
            className="unauthorized__button"
            type="button"
            onClick={handleRedirect}
            aria-label={
              isAuthenticated
                ? "Go to home page"
                : "Go to login page"
            }
          >
            {isAuthenticated ? "Go to Dashboard" : "Go to Login"}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default Unauthorized;
