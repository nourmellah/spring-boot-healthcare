# 🔐 Bootstrap Admin Security Guide

## 🎯 Overview

The system implements a **secure bootstrap mechanism** that creates the first admin user automatically on startup. This prevents unauthorized users from self-assigning admin privileges.

---

## 🛡️ Security Features

### ✅ What's Protected:

1. **No Self-Assignment of Admin Role**
   - Regular users CANNOT register as ADMIN through `/api/auth/register`
   - Attempting to register with `"role": "ADMIN"` returns `403 Forbidden`

2. **Bootstrap Admin Created on First Startup**
   - System automatically creates first admin on startup
   - Only created if no admin exists in database
   - Credentials configured in `application.properties`

3. **Only Admins Can Create Admins**
   - New admin users can only be created by existing admins
   - Via protected endpoint: `POST /api/admin/create-admin`
   - Requires valid admin JWT token

---

## 🚀 How It Works

### First Startup:

```
1. Application starts
2. DataBootstrap checks if admin exists
3. If NO admin found:
   ├─ Creates admin from application.properties
   ├─ Encrypts password with BCrypt
   └─ Displays credentials in console
4. If admin EXISTS:
   └─ Skips creation
```

---

## 📝 Configuration

### Edit `application.properties`:

```properties
# Bootstrap Admin Configuration
bootstrap.admin.email=admin@hospital.com
bootstrap.admin.password=Admin@123456
bootstrap.admin.firstName=System
bootstrap.admin.lastName=Administrator
bootstrap.admin.phone=0000000000
```

### ⚠️ IMPORTANT:
- Change these values BEFORE first deployment
- Use a strong password (min 12 characters)
- Never commit real credentials to version control
- Change password immediately after first login

---

## 🧪 Testing the Security

### ❌ Test 1: Try to Self-Register as Admin (Should FAIL)

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Hacker",
    "lastName": "User",
    "email": "hacker@example.com",
    "password": "password123",
    "phone": "1111111111",
    "role": "ADMIN"
  }'
```

**Expected Response:**
```json
{
  "error": "Cannot self-assign ADMIN role. Contact system administrator."
}
```

---

### ✅ Test 2: Login with Bootstrap Admin (Should WORK)

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "Admin@123456"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "id": 1,
  "email": "admin@hospital.com",
  "firstName": "System",
  "lastName": "Administrator",
  "role": "ADMIN"
}
```

---

### ✅ Test 3: Admin Creates Another Admin (Should WORK)

```bash
# First, login as admin and get token
TOKEN="your_admin_token_here"

# Then create new admin
curl -X POST http://localhost:8080/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "admin2@hospital.com",
    "password": "SecurePass123!",
    "firstName": "Second",
    "lastName": "Admin",
    "phone": "2222222222"
  }'
```

**Expected Response:**
```json
{
  "message": "Admin user created successfully",
  "email": "admin2@hospital.com",
  "role": "ADMIN"
}
```

---

### ❌ Test 4: Non-Admin Tries to Create Admin (Should FAIL)

```bash
# Login as doctor or patient
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "doctor123"
  }'

# Try to create admin with doctor token
curl -X POST http://localhost:8080/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -d '{
    "email": "fake-admin@example.com",
    "password": "password",
    "firstName": "Fake",
    "lastName": "Admin",
    "phone": "3333333333"
  }'
```

**Expected Response:**
```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied"
}
```

---

## 🔄 Complete Workflow

### 1. First Deployment

```bash
# Start application
mvn spring-boot:run

# Console output:
═══════════════════════════════════════════════════════
🔐 BOOTSTRAP ADMIN CREATED SUCCESSFULLY
═══════════════════════════════════════════════════════
📧 Email: admin@hospital.com
🔑 Password: Admin@123456
👤 Role: ADMIN
═══════════════════════════════════════════════════════
⚠️  IMPORTANT: Change this password immediately after first login!
═══════════════════════════════════════════════════════
```

### 2. First Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "Admin@123456"
  }'
```

### 3. Change Password (TODO: Implement change password endpoint)

### 4. Create Additional Admins (if needed)

```bash
curl -X POST http://localhost:8080/api/admin/create-admin \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin2@hospital.com",
    "password": "NewSecurePassword123!",
    "firstName": "Jane",
    "lastName": "Admin",
    "phone": "5555555555"
  }'
```

---

## 🏢 Production Best Practices

### 1. Environment Variables (Recommended)

Instead of hardcoding in `application.properties`, use environment variables:

```bash
# Linux/Mac
export BOOTSTRAP_ADMIN_EMAIL=admin@hospital.com
export BOOTSTRAP_ADMIN_PASSWORD=SuperSecurePassword123!

# Windows
set BOOTSTRAP_ADMIN_EMAIL=admin@hospital.com
set BOOTSTRAP_ADMIN_PASSWORD=SuperSecurePassword123!

# Then run
mvn spring-boot:run
```

Update `application.properties`:
```properties
bootstrap.admin.email=${BOOTSTRAP_ADMIN_EMAIL:admin@hospital.com}
bootstrap.admin.password=${BOOTSTRAP_ADMIN_PASSWORD:Admin@123456}
```

### 2. Docker Deployment

```dockerfile
ENV BOOTSTRAP_ADMIN_EMAIL=admin@hospital.com
ENV BOOTSTRAP_ADMIN_PASSWORD=SecurePassword123!
```

### 3. Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: admin-credentials
type: Opaque
data:
  email: YWRtaW5AaG9zcGl0YWwuY29t  # base64 encoded
  password: U2VjdXJlUGFzc3dvcmQxMjMh  # base64 encoded
```

---

## 🔒 Security Checklist

- [ ] Changed default admin password
- [ ] Used strong password (12+ chars, mixed case, numbers, symbols)
- [ ] Removed default credentials from version control
- [ ] Tested that non-admins cannot self-assign admin role
- [ ] Tested that only admins can create new admins
- [ ] Enabled HTTPS in production
- [ ] Set up proper firewall rules
- [ ] Configured rate limiting
- [ ] Set up monitoring and alerts
- [ ] Regular security audits via audit logs

---

## 📊 User Registration Flow

```
┌─────────────────────────────────────────────────────┐
│         User Registration Request                    │
│         POST /api/auth/register                      │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ Check if role=ADMIN│
         └────────┬───────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
   role=ADMIN          role≠ADMIN
        │                   │
        ▼                   ▼
   ❌ REJECT          ✅ ALLOW
   403 Forbidden      Create User
```

---

## 🎯 Summary

✅ **Bootstrap admin created automatically on first startup**  
✅ **No self-assignment of admin role**  
✅ **Only admins can create new admins**  
✅ **Passwords encrypted with BCrypt**  
✅ **Configurable via application.properties**  
✅ **Production-ready with environment variables**  

---

**🔐 Your system is now secure with proper admin bootstrapping!**
