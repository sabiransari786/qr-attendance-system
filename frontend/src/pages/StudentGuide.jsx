import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, BookOpen, QrCode, ClipboardList, Bell, User,
  History, Shield, CheckCircle, Smartphone, Clock, AlertTriangle,
  HelpCircle, ChevronRight
} from "lucide-react";
import "../styles/legal.css";

const steps = [
  {
    icon: User,
    title: "1. Registration & Login",
    desc: "First, get pre-approved by your admin. Then sign up using the same email and contact number that was approved. After registration, log in with your email and password.",
    tips: [
      "Use the exact email and phone number your admin has approved.",
      "Set a strong password — at least 6 characters with uppercase, numbers & special characters.",
      "If you forget your password, use the 'Forgot Password' option on the login page.",
    ],
  },
  {
    icon: QrCode,
    title: "2. Scan QR Code",
    desc: "When your teacher starts a class session, a QR code is displayed. Open the 'Scan QR' page from your dashboard and scan it with your device camera to mark your attendance.",
    tips: [
      "Make sure you allow camera access when prompted.",
      "Point your camera steadily at the QR code — it scans automatically.",
      "QR codes refresh periodically for security, so scan quickly.",
      "You must be in the same department and semester as the session to mark attendance.",
    ],
  },
  {
    icon: History,
    title: "3. Attendance History",
    desc: "View all your past attendance records — across subjects and sessions. See which classes you attended, were late for, or missed.",
    tips: [
      "Filter by subject or date range to find specific records.",
      "Green = Present, Yellow = Late, Red = Absent.",
      "Download or view your attendance percentage per subject.",
    ],
  },
  {
    icon: ClipboardList,
    title: "4. Attendance Requests",
    desc: "Missed a class due to a genuine reason? You can submit a manual attendance request to your faculty with an explanation. The faculty will review and approve or reject it.",
    tips: [
      "Provide a clear reason for your absence.",
      "Requests can only be made for sessions you actually missed.",
      "Check the status of your request (Pending / Approved / Rejected) from the requests page.",
    ],
  },
  {
    icon: Bell,
    title: "5. Notifications",
    desc: "Stay updated with real-time notifications — new sessions created, attendance confirmations, request status updates, and important announcements.",
    tips: [
      "Check your notification bell regularly for updates.",
      "Unread notifications appear as a badge count.",
    ],
  },
  {
    icon: User,
    title: "6. Profile Management",
    desc: "View and update your profile details — name, contact, profile photo, and more. Your department, student ID, and semester are synced from the system.",
    tips: [
      "Upload a profile photo for a personal touch.",
      "Keep your contact number up to date.",
      "Department and semester are set by admin — contact admin if they need correction.",
    ],
  },
];

const faqs = [
  {
    q: "I scanned the QR but my attendance didn't mark?",
    a: "Ensure you're in the correct department and semester for that session. Also check that the QR code hasn't expired — they refresh every few seconds.",
  },
  {
    q: "Can I mark attendance from another class's QR?",
    a: "No. The system checks your branch and semester. If they don't match the session, you'll get an error like 'Branch mismatch' or 'Semester mismatch'.",
  },
  {
    q: "What counts as 'Late' attendance?",
    a: "If you scan the QR more than 15 minutes after the session starts, your attendance is marked as 'Late' instead of 'Present'.",
  },
  {
    q: "How do I check my overall attendance percentage?",
    a: "Go to Attendance History on your dashboard. You can see per-subject and overall attendance percentages there.",
  },
  {
    q: "My profile shows wrong department or semester?",
    a: "Contact your admin — only admins can update department and semester details in the approval system.",
  },
];

function StudentGuide() {
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
          <BookOpen size={32} className="legal__icon" />
          <h1 className="legal__title">Student Guide</h1>
          <p className="legal__updated">
            Everything you need to know about using the QR Attendance System as a student.
          </p>
        </div>

        <div className="legal__content">
          {/* Quick Overview */}
          <section className="legal__section">
            <h2>Quick Overview</h2>
            <p>
              As a student, you can scan QR codes to mark attendance, view your attendance history,
              submit manual attendance requests, manage your profile, and receive notifications —
              all from your dashboard.
            </p>
          </section>

          {/* Step-by-step Guide */}
          {steps.map((step, i) => (
            <section className="legal__section" key={i}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <step.icon size={20} style={{ color: "var(--color-primary, #319cb5)", flexShrink: 0 }} />
                {step.title}
              </h2>
              <p>{step.desc}</p>
              <ul>
                {step.tips.map((tip, j) => (
                  <li key={j}>{tip}</li>
                ))}
              </ul>
            </section>
          ))}

          {/* Important Rules */}
          <section className="legal__section">
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={20} style={{ color: "var(--color-primary, #319cb5)" }} />
              Important Rules
            </h2>
            <ul>
              <li>
                <strong>Same Branch Only:</strong> You can only mark attendance for sessions in your own department/branch.
              </li>
              <li>
                <strong>Same Semester Only:</strong> You cannot attend sessions of a different semester than your current one.
              </li>
              <li>
                <strong>No Duplicate Attendance:</strong> You can only mark attendance once per session per day.
              </li>
              <li>
                <strong>QR Expiry:</strong> QR codes expire quickly for security — don't wait too long to scan.
              </li>
              <li>
                <strong>Honesty:</strong> Any suspicious activity (e.g., proxy attendance) may be flagged by the system.
              </li>
            </ul>
          </section>

          {/* FAQ */}
          <section className="legal__section">
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <HelpCircle size={20} style={{ color: "var(--color-primary, #319cb5)" }} />
              Frequently Asked Questions
            </h2>
            {faqs.map((faq, i) => (
              <div key={i} style={{ marginBottom: "1.25rem" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.3rem" }}>
                  Q: {faq.q}
                </p>
                <p style={{ opacity: 0.85 }}>A: {faq.a}</p>
              </div>
            ))}
          </section>

          {/* Need More Help */}
          <section className="legal__section">
            <h2>Need More Help?</h2>
            <p>
              If you face any issues or have questions not covered here, contact your faculty or the system admin.
              They can help with account issues, department corrections, and more.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

export default StudentGuide;
