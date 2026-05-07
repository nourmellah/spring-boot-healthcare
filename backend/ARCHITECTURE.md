# 🏗️ Healthcare Management System - Architecture Documentation

## 📐 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  (Web Browser, Mobile App, Postman, External Systems)           │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│                      (Controllers)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Patient    │  │   Doctor     │  │  Appointment │         │
│  │  Controller  │  │  Controller  │  │  Controller  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Prescription │  │  Emergency   │  │  Specialty   │         │
│  │  Controller  │  │  Controller  │  │  Controller  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  • REST API Endpoints                                           │
│  • Request/Response Handling                                    │
│  • HTTP Status Codes                                            │
│  • CORS Configuration                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                           │
│                       (Services)                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Patient    │  │   Doctor     │  │  Appointment │         │
│  │   Service    │  │   Service    │  │   Service    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Prescription │  │  Emergency   │  │ Notification │         │
│  │   Service    │  │   Service    │  │   Service    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐                                               │
│  │  AuditLog    │                                               │
│  │   Service    │                                               │
│  └──────────────┘                                               │
│                                                                  │
│  • Business Rules & Validation                                  │
│  • Transaction Management                                       │
│  • Notification Triggering                                      │
│  • Audit Logging                                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                             │
│                     (Repositories)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Patient    │  │   Doctor     │  │  Appointment │         │
│  │  Repository  │  │  Repository  │  │  Repository  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Prescription │  │  Emergency   │  │ Notification │         │
│  │  Repository  │  │  Repository  │  │  Repository  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  • CRUD Operations                                              │
│  • Custom Queries (JPQL)                                        │
│  • Spring Data JPA                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN MODEL LAYER                          │
│                        (Entities)                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Patient    │  │   Doctor     │  │  Appointment │         │
│  │   Entity     │  │   Entity     │  │   Entity     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Prescription │  │  Emergency   │  │   Medicine   │         │
│  │   Entity     │  │   Entity     │  │   Entity     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  • JPA Entities                                                 │
│  • Relationships (1:1, 1:N, N:M)                               │
│  • Validation Rules                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PERSISTENCE LAYER                           │
│                    (Hibernate/JPA)                               │
│                                                                  │
│  • ORM Mapping                                                  │
│  • SQL Generation                                               │
│  • Transaction Management                                       │
│  • Connection Pooling                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                             │
│                         (MySQL 8)                                │
│                                                                  │
│  Tables: users, patients, doctors, appointments,                │
│          prescriptions, medicines, lab_results,                 │
│          emergency_alerts, notifications, audit_logs            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow

### Example: Patient Books Appointment

```
1. CLIENT
   ↓ POST /api/appointments
   
2. CONTROLLER (AppointmentController)
   ↓ Receives HTTP request
   ↓ Validates request body
   ↓ Calls service method
   
3. SERVICE (AppointmentServiceImpl)
   ↓ Applies business logic
   ↓ Sets status to PENDING
   ↓ Calls repository to save
   ↓ Triggers notification service
   ↓ Logs action via audit service
   
4. REPOSITORY (AppointmentRepository)
   ↓ Executes JPA save operation
   
5. HIBERNATE/JPA
   ↓ Generates SQL INSERT
   ↓ Executes transaction
   
6. DATABASE (MySQL)
   ↓ Stores appointment record
   ↓ Returns generated ID
   
7. RESPONSE FLOW (Reverse)
   ↓ Entity → Service → Controller → Client
   ↓ HTTP 201 Created with appointment object
```

---

## 🗂️ Entity Relationship Diagram

