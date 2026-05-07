# UI V7 - Care Records and Prescription Medicines

This version removes the repeated role-scope banners from the application screens and adds a more production-like care-record experience.

## Frontend changes

- Added patient care profile page:
  - `/app/patients/:id` for admins and doctors.
  - `/app/my-profile` for patients.
- Patient profile aggregates:
  - patient identity
  - medical history
  - appointments
  - prescriptions
  - prescription medicines
  - lab results
  - vital signs
  - emergency history
- Prescription cards now show medication plans.
- Doctors/admins can add medication items to prescriptions.
- Prescription creation can optionally create and attach the first medicine item.
- Added admin audit log page at `/app/audit-logs`.
- Added patient profile and audit log links to the role-aware sidebar/dashboard.
- Removed the repeated explanatory scope banners from all pages.

## Backend patch included

This ZIP includes a small backend patch under:

```text
backend/src/main/java/com/healthcare/system/controllers/
```

Copy these files into your backend:

```text
MedicineController.java
PrescriptionController.java
```

`MedicineController.java` is needed because the original backend had a `Medicine` entity and repository, but no REST controller for creating/selecting medicines from Angular.

The patched `PrescriptionController.java` only sanitizes the prescription-medicine response to avoid circular JSON when medicines are returned.

Do not replace your `application.properties` with anything from this ZIP. Keep your working database credentials.
