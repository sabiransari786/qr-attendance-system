import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, MessageSquare, Star, Send, CheckCircle } from "lucide-react";
import "../styles/legal.css";

function Feedback() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would POST to backend
    setSubmitted(true);
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "0.5rem",
    border: "1px solid var(--border-color, #e2e8f0)",
    background: "var(--bg-secondary, #f8fafc)",
    color: "var(--text-primary, #1e293b)",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  return (
    <motion.div
      className="legal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="legal__container">
        <Link to="/" className="legal__back">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <div className="legal__header">
          <MessageSquare size={32} className="legal__icon" />
          <h1 className="legal__title">Feedback</h1>
          <p className="legal__updated">Your feedback helps us improve the system.</p>
        </div>

        <div className="legal__content">
          {submitted ? (
            <section className="legal__section" style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <CheckCircle size={56} style={{ color: "#22c55e", marginBottom: "1rem" }} />
              <h2 style={{ marginBottom: "0.5rem" }}>Thank You!</h2>
              <p style={{ opacity: 0.8, maxWidth: 420, margin: "0 auto 1.5rem" }}>
                Your feedback has been received. We appreciate you taking the time to help us improve the QR Attendance system.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setRating(0);
                  setCategory("");
                  setMessage("");
                }}
                style={{
                  padding: "0.6rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: "var(--color-primary, #319cb5)",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.95rem",
                }}
              >
                Submit Another
              </button>
            </section>
          ) : (
            <form onSubmit={handleSubmit}>
              <section className="legal__section">
                <h2>Rate Your Experience</h2>
                <p style={{ marginBottom: "0.75rem" }}>How would you rate the overall system?</p>
                <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={32}
                      fill={(hoverRating || rating) >= star ? "#f59e0b" : "none"}
                      stroke={(hoverRating || rating) >= star ? "#f59e0b" : "var(--text-secondary, #94a3b8)"}
                      style={{ cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
                {rating > 0 && (
                  <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </p>
                )}
              </section>

              <section className="legal__section">
                <h2>Category</h2>
                <p style={{ marginBottom: "0.75rem" }}>What is your feedback about?</p>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  style={inputStyle}
                >
                  <option value="">Select a category</option>
                  <option value="ui">User Interface & Design</option>
                  <option value="qr">QR Code Scanning</option>
                  <option value="attendance">Attendance Tracking</option>
                  <option value="performance">Performance & Speed</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                  <option value="other">Other</option>
                </select>
              </section>

              <section className="legal__section">
                <h2>Your Feedback</h2>
                <p style={{ marginBottom: "0.75rem" }}>Tell us what you think or suggest improvements.</p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="Write your feedback here..."
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                />
              </section>

              <section className="legal__section" style={{ textAlign: "center", paddingTop: "0.5rem" }}>
                <button
                  type="submit"
                  disabled={!message.trim() || !category}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 2rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    background: (!message.trim() || !category)
                      ? "var(--text-secondary, #94a3b8)"
                      : "var(--color-primary, #319cb5)",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: (!message.trim() || !category) ? "not-allowed" : "pointer",
                    fontSize: "1rem",
                    transition: "background 0.2s",
                  }}
                >
                  <Send size={18} />
                  Submit Feedback
                </button>
              </section>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default Feedback;
