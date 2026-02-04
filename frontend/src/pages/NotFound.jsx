import "../styles/auth.css";

function NotFound() {
  return (
    <div className="auth">
      <div className="auth__card">
        <h1 className="auth__title">Page not found</h1>
        <p className="auth__subtitle">
          The page you are looking for does not exist or may have been moved.
        </p>
      </div>
    </div>
  );
}

export default NotFound;

