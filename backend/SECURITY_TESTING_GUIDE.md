# 🔐 Security & Authentication Testing Guide

## Overview
The Healthcare Management System now has **JWT-based authentication** and **role-based access control**.

---

## 🎭 User Roles

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access to everything, manage users, view audit logs |
| **DOCTOR** | View patients, create prescriptions, manage appointments |
| **PATIENT** | View own data, book appointments, view own prescriptions |
| **LAB_TECHNICIAN** | Upload lab results, view assigned tests |

---

## 🚀 Step 1: Rebuild and Run

```bash
# Stop the current server (Ctrl+C)

# Clean and rebuild with new dependencies
mvn clean install

# Run the application
mvn spring-boot:run
```

---

## 📝 Step 2: Register Users

### Register an Admin
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@hospital.com",
    "password": "admin123",
    "phone": "1234567890",
    "role": "ADMIN"
  }'
```

### Register a Doctor
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Dr. Sarah",
    "lastName": "Smith",
    "email": "doctor@hospital.com",
    "password": "doctor123",
    "phone": "9876543210",
    "role": "DOCTOR"
  }'
```

### Register a Patient
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "patient@example.com",
    "password": "patient123",
    "phone": "5555555555",
    "role": "PATIENT"
  }'
```

---

## 🔑 Step 3: Login and Get JWT Token

### Login as Admin
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "id": 1,
  "email": "admin@hospital.com",
  "firstName": "Admin",
  "lastName": "User",
  "role": "ADMIN"
}
```

**Copy the `token` value - you'll need it for authenticated requests!**

---

## 🧪 Step 4: Test Protected Endpoints

### Test WITHOUT Token (Should Fail - 401 Unauthorized)
```bash
curl http://localhost:8080/api/patients
```

### Test WITH Token (Should Work)
```bash
# Replace YOUR_TOKEN_HERE with the actual token from login
curl http://localhost:8080/api/patients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 👑 Step 5: Test Admin-Only Endpoints

### Get Dashboard Stats (Admin Only)
```bash
curl http://localhost:8080/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Get All Users (Admin Only)
```bash
curl http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### View Audit Logs (Admin Only)
```bash
curl http://localhost:8080/api/admin/audit-logs \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Deactivate a User (Admin Only)
```bash
curl -X PUT http://localhost:8080/api/admin/users/2/deactivate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🩺 Step 6: Test Doctor Access

### Login as Doctor
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "doctor123"
  }'
```

### View All Patients (Doctor can access)
```bash
curl http://localhost:8080/api/patients \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN"
```

### Try to Access Admin Dashboard (Should Fail - 403 Forbidden)
```bash
curl http://localhost:8080/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN"
```

---

## 🤒 Step 7: Test Patient Access

### Login as Patient
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "patient123"
  }'
```

### View Own Profile
```bash
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_PATIENT_TOKEN"
```

### Try to View All Patients (Should Fail - 403 Forbidden)
```bash
curl http://localhost:8080/api/patients \
  -H "Authorization: Bearer YOUR_PATIENT_TOKEN"
```

---

## 🔓 Step 8: Logout

```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Access Control Matrix

| Endpoint | ADMIN | DOCTOR | PATIENT | LAB_TECH |
|----------|-------|--------|---------|----------|
| `POST /api/auth/register` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/auth/login` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/auth/me` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/patients` | ✅ | ✅ | ❌ | ❌ |
| `GET /api/patients/{id}` | ✅ | ✅ | ✅* | ❌ |
| `POST /api/patients` | ✅ | ❌ | ✅ | ❌ |
| `DELETE /api/patients/{id}` | ✅ | ❌ | ❌ | ❌ |
| `GET /api/admin/**` | ✅ | ❌ | ❌ | ❌ |

*Patient can only view their own data

---

## 🛡️ Security Features Implemented

✅ **JWT Authentication** - Secure token-based auth  
✅ **Password Encryption** - BCrypt hashing  
✅ **Role-Based Access Control** - 4 user roles  
✅ **Protected Endpoints** - Authorization required  
✅ **Admin-Only Routes** - `/api/admin/**`  
✅ **Token Expiration** - 24 hours (configurable)  
✅ **Audit Logging** - Track all user actions  
✅ **Session Management** - Stateless JWT  

---

## 🔧 Configuration

Edit `application.properties` to customize:

```properties
# JWT Secret Key (change in production!)
jwt.secret=YOUR_SECRET_KEY_HERE

# Token expiration (milliseconds) - default 24 hours
jwt.expiration=86400000
```

---

## 🚨 Common Issues

### 1. "401 Unauthorized"
- Token is missing or invalid
- Token has expired
- User is not logged in

### 2. "403 Forbidden"
- User doesn't have required role
- Trying to access admin endpoint as non-admin

### 3. "Invalid email or password"
- Wrong credentials
- User doesn't exist
- User is deactivated

---

## 📱 Testing with Postman

1. **Import Collection**: Create requests for each endpoint
2. **Set Authorization**: Bearer Token type
3. **Add Token Variable**: `{{token}}` in Authorization header
4. **Login First**: Get token from login response
5. **Use Token**: Copy token to Authorization header

---

## 🎯 Next Steps

1. ✅ Test all endpoints with different roles
2. ✅ Verify access control is working
3. ✅ Check audit logs are being created
4. ⬜ Build a frontend dashboard
5. ⬜ Add email verification
6. ⬜ Add password reset functionality
7. ⬜ Add refresh tokens

---

**🎉 Your Healthcare System is now secure with JWT authentication and role-based access control!**
