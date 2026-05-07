# UI V8 - Visit workflow update

This version focuses on making the healthcare flow feel connected rather than page-by-page CRUD.

## Frontend additions

- Appointment cards now include **Open visit**.
- The visit modal lets Admin/Doctor users:
  - confirm / complete / cancel the appointment,
  - open the patient profile,
  - save a consultation note,
  - record vital signs,
  - create a prescription with an optional first medicine line.
- Patient profiles now include a **Consultation notes** section.
- Appointment timeline items show a small marker when a consultation note exists.

## Backend additions

Copy these backend patch files into your existing backend:

- `ConsultationNoteController.java`
- `ConsultationNoteRepository.java`
- `Medicine.java`
- `PrescriptionMedicine.java`

The last two keep the JSON recursion fix for prescription medicines.

Do not replace `application.properties`.
