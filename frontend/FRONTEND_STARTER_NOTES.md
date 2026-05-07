# Healthcare Angular Frontend - Starter Version

This is a first working Angular frontend for the Spring Boot healthcare backend.

## Implemented

- Login page connected to `POST /api/auth/login`
- JWT token storage in `localStorage`
- HTTP interceptor that sends `Authorization: Bearer <token>`
- Auth guard and role guard
- Main layout with sidebar navigation
- Dashboard page
- Patients page: list + create
- Doctors page: list + create for admin
- Specialties page: list + create for admin
- Appointments page: list + create + basic status update
- Prescriptions page: list + create metadata
- Lab results page: list + create metadata, no real file upload yet
- Vital signs page: list + create
- Emergencies page: active list + create + basic status update
- Admin users page: list + activate/deactivate

## Run

Start the backend first on port 8080:

```bash
cd backend
mvn spring-boot:run
```

Start the Angular frontend:

```bash
cd frontend
npm install
npm start
```

Open:

```text
http://localhost:4200
```

Default admin login:

```text
admin@hospital.com
Admin@123456
```

## Backend proxy

The Angular app calls `/api/...` and uses `proxy.conf.json` to forward requests to:

```text
http://localhost:8080
```

This avoids CORS problems during local development.

## Notes

This is intentionally a starter UI. It does not implement every backend capability yet. The next improvements should be:

1. Patient/doctor detail pages
2. Edit/delete actions
3. Better role-specific dashboards
4. Prescription medicine lines
5. Real notification page, after the backend exposes a `NotificationController`
6. Real lab result file upload, after the backend adds `MultipartFile` support
7. Better backend-side authorization checks for controllers that currently only require authentication
