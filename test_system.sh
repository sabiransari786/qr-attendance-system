#!/bin/bash

BASE="http://localhost:5001/api"
PASS=0
FAIL=0
WARN=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✅ PASS${NC} - $1"; ((PASS++)); }
fail() { echo -e "  ${RED}❌ FAIL${NC} - $1"; ((FAIL++)); }
warn() { echo -e "  ${YELLOW}⚠️  WARN${NC} - $1"; ((WARN++)); }
head() { echo -e "\n${BLUE}══════════════════════════════════════${NC}"; echo -e "${BLUE} $1${NC}"; echo -e "${BLUE}══════════════════════════════════════${NC}"; }

# ── 1. HEALTH CHECK ──────────────────────────────────────
head "1. HEALTH CHECK"
R=$(curl -s $BASE/health)
if echo $R | grep -q '"success":true'; then ok "Server is running"; else fail "Server not responding"; fi

# ── 2. AUTH ──────────────────────────────────────────────
head "2. AUTH TESTS"

# Wrong credentials
R=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":"wrong@test.com","password":"wrong"}')
if echo $R | grep -q '"success":false'; then ok "Wrong credentials rejected"; else fail "Wrong credentials NOT rejected"; fi

# Missing fields
R=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":""}')
if echo $R | grep -q '"success":false'; then ok "Empty fields rejected"; else fail "Empty fields NOT rejected"; fi

