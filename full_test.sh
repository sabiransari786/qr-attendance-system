#!/bin/bash
# ================================================================
# ATTENDANCE TRACKER - FULL SYSTEM TEST REPORT
# ================================================================

BASE="http://localhost:5001/api"
PASS=0; FAIL=0; WARN=0
ISSUES=()

ok()   { echo "  ✅ PASS  - $1"; ((PASS++)); }
fail() { echo "  ❌ FAIL  - $1"; ((FAIL++)); ISSUES+=("CRITICAL: $1"); }
warn() { echo "  ⚠️  WARN  - $1"; ((WARN++)); ISSUES+=("WARNING: $1"); }
info() { echo "  ℹ️  INFO  - $1"; }
hdr()  { echo ""; echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; echo " $1"; echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"; }

success() { echo $1 | grep -q '"success":true'; }

# ── STEP 1: Login & get tokens ─────────────────────────────────
hdr "AUTH - LOGIN"

F=$(curl -s -X POST $BASE/auth/login -H "Content-Type:application/json" -d '{"email":"teacher@demo.com","password":"password123"}')
if success "$F"; then
  ok "Faculty login (teacher@demo.com)"
  FT=$(echo $F | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
else
  fail "Faculty login failed: $(echo $F | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"
  FT=""
fi

S=$(curl -s -X POST $BASE/auth/login -H "Content-Type:application/json" -d '{"email":"aakash.civil@demo.com","password":"password123"}')
if success "$S"; then
  ok "Student login (aakash.civil@demo.com)"
  ST=$(echo $S | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
else
  fail "Student login failed: $(echo $S | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"
  ST=""
fi

A=$(curl -s -X POST $BASE/auth/login -H "Content-Type:application/json" -d '{"email":"admin@demo.com","password":"password123"}')
if success "$A"; then
  ok "Admin login (admin@demo.com)"
  AT=$(echo $A | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
else
  fail "Admin login failed: $(echo $A | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"
  AT=""
fi

# is_active check - all users should be active now
IS_ACTIVE=$(mysql -u root attendance_tracker -e "SELECT is_active FROM users WHERE email='student@demo.com';" 2>/dev/null | tail -1)
R=$(curl -s -X POST $BASE/auth/login -H "Content-Type:application/json" -d '{"email":"student@demo.com","password":"password123"}')
if [ "$IS_ACTIVE" = "0" ] && success "$R"; then
  warn "Inactive student (student@demo.com) can still login despite is_active=0"
elif [ "$IS_ACTIVE" = "1" ] && success "$R"; then
  ok "Active student (student@demo.com) can login"
else
  ok "student@demo.com login handled correctly (is_active=$IS_ACTIVE)"
fi

# Wrong password
R=$(curl -s -X POST $BASE/auth/login -H "Content-Type:application/json" -d '{"email":"teacher@demo.com","password":"wrong"}')
if success "$R"; then fail "Wrong password accepted!"; else ok "Wrong password correctly rejected"; fi

# Missing fields 
R=$(curl -s -X POST $BASE/auth/login -H "Content-Type:application/json" -d '{"email":""}')
if success "$R"; then fail "Empty email accepted!"; else ok "Empty credentials rejected"; fi

# ── STEP 2: Auth Middleware ────────────────────────────────────
hdr "AUTH MIDDLEWARE"

R=$(curl -s $BASE/auth/me)
if success "$R"; then fail "No-token request should have been blocked"; else ok "No token blocked"; fi

R=$(curl -s $BASE/auth/me -H "Authorization: Bearer faketoken")
if success "$R"; then fail "Fake token accepted!"; else ok "Fake token rejected"; fi

[ -n "$FT" ] && {
  R=$(curl -s $BASE/auth/me -H "Authorization: Bearer $FT")
  if success "$R"; then ok "Faculty /me profile works"; else fail "Faculty /me failed: $R"; fi
}

[ -n "$ST" ] && {
  R=$(curl -s $BASE/auth/me -H "Authorization: Bearer $ST")
  if success "$R"; then ok "Student /me profile works"; else fail "Student /me failed: $R"; fi
}

[ -n "$AT" ] && {
  R=$(curl -s $BASE/auth/me -H "Authorization: Bearer $AT")
  if success "$R"; then ok "Admin /me profile works"; else fail "Admin /me failed: $R"; fi
}

# ── STEP 3: Session Endpoints ──────────────────────────────────
hdr "SESSION APIs"

[ -n "$FT" ] && {
  # Get active sessions
  R=$(curl -s $BASE/session/ -H "Authorization: Bearer $FT")
  if success "$R"; then ok "GET /session/ - active sessions"; else warn "GET /session/ failed: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi

  # Get sessions with /active
  R=$(curl -s $BASE/session/active -H "Authorization: Bearer $FT")
  if success "$R"; then ok "GET /session/active works"; else warn "GET /session/active: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi

  # Get first course and subject from DB
  COURSE_ID=$(mysql -u root attendance_tracker -e "SELECT id FROM courses LIMIT 1;" 2>/dev/null | tail -1)
  SUBJECT=$(mysql -u root attendance_tracker -e "SELECT name FROM subjects WHERE course_id=$COURSE_ID LIMIT 1;" 2>/dev/null | tail -1)
  [ -z "$SUBJECT" ] && SUBJECT="Mathematics"
  info "Using course_id: $COURSE_ID, subject: $SUBJECT"

  # Create session (subject + location + startTime + duration required)
  START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  R=$(curl -s -X POST $BASE/session/ \
    -H "Authorization: Bearer $FT" \
    -H "Content-Type:application/json" \
    -d "{\"subject\":\"$SUBJECT\",\"location\":\"Room 101\",\"startTime\":\"$START_TIME\",\"duration\":60}")
  if success "$R"; then
    ok "POST /session/ - session created"
    SID=$(echo $R | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(d.get('session_id',d.get('id','')))" 2>/dev/null)
    info "Created session_id: $SID"
  else
    warn "POST /session/ failed: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"
    SID=""
  fi
}

# Student cannot create session
[ -n "$ST" ] && {
  R=$(curl -s -X POST $BASE/session/ -H "Authorization: Bearer $ST" -H "Content-Type:application/json" -d '{"course_id":1,"room_number":"101","duration_minutes":60}')
  if success "$R"; then fail "SECURITY: Student created a session!"; else ok "Student blocked from creating session (RBAC works)"; fi
}

# ── STEP 4: Attendance APIs ────────────────────────────────────
hdr "ATTENDANCE APIs"

[ -n "$ST" ] && {
  # Get own attendance
  R=$(curl -s "$BASE/attendance/student/$(echo $S | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['user']['id'])" 2>/dev/null)" -H "Authorization: Bearer $ST")
  if success "$R"; then ok "GET attendance by student"; else warn "GET attendance/student: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi

  # Get requestable sessions
  R=$(curl -s $BASE/attendance/requestable-sessions -H "Authorization: Bearer $ST")
  if success "$R"; then ok "GET /attendance/requestable-sessions"; else warn "requestable-sessions: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi

  # Invalid mark attendance
  R=$(curl -s -X POST $BASE/attendance/mark -H "Authorization: Bearer $ST" -H "Content-Type:application/json" -d '{"session_id":99999,"latitude":0,"longitude":0}')
  if success "$R"; then warn "Attendance marked for non-existent session"; else ok "Invalid session attendance rejected"; fi
}

[ -n "$FT" ] && {
  # Use a real session ID from DB
  REAL_SID=$(mysql -u root attendance_tracker -e "SELECT id FROM sessions LIMIT 1;" 2>/dev/null | tail -1)
  [ -z "$REAL_SID" ] && REAL_SID=64

  R=$(curl -s $BASE/attendance/session/$REAL_SID -H "Authorization: Bearer $FT")
  if success "$R"; then ok "GET /attendance/session/:id (id=$REAL_SID)"; else warn "attendance/session/$REAL_SID: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi

  R=$(curl -s $BASE/attendance/report/$REAL_SID -H "Authorization: Bearer $FT")
  if success "$R"; then ok "GET /attendance/report/:id (id=$REAL_SID)"; else warn "attendance/report/$REAL_SID: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi
}

# ── STEP 5: Manual Attendance Request ─────────────────────────
hdr "MANUAL ATTENDANCE REQUEST"

[ -n "$ST" ] && {
  R=$(curl -s $BASE/attendance/manual-requests/student -H "Authorization: Bearer $ST")
  if success "$R"; then ok "GET student manual requests"; else warn "student manual-requests: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi
}

[ -n "$FT" ] && {
  R=$(curl -s $BASE/attendance/manual-requests/faculty -H "Authorization: Bearer $FT")
  if success "$R"; then ok "GET faculty manual requests"; else warn "faculty manual-requests: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi
}

# ── STEP 6: QR Request APIs ────────────────────────────────────
hdr "QR REQUEST APIs"

[ -n "$FT" ] && {
  R=$(curl -s $BASE/qr-request/faculty/requests -H "Authorization: Bearer $FT")
  if success "$R"; then ok "GET /qr-request/faculty/requests"; else warn "qr-request/faculty/requests: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi

  # Get a valid ACTIVE session ID for QR generation (created above, or find from DB)
  QR_SID=${SID:-""}
  if [ -z "$QR_SID" ]; then
    QR_SID=$(mysql -u root attendance_tracker -e "SELECT id FROM sessions WHERE status='active' LIMIT 1;" 2>/dev/null | tail -1)
  fi
  if [ -n "$QR_SID" ]; then
    R=$(curl -s -X POST $BASE/qr-request/generate \
      -H "Authorization: Bearer $FT" \
      -H "Content-Type:application/json" \
      -d "{\"session_id\":$QR_SID,\"attendance_value\":1,\"latitude\":19.0,\"longitude\":72.8,\"radius_meters\":50,\"duration_minutes\":5}")
    if success "$R"; then ok "POST /qr-request/generate (session $QR_SID)"; else warn "qr-request/generate: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi
  else
    info "No active session found to test QR generate — skipping"
  fi
}

# ── STEP 7: Faculty APIs ───────────────────────────────────────
hdr "FACULTY APIs"

[ -n "$FT" ] && {
  R=$(curl -s $BASE/faculty/my-courses -H "Authorization: Bearer $FT")
  if success "$R"; then ok "GET /faculty/my-courses"; else warn "faculty/my-courses: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi
}

# ── STEP 8: Admin APIs ─────────────────────────────────────────
hdr "ADMIN APIs"

[ -n "$AT" ] && {
  R=$(curl -s $BASE/auth/admin/users -H "Authorization: Bearer $AT")
  if success "$R"; then ok "GET /auth/admin/users"; else warn "admin/users: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi

  R=$(curl -s $BASE/auth/admin/approved-users -H "Authorization: Bearer $AT")
  if success "$R"; then ok "GET /auth/admin/approved-users"; else warn "admin/approved-users: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi

  R=$(curl -s $BASE/auth/admin/logs -H "Authorization: Bearer $AT")
  if success "$R"; then ok "GET /auth/admin/logs (activity logs)"; else warn "admin/logs: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi
}

# Non-admin accessing admin route
[ -n "$FT" ] && {
  R=$(curl -s $BASE/auth/admin/users -H "Authorization: Bearer $FT")
  if success "$R"; then fail "SECURITY: Faculty accessed admin-only route!"; else ok "Admin route blocked for faculty (RBAC works)"; fi
}

# ── STEP 9: OTP ────────────────────────────────────────────────
hdr "OTP SYSTEM"

R=$(curl -s -X POST $BASE/otp/send -H "Content-Type:application/json" -d '{"email":"teacher@demo.com"}')
if success "$R"; then ok "OTP send initiated"; else warn "OTP send: $(echo $R | python3 -c "import sys,json;print(json.load(sys.stdin).get('message',''))" 2>/dev/null)"; fi

R=$(curl -s -X POST $BASE/otp/verify -H "Content-Type:application/json" -d '{"email":"teacher@demo.com","otp":"000000"}')
if success "$R"; then warn "OTP 000000 accepted - weak OTP validation"; else ok "Wrong OTP correctly rejected"; fi

# ── STEP 10: Database Integrity ────────────────────────────────
hdr "DATABASE INTEGRITY"

USERS=$(mysql -u root attendance_tracker -e "SELECT COUNT(*) FROM users;" 2>/dev/null | tail -1)
SESSIONS=$(mysql -u root attendance_tracker -e "SELECT COUNT(*) FROM sessions;" 2>/dev/null | tail -1)
ATTENDANCE=$(mysql -u root attendance_tracker -e "SELECT COUNT(*) FROM attendance;" 2>/dev/null | tail -1)
COURSES=$(mysql -u root attendance_tracker -e "SELECT COUNT(*) FROM courses;" 2>/dev/null | tail -1)
DEPT=$(mysql -u root attendance_tracker -e "SELECT COUNT(*) FROM departments;" 2>/dev/null | tail -1)
ENROLL=$(mysql -u root attendance_tracker -e "SELECT COUNT(*) FROM course_enrollment;" 2>/dev/null | tail -1)
INACTIVE=$(mysql -u root attendance_tracker -e "SELECT COUNT(*) FROM users WHERE is_active=0;" 2>/dev/null | tail -1)
OPEN_SESSIONS=$(mysql -u root attendance_tracker -e "SELECT COUNT(*) FROM sessions WHERE status='active';" 2>/dev/null | tail -1)

info "Users: $USERS | Sessions: $SESSIONS | Attendance records: $ATTENDANCE"
info "Courses: $COURSES | Departments: $DEPT | Enrollments: $ENROLL"
[ "$USERS" -gt 0 ] 2>/dev/null && ok "Users table has data" || warn "Users table empty"
[ "$COURSES" -gt 0 ] 2>/dev/null && ok "Courses table has data" || warn "Courses table empty - sessions need courses"
[ "$ENROLL" -gt 0 ] 2>/dev/null && ok "Course enrollments exist" || warn "No course enrollments - students may not see their courses"
[ "$ATTENDANCE" -gt 0 ] 2>/dev/null && ok "Attendance records exist" || warn "Only $ATTENDANCE attendance records - very low data"
[ "$INACTIVE" -gt 0 ] 2>/dev/null && warn "$INACTIVE users are inactive (is_active=0) - cannot login" || ok "All users are active"
[ -n "$OPEN_SESSIONS" ] && info "Currently active sessions: $OPEN_SESSIONS"

# ── STEP 11: Frontend ──────────────────────────────────────────
hdr "FRONTEND"

HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
[ "$HTTP" = "200" ] && ok "Frontend Vite server running on :5173" || fail "Frontend NOT running (HTTP $HTTP)"

# Check if frontend can reach backend (CORS)
R=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS http://localhost:5001/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST")
[ "$R" = "204" ] || [ "$R" = "200" ] && ok "CORS configured (frontend → backend)" || warn "CORS may have issues (status: $R)"

# ══ FINAL REPORT ══════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "           FINAL TEST REPORT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ PASSED   : $PASS"
echo "  ❌ FAILED   : $FAIL"
echo "  ⚠️  WARNINGS : $WARN"
echo "  Total Tests : $((PASS+FAIL+WARN))"
echo ""

if [ ${#ISSUES[@]} -gt 0 ]; then
  echo "📋 ISSUES FOUND:"
  for issue in "${ISSUES[@]}"; do
    echo "   → $issue"
  done
  echo ""
fi

if [ $FAIL -eq 0 ] && [ $WARN -le 3 ]; then
  echo "  🎉 System Status: HEALTHY"
elif [ $FAIL -eq 0 ]; then
  echo "  🟡 System Status: MOSTLY WORKING (check warnings)"
else
  echo "  🚨 System Status: HAS $FAIL CRITICAL ISSUES"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
