# UI V6 — Role-Scoped Demo Workflow

This frontend version focuses on making the app behave correctly for each account type.

## Main changes

- Added role-aware data loading across the demo workflow.
- Patient accounts now see their own appointments, prescriptions, lab results, vital signs, and emergency alerts.
- Doctor accounts see their assigned appointments, prescriptions, lab results, and appointment-linked patients where the backend supports it.
- Admin accounts keep global visibility and account/profile management.
- Lab technician accounts focus on diagnostic result creation without calling admin-only listing endpoints.
- Emergency notifications in the top bar are now scoped: patients see their own active alerts, while doctors/admins see the active care-team inbox.
- Vitals page no longer calls the admin-only global vitals endpoint for doctors; doctors select a patient linked to their appointments.
- Patients page no longer shows create/edit buttons to doctors because the backend only allows admin/patient creation and admin/patient updates.

## Demo flow to test

1. Login as Admin.
2. Create a Patient account and a Doctor account from Accounts.
3. Create/book an appointment between the patient and doctor.
4. Login as Doctor and confirm/complete the appointment.
5. From Doctor, create a prescription for the linked patient.
6. Login as Lab Technician and add a lab result for the patient.
7. Login as Patient and verify only the patient's own data appears.
8. Create an emergency alert as Patient and verify it appears in the top emergency popup for Patient/Doctor/Admin.

## Backend limitation handled in the frontend

The backend allows LAB_TECHNICIAN to create lab results, but `GET /api/lab-results` is admin-only. For this reason, the Lab Technician screen avoids calling that endpoint and focuses on result creation. Newly created results appear in the current page session.
