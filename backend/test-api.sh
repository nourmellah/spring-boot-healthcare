#!/bin/bash

# ============================================================
# 🏥 Healthcare Management System - Automated API Test Suite
# ============================================================

BASE_URL="http://localhost:8080"
PASS=0
FAIL=0
ADMIN_TOKEN=""
DOCTOR_TOKEN=""
PATIENT_TOKEN=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# Helper Functions
# ============================================================

print_header() {
    echo ""
    echo -e "${BLUE}══════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}══════════════════════════════════════════${NC}"
}

assert() {
    local TEST_NAME=$1
    local EXPECTED=$2
    local ACTUAL=$3

    if echo "$ACTUAL" | grep -q "$EXPECTED"; then
        echo -e "  ${GREEN}✅ PASS${NC} - $TEST_NAME"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}❌ FAIL${NC} - $TEST_NAME"
        echo -e "     Expected to contain: ${YELLOW}$EXPECTED${NC}"
        echo -e "     Got: ${YELLOW}$(echo $ACTUAL | head -c 200)${NC}"
        FAIL=$((FAIL + 1))
    fi
}

assert_status() {
    local TEST_NAME=$1
    local EXPECTED_STATUS=$2
    local RESPONSE=$3

    STATUS=$(echo "$RESPONSE" | tail -1)
    if [ "$STATUS" = "$EXPECTED_STATUS" ]; then
        echo -e "  ${GREEN}✅ PASS${NC} - $TEST_NAME (HTTP $STATUS)"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}❌ FAIL${NC} - $TEST_NAME"
        echo -e "     Expected HTTP: ${YELLOW}$EXPECTED_STATUS${NC}, Got: ${YELLOW}$STATUS${NC}"
        FAIL=$((FAIL + 1))
    fi
}

# ============================================================
# Check server is running
# ============================================================
print_header "🔌 Checking Server Connection"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
if [ "$HEALTH" = "200" ]; then
    echo -e "  ${GREEN}✅ Server is running on $BASE_URL${NC}"
else
    echo -e "  ${RED}❌ Server is NOT running! Start it with: mvn spring-boot:run${NC}"
    exit 1
fi

# ============================================================
# 1. AUTH TESTS
# ============================================================
print_header "🔐 1. Authentication Tests"

# 1.1 Login as bootstrap admin
echo "  → Testing admin login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@hospital.com","password":"Admin@123456"}')
assert "Admin login" "token" "$LOGIN_RESPONSE"
ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

# 1.2 Wrong password
WRONG_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@hospital.com","password":"wrongpassword"}')
assert "Wrong password rejected" "Invalid email or password" "$WRONG_LOGIN"

# 1.3 Try to self-register as ADMIN (should fail)
SELF_ADMIN=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Hacker","lastName":"User","email":"hacker@test.com","password":"hack123","phone":"0000000000","role":"ADMIN"}')
assert "Cannot self-register as ADMIN" "Cannot self-assign ADMIN role" "$SELF_ADMIN"