```
┌─────────────┐
│    User     │ (Base Entity)
│─────────────│
│ id          │
│ firstName   │
│ lastName    │
│ email       │
│ password    │
│ phone       │
│ role        │
│ active      │
└─────────────┘
       △
       │ (Inheritance)
       │
   ┌───┴───┐
   │       │
┌──▼────┐ ┌▼────────┐
│Patient│ │ Doctor  │
│───────│ │─────────│
│ dob   │ │ license │
│gender │ │specialty│
│blood  │ │ years   │
│address│ │  fee    │
└───┬───┘ └───┬─────┘
    │         │
    │    ┌────┴────┐
    │    │         │
    │  ┌─▼──────────▼─┐
    │  │ Appointment  │
    │  │──────────────│
    │  │ date         │
    │  │ status       │
    │  │ reason       │
    │  └──┬───────────┘
    │     │
    │     │ 1:1
    │  ┌──▼──────────┐
    │  │Prescription │
    │  │─────────────│
    │  │ diagnosis   │
    │  │ validUntil  │
    │  └──┬──────────┘
    │     │
    │     │ N:M
    │  ┌──▼──────────┐
    │  │  Medicine   │
    │  │─────────────│
    │  │ name        │
    │  │ dosage      │
    │  │ stock       │
    │  └─────────────┘
    │
    │ 1:N
 ┌──▼──────────┐
 │ LabResult   │
 │─────────────│
 │ testName    │
 │ results     │
 │ status      │
 └─────────────┘
    │
    │ 1:N
 ┌──▼──────────┐
 │ Emergency   │
 │─────────────│
 │ description │
 │ severity    │
 │ status      │
 └─────────────┘
    │
    │ 1:N
 ┌──▼──────────┐
 │ VitalSign   │
 │─────────────│
 │ bloodPress  │
 │ heartRate   │
 │ temperature │
 └─────────────┘
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYER                            │
│                  (Spring Security - Ready)                   │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │         Authentication Filter                 │          │
│  │  • JWT Token Validation (Ready to implement) │          │
│  │  • User Credentials Check                    │          │
│  └──────────────────────────────────────────────┘          │
│                       ↓                                      │
│  ┌──────────────────────────────────────────────┐          │
│  │         Authorization Filter                  │          │
│  │  • Role-based Access Control                 │          │
│  │  • PATIENT / DOCTOR / ADMIN / LAB_TECH       │          │
│  └──────────────────────────────────────────────┘          │
│                       ↓                                      │
│  ┌──────────────────────────────────────────────┐          │
│  │            Audit Logger                       │          │
│  │  • Log all access attempts                   │          │
│  │  • Track user actions                        │          │
│  │  • Record IP addresses                       │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Access Control Matrix

| Role | Patient Data | Doctor Data | Appointments | Prescriptions | Emergency | Admin |
|------|-------------|-------------|--------------|---------------|-----------|-------|
| PATIENT | Own only | View assigned | Own only | Own only | Create | ❌ |
| DOCTOR | Assigned patients | Own profile | Assigned | Create/View | Respond | ❌ |
| LAB_TECH | View assigned | ❌ | ❌ | ❌ | ❌ | ❌ |
| ADMIN | All | All | All | All | All | ✅ |

---

## 📊 Data Flow Diagrams

### 1. Appointment Booking Flow

```
Patient                 System                  Doctor
  │                       │                       │
  │──Book Appointment────>│                       │
  │                       │                       │
  │                       │──Save to DB           │
  │                       │                       │
  │                       │──Create Notification──>│
  │                       │                       │
  │<─Confirmation─────────│                       │
  │                       │                       │
  │                       │<──Confirm/Reject──────│
  │                       │                       │
  │<─Status Update────────│                       │
  │                       │                       │
```

### 2. Prescription Creation Flow

```
Doctor                  System                  Patient
  │                       │                       │
  │──Create Prescription─>│                       │
  │                       │                       │
  │──Add Medicines───────>│                       │
  │                       │                       │
  │                       │──Save to DB           │
  │                       │                       │
  │                       │──Update Medicine Stock│
  │                       │                       │
  │                       │──Create Notification──>│
  │                       │                       │
  │                       │──Log Audit            │
  │                       │                       │
  │<─Success Response─────│                       │
  │                       │                       │
```

### 3. Emergency Alert Flow

```
Patient                 System                  Doctors
  │                       │                       │
  │──Create Emergency────>│                       │
  │                       │                       │
  │                       │──Save to DB           │
  │                       │                       │
  │                       │──Broadcast Alert─────>│
  │                       │                       │
  │<─Alert Created────────│                       │
  │                       │                       │
  │                       │<──Doctor Responds─────│
  │                       │                       │
  │<─Doctor Assigned──────│                       │
  │                       │                       │
  │                       │<──Resolution──────────│
  │                       │                       │
  │<─Emergency Resolved───│                       │
  │                       │                       │
