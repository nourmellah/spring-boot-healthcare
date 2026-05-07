# 🏥 Healthcare Management System

A comprehensive, secure digital healthcare platform built with **Spring Boot** that connects Doctors, Patients, and Labs in one centralized system.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Security & Compliance](#security--compliance)

---

## 🎯 Overview

This system replaces traditional paper-based healthcare processes with a modern, digital solution that provides:

✅ **Digital patient records**  
✅ **Secure access control**  
✅ **Real-time updates**  
✅ **Centralized data management**  
✅ **Complete audit trail**

---

## ⚙️ Features

### 👤 1. Patient Management
- Create and manage patient profiles
- Store complete medical history
- Track diagnoses and treatments
- Record vital signs (blood pressure, heart rate, temperature, etc.)
- Emergency contact information
- Blood group tracking

### 👨‍⚕️ 2. Doctor Management
- Doctor registration with license verification
- Medical specialties (Cardiology, Neurology, Pediatrics, etc.)
- Years of experience tracking
- Consultation fees
- Available days and hours
- Qualifications management

### 📅 3. Appointment System
- Patient books appointments with doctors
- Doctor confirms/rejects appointments
- Status tracking: PENDING → CONFIRMED → COMPLETED/CANCELLED
- Date and time scheduling
- Appointment history
- Consultation notes

### 💊 4. Prescription Management (CORE 🔥)
- Digital prescription creation
- Medicine details (name, dosage, frequency, duration)
- Prescription validity period
- Linked to patient and appointment
- Complete prescription history
- Medicine inventory tracking

### 🧪 5. Lab Results
- Labs upload test results
- Doctors review results
- Patients access reports
- Status tracking: PENDING → COMPLETED → REVIEWED
- File upload support (PDF, images)
- Test history

### 🚨 6. Emergency Alerts
- Patient sends emergency requests
- Instant notifications to all active doctors
- Severity levels: LOW, MEDIUM, HIGH, CRITICAL
- Doctor assignment
- Real-time status updates
- Emergency resolution tracking

### 🔐 7. Security & Access Control
- Role-based access: PATIENT, DOCTOR, ADMIN, LAB_TECHNICIAN
- Patients see only their data
- Doctors see assigned patients
- Admins manage the entire system
- Password encryption (ready for Spring Security)

### 📊 8. Audit & Tracking
- Complete activity log
- Who accessed what data
- When actions were performed
- What was modified
- IP address tracking
- Compliance reporting

### 🔔 9. Notification System
- Real-time notifications for:
  - Appointment confirmations/cancellations
  - New prescriptions
  - Lab results available
  - Emergency alerts
- Unread notification count
- Notification history

### 📈 10. Vital Signs Tracking
- Blood pressure monitoring
- Heart rate tracking
- Temperature records
- Weight and height
- Oxygen saturation (SpO2)
- Respiratory rate
- Historical trends

---

## 🏗️ Architecture

This project follows the **3-Tier Layered Architecture** pattern:

```
┌─────────────────────────────────────────┐
│   PRESENTATION LAYER (Controllers)      │  ← REST API
│   - PatientController                   │
│   - DoctorController                    │
│   - AppointmentController               │
│   - PrescriptionController              │
│   - EmergencyAlertController            │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   BUSINESS LOGIC LAYER (Services)       │  ← Business Rules
│   - PatientServiceImpl                  │
│   - DoctorServiceImpl                   │
│   - AppointmentServiceImpl              │
│   - PrescriptionServiceImpl             │
│   - EmergencyAlertServiceImpl           │
│   - NotificationService                 │
│   - AuditLogService                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   DATA ACCESS LAYER (Repositories)      │  ← Database
│   - PatientRepository                   │
│   - DoctorRepository                    │
│   - AppointmentRepository               │
│   - PrescriptionRepository              │
│   - EmergencyAlertRepository            │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   DOMAIN MODEL (Entities)               │  ← Database Tables
│   - Patient, Doctor, Appointment        │
│   - Prescription, Medicine              │
│   - LabResult, EmergencyAlert           │
│   - VitalSign, Notification, AuditLog   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   DATABASE (MySQL)                      │
└─────────────────────────────────────────┘
```

---

## 🛠️ Technologies Used

- **Java 21**
- **Spring Boot 4.0.2**
- **Spring Data JPA** (Database operations)
- **Spring Web MVC** (REST APIs)
- **Spring Security** (Authentication & Authorization - configured but disabled for development)
- **MySQL 8** (Database)
- **Hibernate** (ORM)
- **Lombok** (Reduce boilerplate code)
- **Maven** (Build tool)

---

## 📁 Project Structure

```
healthcare-backend/
├── src/main/java/com/healthcare/system/
│   ├── entities/                    # Domain models (JPA entities)
│   │   ├── User.java               # Base user entity
│   │   ├── Patient.java            # Patient entity (extends User)
│   │   ├── Doctor.java             # Doctor entity (extends User)
│   │   ├── Specialty.java          # Medical specialties
│   │   ├── Appointment.java        # Appointment entity
│   │   ├── Prescription.java       # Prescription entity
│   │   ├── Medicine.java           # Medicine inventory
│   │   ├── PrescriptionMedicine.java # Prescription-Medicine link
│   │   ├── LabResult.java          # Lab test results
│   │   ├── EmergencyAlert.java     # Emergency alerts
│   │   ├── VitalSign.java          # Patient vital signs
│   │   ├── ConsultationNote.java   # Doctor consultation notes
│   │   ├── Notification.java       # System notifications
│   │   └── AuditLog.java           # Audit trail
│   │
│   ├── repositories/                # Data access layer
│   │   ├── UserRepository.java
│   │   ├── PatientRepository.java
│   │   ├── DoctorRepository.java
│   │   ├── SpecialtyRepository.java
│   │   ├── AppointmentRepository.java
│   │   ├── PrescriptionRepository.java
│   │   ├── MedicineRepository.java
│   │   ├── PrescriptionMedicineRepository.java
│   │   ├── LabResultRepository.java
│   │   ├── EmergencyAlertRepository.java
│   │   ├── VitalSignRepository.java
│   │   ├── ConsultationNoteRepository.java
│   │   ├── NotificationRepository.java
│   │   └── AuditLogRepository.java
│   │
│   ├── services/                    # Business logic layer
│   │   ├── IPatientService.java
│   │   ├── PatientServiceImpl.java
│   │   ├── IDoctorService.java
│   │   ├── DoctorServiceImpl.java
│   │   ├── IAppointmentService.java
│   │   ├── AppointmentServiceImpl.java
│   │   ├── IPrescriptionService.java
│   │   ├── PrescriptionServiceImpl.java
│   │   ├── IEmergencyAlertService.java
│   │   ├── EmergencyAlertServiceImpl.java
│   │   ├── NotificationService.java
│   │   └── AuditLogService.java
│   │
│   ├── controllers/                 # REST API endpoints
│   │   ├── PatientController.java
│   │   ├── DoctorController.java
│   │   ├── AppointmentController.java
│   │   ├── PrescriptionController.java
│   │   └── EmergencyAlertController.java
│   │
│   └── HealthcareApplication.java   # Main application class
│
├── src/main/resources/
│   └── application.properties       # Configuration file
│
├── pom.xml                          # Maven dependencies
└── README.md                        # This file
```

---

## 🚀 Setup Instructions

### Prerequisites

1. **Java 21** installed
2. **Maven** installed
3. **MySQL 8** installed and running
4. **IDE** (IntelliJ IDEA, Eclipse, or VS Code)

### Steps

1. **Clone the repository**
   ```bash
   cd healthcare-backend
   ```

2. **Configure MySQL Database**
   
   Open `src/main/resources/application.properties` and update:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/healthcare_db?createDatabaseIfNotExist=true
   spring.datasource.username=YOUR_MYSQL_USERNAME
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   ```

3. **Build the project**
   ```bash
   mvn clean install
   ```

4. **Run the application**
   ```bash
   mvn spring-boot:run
   ```
   
   Or run the main class `HealthcareApplication.java` from your IDE.

5. **Access the application**
   
   Server will start on: `http://localhost:8080`

---

## 📡 API Endpoints

### Patient APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/patients` | Register new patient |
| GET | `/api/patients` | Get all patients |
| GET | `/api/patients/active` | Get active patients |
| GET | `/api/patients/{id}` | Get patient by ID |
| PUT | `/api/patients/{id}` | Update patient |
| DELETE | `/api/patients/{id}` | Deactivate patient |
| GET | `/api/patients/search?term=` | Search patients |
| GET | `/api/patients/blood-group/{bloodGroup}` | Get patients by blood group |
| GET | `/api/patients/count` | Get active patient count |
| GET | `/api/patients/{id}/medical-history` | Get patient medical history |

### Doctor APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/doctors` | Register new doctor |
| GET | `/api/doctors` | Get all doctors |
| GET | `/api/doctors/active` | Get active doctors |
| GET | `/api/doctors/{id}` | Get doctor by ID |
| PUT | `/api/doctors/{id}` | Update doctor |
| DELETE | `/api/doctors/{id}` | Deactivate doctor |
| GET | `/api/doctors/specialty/{specialtyId}` | Get doctors by specialty |
| GET | `/api/doctors/license/{licenseNumber}` | Get doctor by license |
| GET | `/api/doctors/count` | Get active doctor count |

### Appointment APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/appointments` | Book new appointment |
| GET | `/api/appointments` | Get all appointments |
| GET | `/api/appointments/{id}` | Get appointment by ID |
| GET | `/api/appointments/patient/{patientId}` | Get patient appointments |
| GET | `/api/appointments/doctor/{doctorId}` | Get doctor appointments |
| PUT | `/api/appointments/{id}/status?status=` | Update appointment status |
| PUT | `/api/appointments/{id}` | Update appointment |
| DELETE | `/api/appointments/{id}` | Cancel appointment |
| GET | `/api/appointments/status/{status}` | Get appointments by status |
| GET | `/api/appointments/pending/count` | Get pending count |

### Prescription APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prescriptions` | Create prescription |
| GET | `/api/prescriptions/{id}` | Get prescription by ID |
| GET | `/api/prescriptions/patient/{patientId}` | Get patient prescriptions |
| GET | `/api/prescriptions/doctor/{doctorId}` | Get doctor prescriptions |
| GET | `/api/prescriptions/valid` | Get valid prescriptions |
| PUT | `/api/prescriptions/{id}` | Update prescription |
| POST | `/api/prescriptions/{id}/medicines` | Add medicine to prescription |
| GET | `/api/prescriptions/{id}/medicines` | Get prescription medicines |

### Emergency Alert APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/emergencies` | Create emergency alert |
| GET | `/api/emergencies` | Get all emergencies |
| GET | `/api/emergencies/active` | Get active emergencies |
| GET | `/api/emergencies/{id}` | Get emergency by ID |
| GET | `/api/emergencies/patient/{patientId}` | Get patient emergencies |
| PUT | `/api/emergencies/{id}/assign-doctor/{doctorId}` | Assign doctor |
| PUT | `/api/emergencies/{id}/status?status=` | Update status |
| PUT | `/api/emergencies/{id}/resolve?resolution=` | Resolve emergency |
| GET | `/api/emergencies/active/count` | Get active count |

---

## 🗄️ Database Schema

### Core Tables

- **users** - Base user information
- **patients** - Patient-specific data (extends users)
- **doctors** - Doctor-specific data (extends users)
- **specialties** - Medical specialties
- **appointments** - Appointment bookings
- **prescriptions** - Digital prescriptions
- **medicines** - Medicine inventory
- **prescription_medicines** - Prescription-Medicine relationship
- **lab_results** - Laboratory test results
- **emergency_alerts** - Emergency requests
- **vital_signs** - Patient vital signs
- **consultation_notes** - Doctor consultation notes
- **notifications** - System notifications
- **audit_logs** - Complete audit trail

### Relationships

- Patient **1:N** Appointments
- Doctor **1:N** Appointments
- Patient **1:N** Prescriptions
- Doctor **1:N** Prescriptions
- Prescription **N:M** Medicines (through prescription_medicines)
- Patient **1:N** Lab Results
- Patient **1:N** Emergency Alerts
- Patient **1:N** Vital Signs
- Doctor **1:N** Specialties

---

## 🔐 Security & Compliance

### Access Control

- **PATIENT**: Can view only their own data
- **DOCTOR**: Can view assigned patients and create prescriptions
- **LAB_TECHNICIAN**: Can upload lab results
- **ADMIN**: Full system access

### Audit Trail

Every action is logged with:
- User ID and role
- Action type (CREATE, READ, UPDATE, DELETE)
- Entity affected
- Timestamp
- IP address
- Details

### Data Protection

- Password encryption (Spring Security ready)
- Role-based access control
- Complete activity logging
- Secure API endpoints

---

## 🔄 Example Workflow

1. **Patient Registration**
   - Patient registers in the system
   - Medical history is recorded

2. **Book Appointment**
   - Patient books appointment with a doctor
   - Doctor receives notification

3. **Doctor Confirms**
   - Doctor confirms the appointment
   - Patient receives confirmation notification

4. **Consultation**
   - Doctor reviews patient history
   - Records vital signs
   - Creates consultation notes

5. **Prescription**
   - Doctor creates digital prescription
   - Adds medicines with dosage
   - Patient receives notification

6. **Lab Tests**
   - Doctor orders lab tests
   - Lab uploads results
   - Doctor and patient notified

7. **Emergency**
   - Patient sends emergency alert
   - All doctors notified instantly
   - Doctor responds and resolves

8. **Audit**
   - All actions logged
   - Complete audit trail maintained

---

## 📝 Notes

- Spring Security is configured but **disabled for development** (see `HealthcareApplication.java`)
- Enable security in production by removing the `exclude` parameter
- Database schema is auto-created by Hibernate (`ddl-auto=update`)
- All timestamps are in `LocalDateTime` format
- CORS is enabled for all origins (configure for production)

---

## 🎯 Future Enhancements

- [ ] JWT Authentication
- [ ] Email notifications
- [ ] SMS alerts for emergencies
- [ ] Video consultation integration
- [ ] Payment gateway integration
- [ ] Mobile app (React Native/Flutter)
- [ ] Analytics dashboard
- [ ] Report generation (PDF)
- [ ] Multi-language support
- [ ] Telemedicine features

---

## 👨‍💻 Development

Built with ❤️ using Spring Boot and following industry best practices.

**Architecture**: 3-Tier Layered Architecture  
**Pattern**: Repository Pattern, Service Layer Pattern  
**Database**: MySQL with JPA/Hibernate  
**API**: RESTful APIs with proper HTTP methods

---

## 📞 Support

For issues or questions, please create an issue in the repository.

---

**🏥 Healthcare Management System - Making Healthcare Digital, Secure, and Accessible!**
