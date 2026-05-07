# 🧪 API Testing Guide

Complete guide to test all endpoints of the Healthcare Management System.

---

## 📋 Prerequisites

- Application running on `http://localhost:8080`
- MySQL database configured and running
- Tool: Postman, curl, or any REST client

---

## 🔄 Testing Workflow (Recommended Order)

### Step 1: Create Specialties

```bash
POST http://localhost:8080/api/specialties
Content-Type: application/json

{
  "name": "Cardiology",
  "description": "Heart and cardiovascular system specialist"
}
```

```bash
POST http://localhost:8080/api/specialties
Content-Type: application/json

{
  "name": "Neurology",
  "description": "Brain and nervous system specialist"
}
```

### Step 2: Register Doctors

```bash
POST http://localhost:8080/api/doctors
Content-Type: application/json

{
  "firstName": "Sarah",
  "lastName": "Smith",
  "email": "dr.smith@hospital.com",
  "password": "doctor123",
  "phone": "+1234567890",
  "role": "DOCTOR",
  "licenseNumber": "DOC123456",
  "yearsOfExperience": 10,
  "qualifications": "MD, MBBS, Cardiology Specialist",
  "consultationFee": 150.00,
  "availableDays": "MON,TUE,WED,THU,FRI",
  "availableHours": "09:00-17:00",
  "specialty": {
    "id": 1
  }
}
```

### Step 3: Register Patients

```bash
POST http://localhost:8080/api/patients
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@email.com",
  "password": "patient123",
  "phone": "+0987654321",
  "role": "PATIENT",
  "dateOfBirth": "1990-05-15",
  "gender": "MALE",
  "bloodGroup": "O+",
  "address": "123 Main Street, New York, NY 10001",
  "emergencyContact": "+1122334455",
  "emergencyContactName": "Jane Doe",
  "medicalHistory": "No known allergies. Previous surgery: Appendectomy (2015)"
}
```

### Step 4: Book Appointment

```bash
POST http://localhost:8080/api/appointments
Content-Type: application/json

{
  "patient": {
    "id": 1
  },
  "doctor": {
    "id": 1
  },
  "appointmentDate": "2026-05-10T10:00:00",
  "reason": "Regular checkup and blood pressure monitoring",
  "status": "PENDING"
}
```

### Step 5: Confirm Appointment

```bash
PUT http://localhost:8080/api/appointments/1/status?status=CONFIRMED
```

### Step 6: Record Vital Signs

```bash
POST http://localhost:8080/api/vital-signs
Content-Type: application/json

{
  "patient": {
    "id": 1
  },
  "bloodPressure": "120/80",
  "heartRate": 72,
  "temperature": 36.6,
  "weight": 75.5,
  "height": 175.0,
  "oxygenSaturation": 98,
  "respiratoryRate": 16,
  "notes": "All vitals normal",
  "recordedBy": 1
}
```

### Step 7: Create Prescription

```bash
POST http://localhost:8080/api/prescriptions
Content-Type: application/json

{
  "prescription": {
    "patient": {
      "id": 1
    },
    "doctor": {
      "id": 1
    },
    "appointment": {
      "id": 1
    },
    "diagnosis": "Hypertension - Stage 1",
    "instructions": "Take medicines as prescribed. Avoid salty foods. Exercise regularly.",
    "validUntil": "2026-06-10"
  },
  "medicines": [
    {
      "medicine": {
        "id": 1
      },
      "dosage": "5mg",
      "frequency": "Once daily",
      "duration": 30,
      "instructions": "Take in the morning with water",
      "quantity": 30
    }
  ]
}
```

### Step 8: Create Emergency Alert

```bash
POST http://localhost:8080/api/emergencies
Content-Type: application/json

{
  "patient": {
    "id": 1
  },
  "description": "Severe chest pain, difficulty breathing",
  "location": "Home - 123 Main Street, New York",
  "severity": "HIGH"
}
```

### Step 9: Assign Doctor to Emergency

```bash
PUT http://localhost:8080/api/emergencies/1/assign-doctor/1
```

