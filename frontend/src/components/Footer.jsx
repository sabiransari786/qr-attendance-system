import "../styles/footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" aria-label="QR-Based Attendance Tracking System footer">
      <div className="footer__inner">
        <div className="footer__primary">
          <h2 className="footer__title">QR-Based Attendance Tracking System</h2>
          <p className="footer__tagline">
            A secure, QR-driven platform for accurate and efficient academic
            attendance management.
          </p>
        </div>

        <div className="footer__meta">
          <p className="footer__institution">[College / Institution Name]</p>
          <p className="footer__year">© {currentYear} Project</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