```

---

## 🔧 Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    TECHNOLOGY STACK                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Backend Framework                                          │
│  ├─ Spring Boot 4.0.2                                       │
│  ├─ Spring Web MVC (REST APIs)                              │
│  ├─ Spring Data JPA (Data Access)                           │
│  └─ Spring Security (Authentication - Ready)                │
│                                                              │
│  Database                                                    │
│  ├─ MySQL 8 (Primary Database)                              │
│  ├─ Hibernate (ORM)                                         │
│  └─ HikariCP (Connection Pooling)                           │
│                                                              │
│  Build & Dependencies                                        │
│  ├─ Maven (Build Tool)                                      │
│  ├─ Java 21 (Programming Language)                          │
│  └─ Lombok (Code Generation)                                │
│                                                              │
│  Development Tools                                           │
│  ├─ Spring DevTools (Hot Reload)                            │
│  └─ Spring Boot Actuator (Monitoring - Optional)            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Package Structure

```
com.healthcare.system
│
├── entities/              # Domain Models (JPA Entities)
│   ├── User.java         # Base entity with inheritance
│   ├── Patient.java      # Patient-specific fields
│   ├── Doctor.java       # Doctor-specific fields
│   └── ...               # Other entities
│
├── repositories/          # Data Access Layer
│   ├── PatientRepository.java
│   ├── DoctorRepository.java
│   └── ...               # Spring Data JPA repositories
│
├── services/              # Business Logic Layer
│   ├── interfaces/       # Service contracts
│   │   ├── IPatientService.java
│   │   └── ...
│   └── impl/             # Service implementations
│       ├── PatientServiceImpl.java
│       └── ...
│
├── controllers/           # Presentation Layer
│   ├── PatientController.java
│   ├── DoctorController.java
│   └── ...               # REST API endpoints
│
├── dto/                   # Data Transfer Objects (Future)
│   ├── PatientDTO.java
│   └── ...
│
├── config/                # Configuration Classes (Future)
│   ├── SecurityConfig.java
│   └── ...
│
├── exception/             # Exception Handling (Future)
│   ├── GlobalExceptionHandler.java
│   └── ...
│
└── HealthcareApplication.java  # Main Application Class
```

---

## 🔄 Design Patterns Used

### 1. **Layered Architecture Pattern**
- Clear separation of concerns
- Each layer has specific responsibility
- Easy to maintain and test

### 2. **Repository Pattern**
- Abstracts data access logic
- Provides clean API for data operations
- Easy to switch data sources

### 3. **Service Layer Pattern**
- Encapsulates business logic
- Reusable across controllers
- Transaction management

### 4. **Dependency Injection**
- Loose coupling between components
- Easy to test and mock
- Spring manages object lifecycle

### 5. **DTO Pattern** (Ready to implement)
- Separate API models from entities
- Control data exposure
- Validation at API level

### 6. **Observer Pattern** (Notifications)
- Event-driven notifications
- Decoupled notification logic
- Easy to add new notification types

---

## 🚀 Scalability Considerations

### Horizontal Scaling
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Instance 1 │  │  Instance 2 │  │  Instance 3 │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                 ┌──────▼──────┐
                 │Load Balancer│
                 └──────┬──────┘
                        │
                 ┌──────▼──────┐
                 │   Database  │
                 └─────────────┘
```

### Caching Strategy (Future)
```
Client → Controller → Cache (Redis) → Service → Database
                         ↑
                         │
                    Cache Hit/Miss
```

### Database Optimization
- Indexed columns (email, license number, etc.)
- Connection pooling (HikariCP)
- Query optimization (JPQL)
- Lazy loading for relationships

---

## 📈 Performance Optimization

1. **Database Level**
   - Proper indexing
   - Query optimization
   - Connection pooling
   - Batch operations

2. **Application Level**
   - Lazy loading
   - Caching (Redis - future)
   - Async processing
   - Pagination

3. **API Level**
   - Response compression
   - Rate limiting
   - API versioning
   - Proper HTTP caching

---

## 🔒 Security Best Practices

1. **Authentication**
   - JWT tokens (ready to implement)
   - Password encryption (BCrypt)
   - Session management

2. **Authorization**
   - Role-based access control
   - Method-level security
   - Resource-level permissions

3. **Data Protection**
   - SQL injection prevention (JPA)
   - XSS protection
   - CSRF protection
   - Input validation

4. **Audit & Compliance**
   - Complete audit trail
   - Activity logging
   - Data access tracking
   - HIPAA compliance ready

---

## 📝 Future Enhancements

1. **Microservices Architecture**
   - Split into smaller services
   - API Gateway
   - Service discovery
   - Event-driven communication

2. **Cloud Deployment**
   - Docker containers
   - Kubernetes orchestration
   - AWS/Azure deployment
   - Auto-scaling

3. **Advanced Features**
   - Real-time chat (WebSocket)
   - Video consultation
   - AI-powered diagnosis
   - Analytics dashboard

---

**This architecture is designed to be scalable, maintainable, and production-ready!** 🚀