### Step 10: Resolve Emergency

```bash
PUT http://localhost:8080/api/emergencies/1/resolve?resolution=Patient stabilized. Transported to hospital. Cardiac event ruled out.
```

---

## 📊 Complete API Reference

### 🏥 Specialty APIs

#### Create Specialty
```
POST /api/specialties
Body: { "name": "Cardiology", "description": "..." }
```

#### Get All Specialties
```
GET /api/specialties
```

#### Get Specialty by ID
```
GET /api/specialties/1
```

#### Get Specialty by Name
```
GET /api/specialties/name/Cardiology
```

#### Update Specialty
```
PUT /api/specialties/1
Body: { "name": "Cardiology", "description": "Updated description" }
```

#### Delete Specialty
```
DELETE /api/specialties/1
```

---

### 👨‍⚕️ Doctor APIs

#### Register Doctor
```
POST /api/doctors
Body: { doctor object }
```

#### Get All Doctors
```
GET /api/doctors
```

#### Get Active Doctors
```
GET /api/doctors/active
```

#### Get Doctor by ID
```
GET /api/doctors/1
```

#### Get Doctors by Specialty
```
GET /api/doctors/specialty/1
```

#### Get Doctor by License
```
GET /api/doctors/license/DOC123456
```

#### Update Doctor
```
PUT /api/doctors/1
Body: { updated doctor object }
```

#### Delete Doctor
```
DELETE /api/doctors/1
```

#### Get Active Doctor Count
```
GET /api/doctors/count
```

---

### 👤 Patient APIs

#### Register Patient
```
POST /api/patients
Body: { patient object }
```

#### Get All Patients
```
GET /api/patients
```

#### Get Active Patients
```
GET /api/patients/active
```

#### Get Patient by ID
```
GET /api/patients/1
```

#### Search Patients
```
GET /api/patients/search?term=John
```

#### Get Patients by Blood Group
```
GET /api/patients/blood-group/O+
```

#### Update Patient
```
PUT /api/patients/1
Body: { updated patient object }
```

#### Delete Patient
```
DELETE /api/patients/1
```

#### Get Patient Count
```
GET /api/patients/count
```

#### Get Medical History
```
GET /api/patients/1/medical-history
```

---

### 📅 Appointment APIs

#### Book Appointment
```
POST /api/appointments
Body: { appointment object }
```

#### Get All Appointments
```
GET /api/appointments
```

#### Get Appointment by ID
```
GET /api/appointments/1
```

#### Get Patient Appointments
```
GET /api/appointments/patient/1
```

#### Get Doctor Appointments
```
GET /api/appointments/doctor/1
```

#### Update Appointment Status
```
PUT /api/appointments/1/status?status=CONFIRMED
```

#### Update Appointment
```
PUT /api/appointments/1
Body: { updated appointment object }
```

#### Cancel Appointment
```
DELETE /api/appointments/1
```

#### Get Appointments by Status
```
GET /api/appointments/status/PENDING
```

#### Get Doctor Appointments Between Dates
```
GET /api/appointments/doctor/1/between?startDate=2026-05-01T00:00:00&endDate=2026-05-31T23:59:59
```

#### Get Pending Count
```
GET /api/appointments/pending/count
```

---

### 💊 Prescription APIs

#### Create Prescription
```
POST /api/prescriptions
Body: { 
  "prescription": {...},
  "medicines": [...]
}
```

#### Get Prescription by ID
```
GET /api/prescriptions/1
```

#### Get Patient Prescriptions
```
GET /api/prescriptions/patient/1
```

#### Get Doctor Prescriptions
```
GET /api/prescriptions/doctor/1
```

#### Get Valid Prescriptions
```
GET /api/prescriptions/valid
```

#### Update Prescription
```
PUT /api/prescriptions/1
Body: { updated prescription object }
```

#### Add Medicine to Prescription
```
POST /api/prescriptions/1/medicines
Body: { prescription medicine object }
```

