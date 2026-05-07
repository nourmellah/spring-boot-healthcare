# 🚀 Quick Start Guide

## Get Started in 5 Minutes!

### Step 1: Prerequisites Check ✅

Make sure you have:
- ☑️ Java 21 installed (`java -version`)
- ☑️ Maven installed (`mvn -version`)
- ☑️ MySQL running (`mysql --version`)

### Step 2: Database Setup 🗄️

1. Start MySQL server
2. The database `healthcare_db` will be created automatically
3. Update credentials in `src/main/resources/application.properties` if needed:
   ```properties
   spring.datasource.username=root
   spring.datasource.password=root
   ```

### Step 3: Run the Application 🏃

```bash
cd healthcare-backend
mvn spring-boot:run
```

You should see:
```
🏥 Healthcare Management System Started Successfully!
📍 Server running on: http://localhost:8080
```

### Step 4: Test the APIs 🧪

#### Test 1: Create a Specialty
```bash
curl -X POST http://localhost:8080/api/specialties \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cardiology",
    "description": "Heart and cardiovascular system"
  }'
```

#### Test 2: Register a Patient
```bash
curl -X POST http://localhost:8080/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@email.com",
    "password": "password123",
    "phone": "+1234567890",
    "role": "PATIENT",
    "dateOfBirth": "1990-05-15",
    "gender": "MALE",
    "bloodGroup": "O+",
    "address": "123 Main St, City",
    "emergencyContact": "+0987654321",
    "emergencyContactName": "Jane Doe",
    "medicalHistory": "No known allergies"
  }'
```

#### Test 3: Register a Doctor
```bash
curl -X POST http://localhost:8080/api/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Sarah",
    "lastName": "Smith",
    "email": "dr.smith@hospital.com",
    "password": "doctor123",
    "phone": "+1122334455",
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
  }'
```

#### Test 4: Book an Appointment
```bash
curl -X POST http://localhost:8080/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patient": {"id": 1},
    "doctor": {"id": 2},
    "appointmentDate": "2026-05-10T10:00:00",
    "reason": "Regular checkup",
    "status": "PENDING"
  }'
```

#### Test 5: Get All Patients
```bash
curl http://localhost:8080/api/patients
```

---

## 📊 Common Operations

### View Active Doctors
```bash
curl http://localhost:8080/api/doctors/active
```

### Get Patient Appointments
```bash
curl http://localhost:8080/api/appointments/patient/1
```

### Create Emergency Alert
```bash
curl -X POST http://localhost:8080/api/emergencies \
  -H "Content-Type: application/json" \
  -d '{
    "patient": {"id": 1},
    "description": "Severe chest pain",
    "location": "Home - 123 Main St",
    "severity": "HIGH"
  }'
```

### Get Active Emergencies
```bash
curl http://localhost:8080/api/emergencies/active
```

---

## 🎯 Next Steps

1. **Explore the API**: Check `README.md` for complete API documentation
2. **Test with Postman**: Import the endpoints and test all features
3. **Add Security**: Enable Spring Security for production
4. **Build Frontend**: Create a React/Angular/Vue frontend
5. **Deploy**: Deploy to AWS, Azure, or Heroku

---

## 🐛 Troubleshooting

### Port 8080 already in use?
Change the port in `application.properties`:
```properties
server.port=8081
```

### MySQL connection error?
- Check if MySQL is running
- Verify username/password in `application.properties`
- Ensure MySQL is on port 3306

### Build errors?
```bash
mvn clean install -U
```

---

## 📚 Learn More

- **Architecture**: See `README.md` for detailed architecture explanation
- **Entities**: Check `src/main/java/com/healthcare/system/entities/`
- **APIs**: Review controllers in `src/main/java/com/healthcare/system/controllers/`

---

**Happy Coding! 🎉**
