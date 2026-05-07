# 🔐 Healthcare System - Role Permissions

## Legend
- ✅ = Full access
- ✅* = Own data only
- ❌ = No access

---

## Complete Permissions Table

| Endpoint | Method | ADMIN | DOCTOR | PATIENT | LAB_TECH |
|----------|--------|-------|--------|---------|----------|
| **AUTH** | | | | | |
| `/api/auth/login` | POST | ✅ | ✅ | ✅ | ✅ |
| `/api/auth/register` | POST | ✅ | ✅ | ✅ | ✅ |
| `/api/auth/me` | GET | ✅ | ✅ | ✅ | ✅ |
| `/api/auth/logout` | POST | ✅ | ✅ | ✅ | ✅ |
| **PATIENTS** | | | | | |
| `/api/patients` | POST | ✅ | ✅ | ✅ | ❌ |
| `/api/patients` | GET | ✅ | ✅ | ❌ | ❌ |
| `/api/patients/active` | GET | ✅ | ✅ | ❌ | ❌ |
| `/api/patients/{id}` | GET | ✅ | ✅ | ✅* | ❌ |
| `/api/patients/{id}` | PUT | ✅ | ✅ | ✅* | ❌ |
| `/api/patients/{id}` | DELETE | ✅ | ❌ | ❌ | ❌ |
| `/api/patients/search` | GET | ✅ | ✅ | ❌ | ❌ |
| `/api/patients/blood-group/{bg}` | GET | ✅ | ✅ | ❌ | ❌ |
| `/api/patients/count` | GET | ✅ | ✅ | ❌ | ❌ |
| `/api/patients/{id}/medical-history` | GET | ✅ | ✅ | ✅* | ❌ |
| **DOCTORS** | | | | | |
| `/api/doctors` | POST | ✅ | ❌ | ❌ | ❌ |
| `/api/doctors` | GET | ✅ | ✅ | ✅ | ❌ |
| `/api/doctors/active` | GET | ✅ | ✅ | ✅ | ❌ |
| `/api/doctors/{id}` | GET | ✅ | ✅ | ✅ | ❌ |
| `/api/doctors/{id}` | PUT | ✅ | ✅* | ❌ | ❌ |
| `/api/doctors/{id}` | DELETE | ✅ | ❌ | ❌ | ❌ |
| `/api/doctors/specialty/{id}` | GET | ✅ | ✅ | ✅ | ❌ |
| `/api/doctors/license/{num}` | GET | ✅ | ✅ | ❌ | ❌ |
| `/api/doctors/count` | GET | ✅ | ✅ | ❌ | ❌ |
| **APPOINTMENTS** | | | | | |
| `/api/appointments` | POST | ✅ | ✅ | ✅ | ❌ |
| `/api/appointments` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/appointments/{id}` | GET | ✅ | ✅* | ✅* | ❌ |
| `/api/appointments/patient/{id}` | GET | ✅ | ✅ | ✅* | ❌ |
| `/api/appointments/doctor/{id}` | GET | ✅ | ✅* | ❌ | ❌ |
| `/api/appointments/{id}/status` | PUT | ✅ | ✅ | ❌ | ❌ |
| `/api/appointments/{id}` | PUT | ✅ | ✅* | ❌ | ❌ |
| `/api/appointments/{id}` | DELETE | ✅ | ✅* | ✅* | ❌ |
| `/api/appointments/status/{status}` | GET | ✅ | ✅ | ❌ | ❌ |
| `/api/appointments/pending/count` | GET | ✅ | ✅ | ❌ | ❌ |
| **PRESCRIPTIONS** | | | | | |
| `/api/prescriptions` | POST | ✅ | ✅ | ❌ | ❌ |
| `/api/prescriptions/{id}` | GET | ✅ | ✅* | ✅* | ❌ |
| `/api/prescriptions/patient/{id}` | GET | ✅ | ✅ | ✅* | ❌ |
| `/api/prescriptions/doctor/{id}` | GET | ✅ | ✅* | ❌ | ❌ |
| `/api/prescriptions/valid` | GET | ✅ | ✅ | ❌ | ❌ |
| `/api/prescriptions/{id}` | PUT | ✅ | ✅* | ❌ | ❌ |
| `/api/prescriptions/{id}/medicines` | POST | ✅ | ✅ | ❌ | ❌ |
| `/api/prescriptions/{id}/medicines` | GET | ✅ | ✅* | ✅* | ❌ |
| **VITAL SIGNS** | | | | | |
| `/api/vital-signs` | POST | ✅ | ✅ | ❌ | ❌ |
| `/api/vital-signs` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/vital-signs/{id}` | GET | ✅ | ✅ | ✅* | ❌ |
| `/api/vital-signs/patient/{id}` | GET | ✅ | ✅ | ✅* | ❌ |
| `/api/vital-signs/patient/{id}/latest` | GET | ✅ | ✅ | ✅* | ❌ |
| `/api/vital-signs/{id}` | PUT | ✅ | ✅ | ❌ | ❌ |
| `/api/vital-signs/{id}` | DELETE | ✅ | ❌ | ❌ | ❌ |
| **LAB RESULTS** | | | | | |
| `/api/lab-results` | POST | ✅ | ❌ | ❌ | ✅ |
| `/api/lab-results` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/lab-results/{id}` | GET | ✅ | ✅* | ✅* | ✅* |
| `/api/lab-results/patient/{id}` | GET | ✅ | ✅ | ✅* | ❌ |
| `/api/lab-results/{id}` | PUT | ✅ | ❌ | ❌ | ✅* |
| `/api/lab-results/{id}` | DELETE | ✅ | ❌ | ❌ | ❌ |
| **EMERGENCY ALERTS** | | | | | |
| `/api/emergencies` | POST | ✅ | ❌ | ✅ | ❌ |
| `/api/emergencies` | GET | ✅ | ✅ | ❌ | ❌ |
| `/api/emergencies/active` | GET | ✅ | ✅ | ❌ | ❌ |
| `/api/emergencies/{id}` | GET | ✅ | ✅ | ✅* | ❌ |
| `/api/emergencies/patient/{id}` | GET | ✅ | ✅ | ✅* | ❌ |
| `/api/emergencies/{id}/assign-doctor/{did}` | PUT | ✅ | ❌ | ❌ | ❌ |
| `/api/emergencies/{id}/status` | PUT | ✅ | ✅* | ❌ | ❌ |
| `/api/emergencies/{id}/resolve` | PUT | ✅ | ✅* | ❌ | ❌ |
| `/api/emergencies/active/count` | GET | ✅ | ✅ | ❌ | ❌ |
| **SPECIALTIES** | | | | | |
| `/api/specialties` | POST | ✅ | ❌ | ❌ | ❌ |
| `/api/specialties` | GET | ✅ | ✅ | ✅ | ❌ |
| `/api/specialties/{id}` | GET | ✅ | ✅ | ✅ | ❌ |
| `/api/specialties/{id}` | PUT | ✅ | ❌ | ❌ | ❌ |
| `/api/specialties/{id}` | DELETE | ✅ | ❌ | ❌ | ❌ |
| **ADMIN ONLY** | | | | | |
| `/api/admin/dashboard` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/admin/users` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/admin/users/{id}` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/admin/users/{id}/activate` | PUT | ✅ | ❌ | ❌ | ❌ |
| `/api/admin/users/{id}/deactivate` | PUT | ✅ | ❌ | ❌ | ❌ |
| `/api/admin/users/{id}` | DELETE | ✅ | ❌ | ❌ | ❌ |
| `/api/admin/audit-logs` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/admin/audit-logs/user/{id}` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/admin/audit-logs/entity/{type}` | GET | ✅ | ❌ | ❌ | ❌ |
| `/api/admin/create-admin` | POST | ✅ | ❌ | ❌ | ❌ |

---

> ✅* = Own data only — users can only access their own records
> ⚠️ No user can self-assign the ADMIN role via `/api/auth/register`
