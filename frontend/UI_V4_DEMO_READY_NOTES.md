# Frontend UI v4 - demo-ready workflow update

This version keeps the Spring Boot backend untouched and upgrades the Angular frontend toward a more realistic healthcare workspace.

## Main changes

- Role-aware navigation labels and workspace names.
- Top-bar emergency notification popup with live count, priority summary, and polling every 20 seconds.
- Role-aware dashboard for Admin, Doctor, Patient, and Lab Technician.
- Appointment page changed from table-first layout to a status board: Pending, Confirmed, Completed, Cancelled.
- Prescription page changed from table/form layout to card-based records with hidden create modal.
- Lab result page changed from table/form layout to card-based diagnostic inbox with hidden create modal.
- Vital signs page changed to metric cards plus a visual timeline.
- Emergency center improved with filter chips and priority-first alert cards.

## Backend

No backend files were changed.

## Run

```bash
cd healthcare/frontend
npm install
npm start
```

Backend should already be running on port 8080.