# Faculty login
R=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":"teacher@demo.com","password":"password123"}')
if echo $R | grep -q '"success":true'; then
  ok "Faculty login successful"
  FACULTY_TOKEN=$(echo $R | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
else
  fail "Faculty login FAILED"
  FACULTY_TOKEN=""
fi

# Student login
R=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":"student@demo.com","password":"password123"}')
if echo $R | grep -q '"success":true'; then
  ok "Student login successful"
  STU_TOKEN=$(echo $R | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
else
  fail "Student login FAILED"
  STU_TOKEN=""
fi

# Admin login
R=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":"admin@demo.com","password":"password123"}')
if echo $R | grep -q '"success":true'; then
  ok "Admin login successful"
  ADMIN_TOKEN=$(echo $R | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
else
  fail "Admin login FAILED"
  ADMIN_TOKEN=""
fi

# ── 3. PROFILE / AUTH MIDDLEWARE ─────────────────────────
head "3. AUTH MIDDLEWARE & PROFILE"

# No token
R=$(curl -s $BASE/auth/profile)
if echo $R | grep -q '"success":false'; then ok "Unauthenticated request blocked"; else fail "Unauthenticated request NOT blocked"; fi

# Invalid token
R=$(curl -s $BASE/auth/profile -H "Authorization: Bearer invalidtoken123")
if echo $R | grep -q '"success":false'; then ok "Invalid token rejected"; else fail "Invalid token NOT rejected"; fi

# Valid faculty token
if [ -n "$FACULTY_TOKEN" ]; then
  R=$(curl -s $BASE/auth/profile -H "Authorization: Bearer $FACULTY_TOKEN")
  if echo $R | grep -q '"success":true'; then ok "Faculty profile fetched"; else fail "Faculty profile fetch FAILED: $R"; fi
fi

# Valid student token
if [ -n "$STU_TOKEN" ]; then
  R=$(curl -s $BASE/auth/profile -H "Authorization: Bearer $STU_TOKEN")
  if echo $R | grep -q '"success":true'; then ok "Student profile fetched"; else fail "Student profile fetch FAILED: $R"; fi
fi

# ── 4. SESSION ENDPOINTS ─────────────────────────────────
head "4. SESSION TESTS"

# Get active sessions (faculty)
if [ -n "$FACULTY_TOKEN" ]; then
  R=$(curl -s $BASE/sessions/active -H "Authorization: Bearer $FACULTY_TOKEN")
  if echo $R | grep -q '"success":true'; then ok "Get active sessions - faculty"; else warn "Get active sessions failed: $R"; fi

  # Create session
  R=$(curl -s -X POST $BASE/sessions/create \
    -H "Authorization: Bearer $FACULTY_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"subject_id":1,"room_number":"101","duration_minutes":60}')
  if echo $R | grep -q '"success":true'; then
    ok "Session created successfully"
    SESSION_ID=$(echo $R | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'].get('session_id', d['data'].get('id','')))" 2>/dev/null)
    echo "     Session ID: $SESSION_ID"
  else
    warn "Session creation failed: $(echo $R | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"
    SESSION_ID=""
  fi
fi

# Student trying to create session (should fail)
if [ -n "$STU_TOKEN" ]; then
  R=$(curl -s -X POST $BASE/sessions/create \
    -H "Authorization: Bearer $STU_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"subject_id":1,"room_number":"101","duration_minutes":60}')
  if echo $R | grep -q '"success":false'; then ok "Student blocked from creating session"; else fail "Student should NOT be able to create session"; fi
fi

# ── 5. ATTENDANCE ENDPOINTS ──────────────────────────────
head "5. ATTENDANCE TESTS"

if [ -n "$STU_TOKEN" ]; then
  # Get own attendance
  R=$(curl -s $BASE/attendance/student \
    -H "Authorization: Bearer $STU_TOKEN")
  if echo $R | grep -q '"success":true'; then ok "Student attendance fetch"; else warn "Student attendance fetch: $(echo $R | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi

  # Mark attendance without session (should fail gracefully)
  R=$(curl -s -X POST $BASE/attendance/mark \
    -H "Authorization: Bearer $STU_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"session_id":99999,"qr_code":"fake_qr"}')
  if echo $R | grep -q '"success":false'; then ok "Invalid attendance mark rejected"; else warn "Invalid attendance mark not rejected: $R"; fi
fi

if [ -n "$FACULTY_TOKEN" ]; then
  R=$(curl -s $BASE/attendance/session/1 \
    -H "Authorization: Bearer $FACULTY_TOKEN")
  if echo $R | grep -q '"success":true'; then ok "Faculty session attendance fetch"; else warn "Faculty session attendance: $(echo $R | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi
fi

# ── 6. ROLE PROTECTION ───────────────────────────────────
head "6. ROLE-BASED ACCESS CONTROL"

# Student trying to access faculty route
if [ -n "$STU_TOKEN" ]; then
  R=$(curl -s $BASE/sessions/create \
    -H "Authorization: Bearer $STU_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"subject_id":1}')
  if echo $R | grep -q '"success":false'; then ok "Faculty-only route blocked for student"; else fail "Faculty route accessible by student!"; fi
fi

# ── 7. QR REQUEST ENDPOINTS ──────────────────────────────
head "7. QR REQUEST TESTS"

if [ -n "$STU_TOKEN" ]; then
  R=$(curl -s $BASE/qr-requests \
    -H "Authorization: Bearer $STU_TOKEN")
  if echo $R | grep -q '"success":true'; then ok "QR requests list fetch"; else warn "QR requests: $(echo $R | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi
fi

# ── 8. FACULTY ROUTES ────────────────────────────────────
head "8. FACULTY SPECIFIC TESTS"

if [ -n "$FACULTY_TOKEN" ]; then
  R=$(curl -s $BASE/faculty/sessions \
    -H "Authorization: Bearer $FACULTY_TOKEN")
  if echo $R | grep -q '"success":true'; then ok "Faculty sessions list"; else warn "Faculty sessions: $(echo $R | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi

  R=$(curl -s $BASE/faculty/subjects \
    -H "Authorization: Bearer $FACULTY_TOKEN")
  if echo $R | grep -q '"success":true'; then ok "Faculty subjects list"; else warn "Faculty subjects: $(echo $R | python3 -c "import sys,json; print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi
fi

# ── 9. DATABASE CHECK ────────────────────────────────────
head "9. DATABASE INTEGRITY CHECK"

DB_USERS=$(mysql -u root attendance_tracker -e "SELECT COUNT(*) FROM users;" 2>/dev/null | tail -1)
DB_SESSIONS=$(mysql -u root attendance_tracker -e "SELECT COUNT(*) FROM sessions;" 2>/dev/null | tail -1)
DB_ATTENDANCE=$(mysql -u root attendance_tracker -e "SELECT COUNT(*) FROM attendance;" 2>/dev/null | tail -1)
DB_SUBJECTS=$(mysql -u root attendance_tracker -e "SELECT COUNT(*) FROM subjects;" 2>/dev/null | tail -1)

[ -n "$DB_USERS" ] && ok "Users table: $DB_USERS records" || warn "Could not read users table"
[ -n "$DB_SESSIONS" ] && ok "Sessions table: $DB_SESSIONS records" || warn "Could not read sessions table"
[ -n "$DB_ATTENDANCE" ] && ok "Attendance table: $DB_ATTENDANCE records" || warn "Could not read attendance table"
[ -n "$DB_SUBJECTS" ] && ok "Subjects table: $DB_SUBJECTS records" || warn "Could not read subjects table"

# ── 10. FRONTEND BUILD CHECK ─────────────────────────────
head "10. FRONTEND CHECK"

# Check if frontend dev server is running
R=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
if [ "$R" = "200" ]; then ok "Frontend (Vite) is running on :5173"; else fail "Frontend NOT running on :5173 (status: $R)"; fi

# ── SUMMARY ──────────────────────────────────────────────
echo ""
echo -e "${BLUE}══════════════════════════════════════${NC}"
echo -e "${BLUE}          TEST SUMMARY REPORT          ${NC}"
echo -e "${BLUE}══════════════════════════════════════${NC}"
echo -e "  ${GREEN}✅ PASSED : $PASS${NC}"
echo -e "  ${RED}❌ FAILED : $FAIL${NC}"
echo -e "  ${YELLOW}⚠️  WARNINGS: $WARN${NC}"
echo ""
TOTAL=$((PASS+FAIL+WARN))
echo "  Total Tests: $TOTAL"
if [ $FAIL -eq 0 ]; then
  echo -e "  ${GREEN}🎉 System overall: HEALTHY${NC}"
else
  echo -e "  ${RED}🚨 System has $FAIL critical issues!${NC}"
fi
echo ""
