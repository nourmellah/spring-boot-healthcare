import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { HealthcareApiService } from '../../core/services/healthcare-api.service';
import { Gender, Patient } from '../../models/healthcare.models';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">Records</p>
        <h1>{{ auth.hasRole(['DOCTOR']) ? 'My patients' : 'Patients' }}</h1>
        <p>{{ pageSubtitle() }}</p>
      </div>

      <div class="page-actions">
        <button class="ghost" type="button" (click)="reload()">Reload</button>
        @if (auth.hasRole(['ADMIN'])) {
          <button class="primary" type="button" (click)="openCreate()">+ Add patient</button>
        }
      </div>
    </div>

    @if (message) {
      <div class="notice success">{{ message }}</div>
    }

    @if (error) {
      <div class="notice warning">{{ error }}</div>
    }

    <section class="directory-summary compact-summary">
      <article>
        <span>👥</span>
        <div>
          <strong>{{ patients.length }}</strong>
          <small>{{ auth.hasRole(['DOCTOR']) ? 'Linked patients' : 'Visible patients' }}</small>
        </div>
      </article>
      <article>
        <span>✓</span>
        <div>
          <strong>{{ activeCount() }}</strong>
          <small>Active profiles</small>
        </div>
      </article>
      <article>
        <span>📅</span>
        <div>
          <strong>{{ appointmentPatientCount }}</strong>
          <small>Linked by appointments</small>
        </div>
      </article>
    </section>

    <section class="panel table-panel">
      <div class="toolbar">
        <div class="search-box">
          <span>⌕</span>
          <input
            placeholder="Search by name, email, phone or blood group"
            (input)="query = $any($event.target).value"
          />
        </div>
        <div class="meta-text">
          {{ filteredPatients().length }} of {{ patients.length }} patients
        </div>
      </div>

      @if (loading) {
        <div class="loading-row">
          <span class="spinner"></span> Loading patients automatically...
        </div>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Contact</th>
                <th>Blood</th>
                <th>Gender</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (patient of filteredPatients(); track patient.id) {
                <tr>
                  <td>
                    <div class="record-title">
                      <span class="record-icon">{{ initials(patient) }}</span>
                      <div>
                        <strong>{{ patient.firstName }} {{ patient.lastName }}</strong
                        ><br />
                        <span class="small-note"
                          >#{{ patient.id }} · {{ patient.dateOfBirth || 'No birth date' }}</span
                        >
                      </div>
                    </div>
                  </td>
                  <td>
                    {{ patient.email }}<br />
                    <span class="small-note">{{ patient.phone || '-' }}</span>
                  </td>
                  <td>
                    <span class="badge">{{ patient.bloodGroup || '-' }}</span>
                  </td>
                  <td>{{ patient.gender || '-' }}</td>
                  <td>
                    <span class="status" [class.inactive]="patient.active === false">
                      {{ patient.active === false ? 'Inactive' : 'Active' }}
                    </span>
                  </td>
                  <td>
                    <div class="row-actions">
                      <a class="tiny" [routerLink]="['/app/patients', patient.id]">Profile</a>
                      @if (auth.hasRole(['ADMIN'])) {
                        <button class="tiny" type="button" (click)="openEdit(patient)">Edit</button>

                        @if (patient.active === false) {
                          <button
                            class="tiny"
                            type="button"
                            [disabled]="deactivatingId === patient.id"
                            (click)="activatePatient(patient)"
                          >
                            {{ deactivatingId === patient.id ? 'Saving...' : 'Activate' }}
                          </button>
                        } @else {
                          <button
                            class="tiny danger"
                            type="button"
                            [disabled]="deactivatingId === patient.id"
                            (click)="deactivatePatient(patient)"
                          >
                            {{ deactivatingId === patient.id ? 'Saving...' : 'Deactivate' }}
                          </button>
                        }
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty">
                    {{ emptyText() }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    @if (showModal) {
      <div class="modal-backdrop" (click)="closeModal()">
        <section class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div>
              <h2>{{ editingId ? 'Edit patient' : 'Register patient' }}</h2>
              <p>
                {{
                  editingId
                    ? 'Update the selected patient profile.'
                    : 'Create a new patient account.'
                }}
              </p>
            </div>
            <button class="icon-button" type="button" (click)="closeModal()">×</button>
          </header>

          <form class="modal-body grid-form" [formGroup]="form" (ngSubmit)="save()">
            <label>First name <input formControlName="firstName" /></label>
            <label>Last name <input formControlName="lastName" /></label>
            <label>Email <input type="email" formControlName="email" /></label>
            <label>
              Password
              <input
                type="password"
                formControlName="password"
                [placeholder]="editingId ? 'Leave empty to keep current password' : 'Patient@123'"
              />
            </label>
            <label>Phone <input formControlName="phone" /></label>
            <label>Date of birth <input type="date" formControlName="dateOfBirth" /></label>
            <label>
              Gender
              <select formControlName="gender">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label>Blood group <input formControlName="bloodGroup" placeholder="O+" /></label>
            <label class="wide">Address <input formControlName="address" /></label>
            <label>Emergency contact name <input formControlName="emergencyContactName" /></label>
            <label>Emergency phone <input formControlName="emergencyContact" /></label>
            <label class="wide"
              >Medical history <textarea rows="4" formControlName="medicalHistory"></textarea>
            </label>

            <div class="modal-footer wide">
              <button class="ghost" type="button" (click)="closeModal()">Cancel</button>
              <button class="primary" type="submit" [disabled]="form.invalid || saving">
                {{ saving ? 'Saving...' : editingId ? 'Save changes' : 'Create patient' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }
  `,
})
export class PatientsComponent implements OnInit {
  readonly auth = inject(AuthService);

  private readonly api = inject(HealthcareApiService);
  private readonly fb = inject(FormBuilder);

  patients: Patient[] = [];
  query = '';
  loading = false;
  saving = false;
  showModal = false;
  editingId?: number;
  deactivatingId?: number;
  error = '';
  message = '';
  appointmentPatientCount = 0;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['Patient@123'],
    phone: [''],
    dateOfBirth: [''],
    gender: ['MALE' as Gender],
    address: [''],
    bloodGroup: [''],
    emergencyContact: [''],
    emergencyContactName: [''],
    medicalHistory: [''],
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    const user = this.auth.currentUser;

    this.loading = true;
    this.error = '';
    this.message = '';

    if (user?.role === 'DOCTOR' && user.id) {
      forkJoin({
        patients: this.api.getPatients().pipe(catchError(() => of([] as Patient[]))),
        appointments: this.api.getDoctorAppointments(user.id).pipe(catchError(() => of([]))),
      }).subscribe(({ patients, appointments }) => {
        const linkedIds = new Set(
          appointments
            .map((appointment) => appointment.patient?.id)
            .filter((id): id is number => typeof id === 'number'),
        );

        this.appointmentPatientCount = linkedIds.size;
        this.patients = patients.filter((patient) => patient.id && linkedIds.has(patient.id));
        this.loading = false;
      });
      return;
    }

    this.api.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients ?? [];
        this.appointmentPatientCount = this.patients.length;
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load patients.';
        this.loading = false;
      },
    });
  }

  pageSubtitle(): string {
    return this.auth.hasRole(['DOCTOR'])
      ? 'Patients listed here are linked to your appointment schedule.'
      : 'Centralized patient profiles with quick access to medical information.';
  }

  filteredPatients(): Patient[] {
    const query = this.query.trim().toLowerCase();

    if (!query) return this.patients;

    return this.patients.filter((patient) =>
      `${patient.firstName} ${patient.lastName} ${patient.email} ${patient.phone ?? ''} ${patient.bloodGroup ?? ''}`
        .toLowerCase()
        .includes(query),
    );
  }

  activeCount(): number {
    return this.patients.filter((patient) => patient.active !== false).length;
  }

  emptyText(): string {
    return this.auth.hasRole(['DOCTOR'])
      ? 'No assigned patients yet. Once appointments are created with you as doctor, they will appear here.'
      : 'No patients found.';
  }

  openCreate(): void {
    this.editingId = undefined;
    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      password: 'Patient@123',
      phone: '',
      dateOfBirth: '',
      gender: 'MALE',
      address: '',
      bloodGroup: '',
      emergencyContact: '',
      emergencyContactName: '',
      medicalHistory: '',
    });
    this.showModal = true;
  }

  openEdit(patient: Patient): void {
    if (!patient.id || !this.auth.hasRole(['ADMIN'])) return;

    this.editingId = patient.id;
    this.form.reset({
      firstName: patient.firstName ?? '',
      lastName: patient.lastName ?? '',
      email: patient.email ?? '',
      password: '',
      phone: patient.phone ?? '',
      dateOfBirth: patient.dateOfBirth ?? '',
      gender: patient.gender ?? 'MALE',
      address: patient.address ?? '',
      bloodGroup: patient.bloodGroup ?? '',
      emergencyContact: patient.emergencyContact ?? '',
      emergencyContactName: patient.emergencyContactName ?? '',
      medicalHistory: patient.medicalHistory ?? '',
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
  }

  save(): void {
    if (this.form.invalid || !this.auth.hasRole(['ADMIN'])) return;

    const raw = this.form.getRawValue();

    if (!this.editingId && !raw.password.trim()) {
      this.error = 'Password is required for a new patient.';
      return;
    }

    const payload: Partial<Patient> = {
      firstName: raw.firstName,
      lastName: raw.lastName,
      email: raw.email,
      phone: raw.phone,
      role: 'PATIENT',
      active: true,
      dateOfBirth: raw.dateOfBirth,
      gender: raw.gender,
      address: raw.address,
      bloodGroup: raw.bloodGroup,
      emergencyContact: raw.emergencyContact,
      emergencyContactName: raw.emergencyContactName,
      medicalHistory: raw.medicalHistory,
    };

    if (raw.password.trim()) {
      payload.password = raw.password;
    }

    this.saving = true;

    const request = this.editingId
      ? this.api.updatePatient(this.editingId, payload)
      : this.api.createPatient(payload);

    request.subscribe({
      next: () => {
        this.message = this.editingId
          ? 'Patient updated successfully.'
          : 'Patient created successfully.';
        this.closeModal();
        this.reload();
      },
      error: (error) => {
        this.error = error.error?.message || error.error?.error || 'Could not save patient.';
        this.saving = false;
      },
    });
  }

  deactivatePatient(patient: Patient): void {
    if (!patient.id || !this.auth.hasRole(['ADMIN'])) return;

    const confirmed = window.confirm(
      'Deactivate this patient account? The patient will not be able to log in, but medical records will be kept.',
    );
    if (!confirmed) return;

    this.deactivatingId = patient.id;
    this.api.deactivateUser(patient.id).subscribe({
      next: () => {
        this.message = 'Patient account deactivated. Medical records were kept.';
        this.deactivatingId = undefined;
        this.reload();
      },
      error: (error) => {
        this.error = error.error?.message || error.error?.error || 'Could not deactivate patient.';
        this.deactivatingId = undefined;
      },
    });
  }

  activatePatient(patient: Patient): void {
    if (!patient.id || !this.auth.hasRole(['ADMIN'])) return;

    this.deactivatingId = patient.id;
    this.api.activateUser(patient.id).subscribe({
      next: () => {
        this.message = 'Patient account activated.';
        this.deactivatingId = undefined;
        this.reload();
      },
      error: (error) => {
        this.error = error.error?.message || error.error?.error || 'Could not activate patient.';
        this.deactivatingId = undefined;
      },
    });
  }

  initials(patient: Patient): string {
    return `${patient.firstName?.[0] ?? ''}${patient.lastName?.[0] ?? ''}`.toUpperCase() || 'PT';
  }
}
