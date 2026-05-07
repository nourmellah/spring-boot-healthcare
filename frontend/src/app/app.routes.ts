import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ShellComponent } from './layout/shell.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { AppointmentsComponent } from './pages/appointments/appointments.component';
import { AuditLogsComponent } from './pages/audit-logs/audit-logs.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DoctorsComponent } from './pages/doctors/doctors.component';
import { EmergenciesComponent } from './pages/emergencies/emergencies.component';
import { HomeComponent } from './pages/home.component';
import { LabResultsComponent } from './pages/lab-results/lab-results.component';
import { LoginComponent } from './pages/login/login.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { PatientProfileComponent } from './pages/patient-profile/patient-profile.component';
import { PatientsComponent } from './pages/patients/patients.component';
import { PrescriptionsComponent } from './pages/prescriptions/prescriptions.component';
import { SpecialtiesComponent } from './pages/specialties/specialties.component';
import { VitalSignsComponent } from './pages/vital-signs/vital-signs.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'app',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      {
        path: 'my-profile',
        component: PatientProfileComponent,
        canActivate: [roleGuard],
        data: { roles: ['PATIENT'] },
      },
      {
        path: 'patients',
        component: PatientsComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DOCTOR'] },
      },
      {
        path: 'patients/:id',
        component: PatientProfileComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DOCTOR'] },
      },
      {
        path: 'doctors',
        component: DoctorsComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
      },
      {
        path: 'specialties',
        component: SpecialtiesComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'appointments',
        component: AppointmentsComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
      },
      {
        path: 'prescriptions',
        component: PrescriptionsComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
      },
      {
        path: 'lab-results',
        component: LabResultsComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DOCTOR', 'PATIENT', 'LAB_TECHNICIAN'] },
      },
      {
        path: 'vital-signs',
        component: VitalSignsComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
      },
      {
        path: 'emergencies',
        component: EmergenciesComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
      },
      {
        path: 'notifications',
        component: NotificationsComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'DOCTOR', 'PATIENT', 'LAB_TECHNICIAN'] },
      },
      {
        path: 'accounts',
        component: AdminUsersComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'audit-logs',
        component: AuditLogsComponent,
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
      },
      { path: 'admin-users', pathMatch: 'full', redirectTo: 'accounts' },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