# 1.4 Get current user
ME=$(curl -s "$BASE_URL/api/auth/me" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get current user" "admin@hospital.com" "$ME"

# ============================================================
# 2. SPECIALTY TESTS
# ============================================================
print_header "🏥 2. Specialty Tests"

# 2.1 Create specialty
SPECIALTY=$(curl -s -X POST "$BASE_URL/api/specialties" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"name":"Cardiology","description":"Heart and cardiovascular specialist"}')
assert "Create specialty" "Cardiology" "$SPECIALTY"
SPECIALTY_ID=$(echo $SPECIALTY | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "     Specialty ID: $SPECIALTY_ID"

# 2.2 Get all specialties
ALL_SPECIALTIES=$(curl -s "$BASE_URL/api/specialties" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get all specialties" "Cardiology" "$ALL_SPECIALTIES"

# 2.3 Create second specialty
SPECIALTY2=$(curl -s -X POST "$BASE_URL/api/specialties" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"name":"Neurology","description":"Brain and nervous system specialist"}')
assert "Create second specialty" "Neurology" "$SPECIALTY2"

# ============================================================
# 3. DOCTOR TESTS
# ============================================================
print_header "👨‍⚕️ 3. Doctor Tests"

# 3.1 Create doctor
DOCTOR=$(curl -s -X POST "$BASE_URL/api/doctors" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"firstName\": \"Sarah\",
        \"lastName\": \"Smith\",
        \"email\": \"dr.sarah@hospital.com\",
        \"password\": \"Doctor@123\",
        \"phone\": \"1234567890\",
        \"role\": \"DOCTOR\",
        \"licenseNumber\": \"DOC123456\",
        \"specialty\": {\"id\": $SPECIALTY_ID},
        \"yearsOfExperience\": 10,
        \"consultationFee\": 100.0,
        \"availableDays\": \"MON,TUE,WED,THU,FRI\",
        \"availableHours\": \"09:00-17:00\"
    }")
assert "Create doctor" "Sarah" "$DOCTOR"
DOCTOR_ID=$(echo $DOCTOR | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "     Doctor ID: $DOCTOR_ID"

# 3.2 Get all doctors
ALL_DOCTORS=$(curl -s "$BASE_URL/api/doctors" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get all doctors" "Sarah" "$ALL_DOCTORS"

# 3.3 Get doctor by ID
SINGLE_DOCTOR=$(curl -s "$BASE_URL/api/doctors/$DOCTOR_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get doctor by ID" "DOC123456" "$SINGLE_DOCTOR"

# 3.4 Register doctor as user (for login)
REG_DOCTOR=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Sarah","lastName":"Smith","email":"dr.sarah@hospital.com","password":"Doctor@123","phone":"1234567890","role":"DOCTOR"}')
# May already exist from /api/doctors creation, that's fine

# 3.5 Login as doctor (same email used in /api/doctors)
DOCTOR_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"dr.sarah@hospital.com","password":"Doctor@123"}')
assert "Doctor login" "token" "$DOCTOR_LOGIN"
DOCTOR_TOKEN=$(echo $DOCTOR_LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

# ============================================================
# 4. PATIENT TESTS
# ============================================================
print_header "🤒 4. Patient Tests"

# 4.1 Create patient
PATIENT=$(curl -s -X POST "$BASE_URL/api/patients" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "password": "Patient@123",
        "phone": "9876543210",
        "role": "PATIENT",
        "dateOfBirth": "1990-01-15",
        "gender": "MALE",
        "bloodGroup": "O_POSITIVE",
        "address": "123 Main Street, City",
        "emergencyContact": "0987654321",
        "emergencyContactName": "Jane Doe",
        "medicalHistory": "No known allergies"
    }')
assert "Create patient" "John" "$PATIENT"
PATIENT_ID=$(echo $PATIENT | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "     Patient ID: $PATIENT_ID"

# 4.2 Get all patients
ALL_PATIENTS=$(curl -s "$BASE_URL/api/patients" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get all patients" "John" "$ALL_PATIENTS"

# 4.3 Get patient by ID
SINGLE_PATIENT=$(curl -s "$BASE_URL/api/patients/$PATIENT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get patient by ID" "O_POSITIVE" "$SINGLE_PATIENT"

# 4.4 Register patient as user (for login) - same email as /api/patients
REG_PATIENT=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"firstName":"John","lastName":"Doe","email":"john.doe@example.com","password":"Patient@123","phone":"9876543210","role":"PATIENT"}')
# May already exist from /api/patients creation, that's fine

# 4.5 Login as patient (same email used in /api/patients)
PATIENT_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"john.doe@example.com","password":"Patient@123"}')
assert "Patient login" "token" "$PATIENT_LOGIN"
PATIENT_TOKEN=$(echo $PATIENT_LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

# 4.6 Search patients
SEARCH=$(curl -s "$BASE_URL/api/patients/search?term=John" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Search patients" "John" "$SEARCH"

# 4.7 Patient count
COUNT=$(curl -s "$BASE_URL/api/patients/count" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Patient count" "1" "$COUNT"

# ============================================================
# 5. APPOINTMENT TESTS
# ============================================================
print_header "📅 5. Appointment Tests"

# 5.1 Book appointment
APPOINTMENT=$(curl -s -X POST "$BASE_URL/api/appointments" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"patient\": {\"id\": $PATIENT_ID},
        \"doctor\": {\"id\": $DOCTOR_ID},
        \"appointmentDate\": \"2026-06-10T10:00:00\",
        \"reason\": \"Regular checkup\"
    }")
assert "Book appointment" "PENDING" "$APPOINTMENT"
APPOINTMENT_ID=$(echo $APPOINTMENT | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "     Appointment ID: $APPOINTMENT_ID"

# 5.2 Get appointment by ID
SINGLE_APPT=$(curl -s "$BASE_URL/api/appointments/$APPOINTMENT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get appointment by ID" "Regular checkup" "$SINGLE_APPT"

# 5.3 Get patient appointments
PATIENT_APPTS=$(curl -s "$BASE_URL/api/appointments/patient/$PATIENT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get patient appointments" "PENDING" "$PATIENT_APPTS"

# 5.4 Get doctor appointments
DOCTOR_APPTS=$(curl -s "$BASE_URL/api/appointments/doctor/$DOCTOR_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get doctor appointments" "PENDING" "$DOCTOR_APPTS"

# 5.5 Confirm appointment
CONFIRM=$(curl -s -X PUT "$BASE_URL/api/appointments/$APPOINTMENT_ID/status?status=CONFIRMED" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Confirm appointment" "CONFIRMED" "$CONFIRM"

# 5.6 Pending count
PENDING=$(curl -s "$BASE_URL/api/appointments/pending/count" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Pending appointments count" "0" "$PENDING"

# ============================================================
# 6. VITAL SIGNS TESTS
# ============================================================
print_header "💓 6. Vital Signs Tests"

# 6.1 Add vital sign
VITAL=$(curl -s -X POST "$BASE_URL/api/vital-signs" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"patient\": {\"id\": $PATIENT_ID},
        \"bloodPressure\": \"120/80\",
        \"heartRate\": 72,
        \"temperature\": 36.6,
        \"weight\": 70.5,
        \"height\": 175.0,
        \"oxygenSaturation\": 98,
        \"respiratoryRate\": 16,
        \"notes\": \"Normal vitals\"
    }")
assert "Add vital sign" "120/80" "$VITAL"
VITAL_ID=$(echo $VITAL | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "     Vital Sign ID: $VITAL_ID"

# 6.2 Get patient vital signs
PATIENT_VITALS=$(curl -s "$BASE_URL/api/vital-signs/patient/$PATIENT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get patient vital signs" "120/80" "$PATIENT_VITALS"

# 6.3 Get latest vital sign
LATEST_VITAL=$(curl -s "$BASE_URL/api/vital-signs/patient/$PATIENT_ID/latest" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get latest vital sign" "72" "$LATEST_VITAL"

# ============================================================
# 7. PRESCRIPTION TESTS
# ============================================================
print_header "💊 7. Prescription Tests"

# 7.1 Create prescription
PRESCRIPTION=$(curl -s -X POST "$BASE_URL/api/prescriptions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"patient\": {\"id\": $PATIENT_ID},
        \"doctor\": {\"id\": $DOCTOR_ID},
        \"diagnosis\": \"Hypertension\",
        \"notes\": \"Take medication regularly\",
        \"validUntil\": \"2026-12-31T00:00:00\"
    }")
assert "Create prescription" "Hypertension" "$PRESCRIPTION"
PRESCRIPTION_ID=$(echo $PRESCRIPTION | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "     Prescription ID: $PRESCRIPTION_ID"

# 7.2 Get prescription by ID
SINGLE_PRESC=$(curl -s "$BASE_URL/api/prescriptions/$PRESCRIPTION_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get prescription by ID" "Hypertension" "$SINGLE_PRESC"

# 7.3 Get patient prescriptions
PATIENT_PRESC=$(curl -s "$BASE_URL/api/prescriptions/patient/$PATIENT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get patient prescriptions" "Hypertension" "$PATIENT_PRESC"

# ============================================================
# 8. EMERGENCY ALERT TESTS
# ============================================================
print_header "🚨 8. Emergency Alert Tests"

# 8.1 Create emergency alert
EMERGENCY=$(curl -s -X POST "$BASE_URL/api/emergencies" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"patient\": {\"id\": $PATIENT_ID},
        \"description\": \"Severe chest pain\",
        \"severity\": \"HIGH\",
        \"location\": \"Room 101\"
    }")
assert "Create emergency alert" "HIGH" "$EMERGENCY"
EMERGENCY_ID=$(echo $EMERGENCY | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "     Emergency ID: $EMERGENCY_ID"

# 8.2 Get all emergencies
ALL_EMERGENCIES=$(curl -s "$BASE_URL/api/emergencies" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get all emergencies" "HIGH" "$ALL_EMERGENCIES"

# 8.3 Get active emergencies
ACTIVE_EMERGENCIES=$(curl -s "$BASE_URL/api/emergencies/active" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get active emergencies" "HIGH" "$ACTIVE_EMERGENCIES"

# 8.4 Assign doctor to emergency
ASSIGN=$(curl -s -X PUT "$BASE_URL/api/emergencies/$EMERGENCY_ID/assign-doctor/$DOCTOR_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Assign doctor to emergency" "$DOCTOR_ID" "$ASSIGN"

# 8.5 Resolve emergency
RESOLVE=$(curl -s -X PUT "$BASE_URL/api/emergencies/$EMERGENCY_ID/resolve?resolution=Patient+stabilized" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Resolve emergency" "RESOLVED" "$RESOLVE"

# ============================================================
# 9. ADMIN DASHBOARD TESTS
# ============================================================
print_header "👑 9. Admin Dashboard Tests"

# 9.1 Get dashboard stats
DASHBOARD=$(curl -s "$BASE_URL/api/admin/dashboard" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Admin dashboard" "totalPatients" "$DASHBOARD"

# 9.2 Get all users
ALL_USERS=$(curl -s "$BASE_URL/api/admin/users" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get all users" "ADMIN" "$ALL_USERS"

# 9.3 Get audit logs
AUDIT=$(curl -s "$BASE_URL/api/admin/audit-logs" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
assert "Get audit logs" "CREATE" "$AUDIT"

# ============================================================
# 10. ROLE-BASED ACCESS CONTROL TESTS
# ============================================================
print_header "🔒 10. Role-Based Access Control Tests"

# Debug: show token status
if [ -z "$PATIENT_TOKEN" ]; then
    echo -e "  ${RED}⚠️  PATIENT_TOKEN is empty - patient login failed earlier${NC}"
else
    echo -e "  ${GREEN}✅ PATIENT_TOKEN is set${NC}"
fi

if [ -z "$DOCTOR_TOKEN" ]; then
    echo -e "  ${RED}⚠️  DOCTOR_TOKEN is empty - doctor login failed earlier${NC}"
else
    echo -e "  ${GREEN}✅ DOCTOR_TOKEN is set${NC}"
fi

# Re-login to make sure we have fresh tokens
echo "  → Re-logging in as doctor..."
DOCTOR_LOGIN2=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"dr.sarah@hospital.com","password":"Doctor@123"}')
echo $DOCTOR_LOGIN2 | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" > /tmp/doctor_token.txt 2>/dev/null
DOCTOR_TOKEN=$(cat /tmp/doctor_token.txt)
if [ -n "$DOCTOR_TOKEN" ]; then
    echo -e "  ${GREEN}✅ Doctor token refreshed${NC}"
else
    echo -e "  ${RED}❌ Doctor re-login failed${NC}"
fi

echo "  → Re-logging in as patient..."
PATIENT_LOGIN2=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"john.doe@example.com","password":"Patient@123"}')
echo $PATIENT_LOGIN2 | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" > /tmp/patient_token.txt 2>/dev/null
PATIENT_TOKEN=$(cat /tmp/patient_token.txt)
if [ -n "$PATIENT_TOKEN" ]; then
    echo -e "  ${GREEN}✅ Patient token refreshed${NC}"
else
    echo -e "  ${RED}❌ Patient re-login failed${NC}"
fi

# 10.1 Patient cannot view all patients
PATIENT_ALL=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/patients" \
    -H "Authorization: Bearer $(cat /tmp/patient_token.txt)")
if [ "$PATIENT_ALL" = "403" ]; then
    echo -e "  ${GREEN}✅ PASS${NC} - Patient cannot view all patients (403)"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}❌ FAIL${NC} - Patient should get 403, got $PATIENT_ALL"
    FAIL=$((FAIL + 1))
fi

# 10.2 Patient cannot access admin dashboard
PATIENT_ADMIN_BODY=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/admin/dashboard" \
    -H "Authorization: Bearer $(cat /tmp/patient_token.txt)")
PATIENT_ADMIN=$(echo "$PATIENT_ADMIN_BODY" | tail -1)
if [ "$PATIENT_ADMIN" = "403" ]; then
    echo -e "  ${GREEN}✅ PASS${NC} - Patient cannot access admin dashboard (403)"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}❌ FAIL${NC} - Patient should get 403, got $PATIENT_ADMIN"
    FAIL=$((FAIL + 1))
fi

# 10.3 Doctor cannot access admin dashboard
DOCTOR_ADMIN_BODY=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/admin/dashboard" \
    -H "Authorization: Bearer $(cat /tmp/doctor_token.txt)")
DOCTOR_ADMIN=$(echo "$DOCTOR_ADMIN_BODY" | tail -1)
if [ "$DOCTOR_ADMIN" = "403" ]; then
    echo -e "  ${GREEN}✅ PASS${NC} - Doctor cannot access admin dashboard (403)"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}❌ FAIL${NC} - Doctor should get 403, got $DOCTOR_ADMIN"
    FAIL=$((FAIL + 1))
fi

# 10.4 Unauthenticated request blocked
UNAUTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/patients")
if [ "$UNAUTH" = "401" ]; then
    echo -e "  ${GREEN}✅ PASS${NC} - Unauthenticated request blocked (401)"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}❌ FAIL${NC} - Unauthenticated should get 401, got $UNAUTH"
    FAIL=$((FAIL + 1))
fi

# 10.5 Doctor can view all patients
DOCTOR_PATIENTS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/patients" \
    -H "Authorization: Bearer $(cat /tmp/doctor_token.txt)")
if [ "$DOCTOR_PATIENTS" = "200" ]; then
    echo -e "  ${GREEN}✅ PASS${NC} - Doctor can view all patients (200)"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}❌ FAIL${NC} - Doctor should get 200, got $DOCTOR_PATIENTS"
    FAIL=$((FAIL + 1))
fi

# 10.6 Patient can view own appointments
PATIENT_OWN_APPTS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/appointments/patient/$PATIENT_ID" \
    -H "Authorization: Bearer $(cat /tmp/patient_token.txt)")
if [ "$PATIENT_OWN_APPTS" = "200" ]; then
    echo -e "  ${GREEN}✅ PASS${NC} - Patient can view own appointments (200)"
    PASS=$((PASS + 1))
else
    echo -e "  ${RED}❌ FAIL${NC} - Patient should get 200 for own appointments, got $PATIENT_OWN_APPTS"
    FAIL=$((FAIL + 1))
fi

# Cleanup temp files
rm -f /tmp/doctor_token.txt /tmp/patient_token.txt

# ============================================================
# FINAL RESULTS
# ============================================================
echo ""
echo -e "${BLUE}══════════════════════════════════════════${NC}"
echo -e "${BLUE}  📊 TEST RESULTS${NC}"
echo -e "${BLUE}══════════════════════════════════════════${NC}"
TOTAL=$((PASS + FAIL))
echo -e "  Total Tests : $TOTAL"
echo -e "  ${GREEN}Passed      : $PASS${NC}"
echo -e "  ${RED}Failed      : $FAIL${NC}"
echo ""
if [ $FAIL -eq 0 ]; then
    echo -e "  ${GREEN}🎉 ALL TESTS PASSED!${NC}"
else
    echo -e "  ${YELLOW}⚠️  $FAIL test(s) failed. Check the output above.${NC}"
fi
echo -e "${BLUE}══════════════════════════════════════════${NC}"
echo ""
