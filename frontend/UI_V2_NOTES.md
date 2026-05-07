# Healthcare Frontend UI v2

This version keeps the Spring Boot backend unchanged and improves the Angular frontend presentation.

## Main changes

- More professional dashboard visual style.
- Updated sidebar/topbar layout.
- Cleaner table cards, status badges, search bars and loading states.
- Patients page now loads automatically and uses modal create/edit forms.
- Doctors page now loads automatically and uses modal create/edit forms.
- Specialties page now loads automatically and uses modal create/edit forms.
- Appointments page now loads automatically and uses a modal create form with status actions.
- Older visible test forms on remaining starter pages are hidden from the main screen so the UI feels less like a raw API tester.

## Run

```bash
cd healthcare/backend
mvn spring-boot:run
```

In another terminal:

```bash
cd healthcare/frontend
npm install
npm start
```

Open:

```text
http://localhost:4200
```

Default admin:

```text
admin@hospital.com
Admin@123456
```

## Notes

The backend is still the same as the previous package. You can copy only the `frontend/` folder into your current project.

The most polished pages in this version are:

- Dashboard
- Patients
- Doctors
- Specialties
- Appointments

The remaining pages still work as starter list pages and can later be upgraded with the same modal pattern.
