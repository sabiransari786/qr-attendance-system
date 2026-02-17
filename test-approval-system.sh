#!/bin/bash

# ============================================================================
# USER APPROVAL SYSTEM - API TESTING SCRIPT
# ============================================================================
# 
# यह script admin approval system को test करने के लिए है
# पहले एक admin account से login करके token generate करना होगा
# 

# Configuration
API_URL="http://localhost:3000/api"
ADMIN_EMAIL="admin@demo.com"
ADMIN_PASSWORD="admin123"

echo "🔐 Step 1: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

echo "Login Response: $LOGIN_RESPONSE"

# Extract token from response (adjust based on your response format)
ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token. Login response:"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Admin token: ${ADMIN_TOKEN:0:20}..."

# ============================================================================
# Test 1: Add Approved Student
# ============================================================================
echo -e "\n\n📝 Step 2: Adding approved student..."
STUDENT_RESPONSE=$(curl -s -X POST "$API_URL/auth/admin/approved-users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rajesh Kumar",
    "email": "rajesh@example.com",
    "contactNumber": "9876543210",
    "role": "student",
    "studentId": "STU001",
    "department": "B.Tech Computer Science",
    "semester": 4,
    "section": "A"
  }')

echo "Student Addition Response:"
echo $STUDENT_RESPONSE | jq '.' 2>/dev/null || echo $STUDENT_RESPONSE

# ============================================================================
# Test 2: Add Approved Faculty
# ============================================================================
echo -e "\n\n📝 Step 3: Adding approved faculty..."
FACULTY_RESPONSE=$(curl -s -X POST "$API_URL/auth/admin/approved-users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Sharma",
    "email": "sharma@example.com",
    "contactNumber": "9876543211",
    "role": "faculty",
    "teacherId": "TEACH001",
    "department": "Computer Science"
  }')

echo "Faculty Addition Response:"
echo $FACULTY_RESPONSE | jq '.' 2>/dev/null || echo $FACULTY_RESPONSE

# ============================================================================
# Test 3: List All Approved Users
# ============================================================================
echo -e "\n\n📋 Step 4: Listing all approved users..."
LIST_RESPONSE=$(curl -s -X GET "$API_URL/auth/admin/approved-users" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Approved Users List:"
echo $LIST_RESPONSE | jq '.' 2>/dev/null || echo $LIST_RESPONSE

# ============================================================================
# Test 4: List Only Students
# ============================================================================
echo -e "\n\n📋 Step 5: Listing approved students only..."
STUDENTS_RESPONSE=$(curl -s -X GET "$API_URL/auth/admin/approved-users?role=student" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "Approved Students:"
echo $STUDENTS_RESPONSE | jq '.' 2>/dev/null || echo $STUDENTS_RESPONSE

# ============================================================================
# Test 5: User Registration (Should Success)
# ============================================================================
echo -e "\n\n✍️  Step 6: Testing user registration (should succeed)..."
REGISTER_SUCCESS=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rajesh Kumar",
    "email": "rajesh@example.com",
    "contactNumber": "9876543210",
    "password": "password123",
    "role": "student",
    "studentId": "STU001"
  }')

echo "Registration Success Response:"
echo $REGISTER_SUCCESS | jq '.' 2>/dev/null || echo $REGISTER_SUCCESS

# ============================================================================
# Test 6: User Registration (Should Fail - Wrong Contact)
# ============================================================================
echo -e "\n\n✍️  Step 7: Testing user registration with wrong contact (should fail)..."
REGISTER_FAIL=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rajesh Kumar",
    "email": "rajesh@example.com",
    "contactNumber": "9999999999",
    "password": "password123",
    "role": "student",
    "studentId": "STU001"
  }')

echo "Registration Failure Response (Wrong Contact):"
echo $REGISTER_FAIL | jq '.' 2>/dev/null || echo $REGISTER_FAIL

# ============================================================================
# Test 7: User Registration (Should Fail - Not Approved)
# ============================================================================
echo -e "\n\n✍️  Step 8: Testing user registration without approval (should fail)..."
REGISTER_UNAPPROVED=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "contactNumber": "9999888888",
    "password": "password123",
    "role": "student",
    "studentId": "STU999"
  }')

echo "Registration Failure Response (Not Approved):"
echo $REGISTER_UNAPPROVED | jq '.' 2>/dev/null || echo $REGISTER_UNAPPROVED

# ============================================================================
# Test 8: Delete Approved User
# ============================================================================
echo -e "\n\n🗑️  Step 9: Finding approved user ID to delete..."

# Get the list and extract first student's ID
APPROVED_LIST=$(curl -s -X GET "$API_URL/auth/admin/approved-users?role=student" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

# Extract ID (assuming jq is available)
APPROVED_ID=$(echo $APPROVED_LIST | jq -r '.data[0].id' 2>/dev/null)

if [ ! -z "$APPROVED_ID" ] && [ "$APPROVED_ID" != "null" ]; then
  echo "Deleting approved user with ID: $APPROVED_ID"
  
  DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/auth/admin/approved-users/$APPROVED_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  
  echo "Delete Response:"
  echo $DELETE_RESPONSE | jq '.' 2>/dev/null || echo $DELETE_RESPONSE
else
  echo "⚠️  Could not find approved user ID to delete"
fi

echo -e "\n\n✅ Testing completed!"
