from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem

OUT_PATH = "docs/Admin_Module_Frontend_Hinglish.pdf"


def build_pdf() -> None:
    doc = SimpleDocTemplate(
        OUT_PATH,
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=1.6 * cm,
        bottomMargin=1.6 * cm,
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="TitleX",
            parent=styles["Title"],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#0f172a"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="H1",
            parent=styles["Heading1"],
            fontSize=14,
            leading=18,
            spaceBefore=10,
            spaceAfter=6,
            textColor=colors.HexColor("#111827"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="H2",
            parent=styles["Heading2"],
            fontSize=11.5,
            leading=15,
            spaceBefore=7,
            spaceAfter=4,
            textColor=colors.HexColor("#1f2937"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodyX",
            parent=styles["BodyText"],
            fontSize=9.6,
            leading=13.8,
            textColor=colors.HexColor("#111827"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="Small",
            parent=styles["BodyText"],
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#374151"),
        )
    )

    story = []

    def p(text: str, style: str = "BodyX") -> None:
        story.append(Paragraph(text, styles[style]))

    def sp(height_cm: float = 0.16) -> None:
        story.append(Spacer(1, height_cm * cm))

    def bullets(items: list[str]) -> None:
        list_flow = ListFlowable(
            [ListItem(Paragraph(item, styles["BodyX"])) for item in items],
            bulletType="bullet",
            leftIndent=14,
        )
        story.append(list_flow)

    p("QR Attendance System - Admin Module (Frontend) Guide", "TitleX")
    p("Language: Hinglish | Scope: Sirf Frontend Part | Date: 20 March 2026", "Small")
    sp(0.25)

    p("1) Overview", "H1")
    p(
        "Ye document admin module ka frontend perspective explain karta hai: route protection, har admin page ka purpose, UI flow, API integration, reusable design system, aur practical behavior. Isme backend internals deep me cover nahi kiye gaye, kyunki requirement sirf frontend thi."
    )

    p("2) Frontend Architecture Snapshot", "H1")
    bullets(
        [
            "Routing Layer: frontend/src/routes/AppRoutes.jsx me admin routes defined hain.",
            "Auth Guard: frontend/src/components/ProtectedRoute.jsx role-based access enforce karta hai (requiredRoles=['admin']).",
            "Pages: Admin module ke major pages frontend/src/pages/Admin*.jsx me hain.",
            "Theme + Shared UI: Admin pages mostly admin-pages.css + dashboard.css + page-specific CSS use karte hain.",
            "API URL Resolution: frontend/src/utils/constants.js ka API_BASE_URL runtime hostname based endpoint banata hai.",
        ]
    )

    p("3) Admin Route Map (Frontend)", "H1")
    bullets(
        [
            "/admin-dashboard -> AdminDashboard",
            "/admin-profile -> AdminProfile",
            "/admin/approvals -> AdminUserApprovalPage",
            "/admin/students -> AdminStudentDirectory",
            "/admin/users -> AdminUserAccess",
            "/admin/activity-logs -> AdminActivityLogs",
            "/admin/departments -> AdminDepartments",
            "/admin/reports -> AdminSystemReports",
            "/admin/teachers -> AdminTeacherManagement",
        ]
    )

    p("4) Access Control Flow (Frontend View)", "H1")
    bullets(
        [
            "User login ke baad role AuthContext me aata hai.",
            "ProtectedRoute pe loading check, auth check, aur role check hota hai.",
            "Unauthenticated user -> /login redirect.",
            "Role mismatch -> /unauthorized redirect.",
            "Isse admin screens accidental access se protected rehti hain.",
        ]
    )

    p("5) Page-wise Deep Explain", "H1")

    p("5.1 AdminDashboard", "H2")
    bullets(
        [
            "Quick navigation cards show karta hai: Students, Users, Approvals, Departments, Reports, Logs, Teachers.",
            "Overview stats ke liye /auth/students aur /auth/admin/users hit karta hai.",
            "Framer Motion based stat cards aur nav cards use hoti hain.",
            "Admin command-center ka role play karta hai.",
        ]
    )

    p("5.2 AdminUserAccess", "H2")
    bullets(
        [
            "GET /auth/admin/users se list + filters fetch hota hai.",
            "PATCH /auth/admin/users/:id/role se role update.",
            "PATCH /auth/admin/users/:id/status se activate/deactivate.",
            "DELETE /auth/admin/users/:id se user removal.",
            "Search, filter, toast feedback aur table UX consistent hai.",
        ]
    )

    p("5.3 AdminUserApprovalPage", "H2")
    bullets(
        [
            "Pre-approval flow before signup handle karta hai.",
            "GET/POST/DELETE /auth/admin/approved-users use hota hai.",
            "Bulk CSV upload: POST /auth/admin/approved-users/bulk.",
            "CSV template download + parsing + validation + results summary frontend me built-in hai.",
        ]
    )

    p("5.4 AdminStudentDirectory", "H2")
    bullets(
        [
            "GET /auth/students se student directory load hoti hai.",
            "PATCH /auth/admin/students/:id/promote se semester promotion hota hai.",
            "Promotion se pehle confirmation modal aur uske baad refetch flow hai.",
            "Department/semester/status/search filters supported hain.",
        ]
    )

    p("5.5 AdminActivityLogs", "H2")
    bullets(
        [
            "GET /auth/admin/logs with filters + pagination use hota hai.",
            "Role/action/status/date range filters available hain.",
            "Audit table me status badges aur action labels se readability improve hoti hai.",
        ]
    )

    p("5.6 AdminTeacherManagement", "H2")
    bullets(
        [
            "Registered teachers: GET /auth/admin/users?role=faculty.",
            "Pending signups: GET /auth/admin/approved-users?role=faculty&isRegistered=false.",
            "Status toggle: PATCH /auth/admin/users/:id/status.",
            "Pending delete: DELETE /auth/admin/approved-users/:id.",
            "Direct create teacher account: POST /auth/admin/teachers.",
        ]
    )

    p("5.7 AdminSystemReports", "H2")
    bullets(
        [
            "Overview API: GET /attendance/admin/overview.",
            "Donut, trend bars, aur department-wise breakdown cards show hote hain.",
            "Failure fallback values diye gaye hain, so screen blank nahi hoti.",
        ]
    )

    p("5.8 AdminDepartments", "H2")
    bullets(
        [
            "Department, faculty, courses, timetable management ke liye heavy UI workspace hai.",
            "Modal-driven CRUD style interactions use karta hai.",
            "Tab-based deep management view deta hai (courses/faculty/timetable orientation).",
        ]
    )

    p("5.9 AdminProfile", "H2")
    bullets(
        [
            "GET /auth/me se admin profile data fetch.",
            "GET /auth/photo/:userId + POST /auth/upload-photo for profile picture flow.",
            "Profile update endpoint /auth/profile ke through editable details save hoti hain.",
            "Photo preview/editor interactions frontend me handled hain.",
        ]
    )

    p("6) Shared UX Patterns", "H1")
    bullets(
        [
            "Back-to-dashboard action across pages.",
            "Reusable class system: ap__header, ap__panel, ap__stats, ap__table-wrap, ap__table.",
            "Skeleton loading + empty state + toast notifications standardized hain.",
            "Filter-search-refresh UX almost har admin page me consistent hai.",
        ]
    )

    p("7) API Integration Pattern (Frontend)", "H1")
    bullets(
        [
            "Native fetch usage with Authorization Bearer token.",
            "JSON request/response pattern aur success flag checking common hai.",
            "Error states me safe fallbacks + user-visible feedback diya jata hai.",
        ]
    )

    p("8) End-to-End Admin Flow", "H1")
    bullets(
        [
            "Admin login -> /admin-dashboard.",
            "Dashboard se feature card click -> protected admin route open.",
            "Page load pe API fetch + render.",
            "Action (approve/update/delete/promote) -> API call -> toast -> refetch/update.",
            "Cross-module navigation se full workflow connected rehta hai.",
        ]
    )

    sp(0.2)
    p("Document End - Frontend Admin Module (Hinglish)", "Small")

    doc.build(story)


if __name__ == "__main__":
    build_pdf()
    print(OUT_PATH)