#### Get Prescription Medicines
```
GET /api/prescriptions/1/medicines
```

---

### 🚨 Emergency Alert APIs

#### Create Emergency
```
POST /api/emergencies
Body: { emergency alert object }
```

#### Get All Emergencies
```
GET /api/emergencies
```

#### Get Active Emergencies
```
GET /api/emergencies/active
```

#### Get Emergency by ID
```
GET /api/emergencies/1
```

#### Get Patient Emergencies
```
GET /api/emergencies/patient/1
```

#### Assign Doctor
```
PUT /api/emergencies/1/assign-doctor/1
```

#### Update Status
```
PUT /api/emergencies/1/status?status=IN_PROGRESS
```

#### Resolve Emergency
```
PUT /api/emergencies/1/resolve?resolution=Patient stabilized
```

#### Get Active Count
```
GET /api/emergencies/active/count
```

---

## 🧪 Test Scenarios

### Scenario 1: Complete Patient Journey

1. Register patient
2. Book appointment with doctor
3. Doctor confirms appointment
4. Record vital signs before consultation
5. Doctor creates prescription
6. Patient views prescription
7. Check audit log

### Scenario 2: Emergency Handling

1. Patient creates emergency alert
2. All doctors receive notification
3. Doctor assigns themselves
4. Doctor updates status to IN_PROGRESS
5. Doctor resolves emergency
6. Patient receives resolution notification

### Scenario 3: Prescription Management

1. Doctor creates prescription
2. Add multiple medicines
3. Patient views prescription
4. Check prescription validity
5. View prescription history

### Scenario 4: Appointment Management

1. Patient books appointment
2. Doctor views pending appointments
3. Doctor confirms appointment
4. Both receive notifications
5. Appointment completed
6. Doctor adds consultation notes

---

## 📈 Expected Responses

### Success Response (201 Created)
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  ...
}
```

### Success Response (200 OK)
```json
{
  "message": "Operation successful"
}
```

### Error Response (404 Not Found)
```json
{
  "timestamp": "2026-05-02T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "Patient not found with ID: 999"
}
```

### Error Response (400 Bad Request)
```json
{
  "timestamp": "2026-05-02T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed"
}
```

---

## 🔍 Verification Queries

### Check Database
```sql
-- View all patients
SELECT * FROM patients;

-- View all appointments
SELECT * FROM appointments;

-- View all prescriptions
SELECT * FROM prescriptions;

-- View audit logs
SELECT * FROM audit_logs ORDER BY timestamp DESC;

-- View notifications
SELECT * FROM notifications WHERE is_read = false;

-- View active emergencies
SELECT * FROM emergency_alerts WHERE status = 'ACTIVE';
```

---

## 💡 Tips

1. **Use Postman Collections**: Save all requests in a collection
2. **Environment Variables**: Use variables for IDs and base URL
3. **Test in Order**: Follow the recommended workflow
4. **Check Logs**: Monitor console for SQL queries and logs
5. **Verify Database**: Check tables after each operation
6. **Test Error Cases**: Try invalid IDs, missing fields, etc.

---

## 🐛 Common Issues

### Issue: 404 Not Found
- **Cause**: Wrong endpoint or ID doesn't exist
- **Solution**: Verify endpoint URL and check database for valid IDs

### Issue: 400 Bad Request
- **Cause**: Invalid JSON or missing required fields
- **Solution**: Check request body format and required fields

### Issue: 500 Internal Server Error
- **Cause**: Database connection or constraint violation
- **Solution**: Check MySQL connection and foreign key constraints

---

## ✅ Testing Checklist

- [ ] All specialty endpoints working
- [ ] Doctor registration and management
- [ ] Patient registration and management
- [ ] Appointment booking and status updates
- [ ] Prescription creation with medicines
- [ ] Emergency alert creation and resolution
- [ ] Notifications being created
- [ ] Audit logs being recorded
- [ ] Search and filter operations
- [ ] Count and statistics endpoints
- [ ] Error handling working correctly

---

**Happy Testing! 🎉**
