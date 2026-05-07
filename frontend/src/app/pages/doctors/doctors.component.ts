import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { HealthcareApiService } from '../../core/services/healthcare-api.service';
import { Doctor, Specialty } from '../../models/healthcare.models';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">Care team</p>
        <h1>Doctors</h1>
        <p>Browse the hospital staff as a directory instead of a raw table.</p>
      </div>
      <div class="page-actions">
        <button class="ghost" type="button" (click)="reload()">Reload</button>
        @if (auth.hasRole(['ADMIN'])) {
          <button class="primary" type="button" (click)="openCreate()">+ Add doctor</button>
        }
      </div>
    </div>

    @if (message) {
      <div class="notice success">{{ message }}</div>
    }
    @if (error) {
      <div class="notice warning">{{ error }}</div>
    }

    <section class="directory-summary">
      <article>
        <span>🩺</span>
        <div>
          <strong>{{ doctors.length }}</strong
          ><small>Total doctors</small>
        </div>
      </article>
      <article>
        <span>✓</span>
        <div>
          <strong>{{ activeCount() }}</strong
          ><small>Active staff</small>
        </div>
      </article>
      <article>
        <span>✦</span>
        <div>
          <strong>{{ specialties.length }}</strong
          ><small>Specialties</small>
        </div>
      </article>
    </section>

    <section class="panel app-card">
      <div class="toolbar">
        <div class="search-box">
          <span>⌕</span
          ><input
            placeholder="Search by name, specialty, email or license"
            (input)="query = $any($event.target).value"
          />
        </div>
        <div class="meta-text">{{ filteredDoctors().length }} of {{ doctors.length }} doctors</div>
      </div>

      @if (loading) {
        <div class="loading-row">
          <span class="spinner"></span> Loading doctors automatically...
        </div>
      } @else {
        <div class="doctor-card-grid">
          @for (doctor of filteredDoctors(); track doctor.id) {
            <article class="doctor-profile-card">
              <header>
                <span class="doctor-avatar">{{ initials(doctor) }}</span>
                <div>
                  <h3>Dr. {{ doctor.firstName }} {{ doctor.lastName }}</h3>
                  <p>{{ doctor.specialty?.name || 'General medicine' }}</p>
                </div>
                <span class="status" [class.inactive]="doctor.active === false">{{
                  doctor.active === false ? 'Inactive' : 'Active'
                }}</span>
              </header>
              <div class="doctor-info-grid">
                <div>
                  <small>Email</small><strong>{{ doctor.email }}</strong>
                </div>
                <div>
                  <small>License</small><strong>{{ doctor.licenseNumber || '-' }}</strong>
                </div>
                <div>
                  <small>Availability</small><strong>{{ doctor.availableDays || '-' }}</strong
                  ><span>{{ doctor.availableHours || '-' }}</span>
                </div>
                <div>
                  <small>Fee</small><strong>{{ doctor.consultationFee || 0 }}</strong>
                </div>
              </div>
              <footer>
                <span>{{ doctor.yearsOfExperience || 0 }} years experience</span>
                @if (auth.hasRole(['ADMIN'])) {
                  <button class="tiny" type="button" (click)="openEdit(doctor)">
                    Edit profile
                  </button>
                  @if (doctor.active === false) {
                    <button
                      class="tiny"
                      type="button"
                      [disabled]="deactivatingId === doctor.id"
                      (click)="activateDoctor(doctor)"
                    >
                      {{ deactivatingId === doctor.id ? 'Saving...' : 'Activate' }}
                    </button>
                  } @else {
                    <button
                      class="tiny danger"
                      type="button"
                      [disabled]="deactivatingId === doctor.id"
                      (click)="deactivateDoctor(doctor)"
                    >
                      {{ deactivatingId === doctor.id ? 'Saving...' : 'Deactivate' }}
                    </button>
                  }
                }
              </footer>
            </article>
          } @empty {
            <div class="empty-state">
              <span>🩺</span><strong>No doctors found</strong>
              <p>Try another search or create a new doctor profile.</p>
            </div>
          }
        </div>
      }
    </section>

    @if (showModal) {
      <div class="modal-backdrop" (click)="closeModal()">
        <section class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div>
              <h2>{{ editingId ? 'Edit doctor' : 'Create doctor' }}</h2>
              <p>Doctor account, specialty and schedule details.</p>
            </div>
            <button class="icon-button" type="button" (click)="closeModal()">×</button>
          </header>
          <form class="modal-body grid-form" [formGroup]="form" (ngSubmit)="save()">
            <label>First name <input formControlName="firstName" /></label
            ><label>Last name <input formControlName="lastName" /></label
            ><label>Email <input type="email" formControlName="email" /></label
            ><label
              >Password
              <input
                type="password"
                formControlName="password"
                [placeholder]="
                  editingId ? 'Leave empty to keep current password' : 'Doctor@123'
                " /></label
            ><label>Phone <input formControlName="phone" /></label
            ><label>License number <input formControlName="licenseNumber" /></label
            ><label
              >Specialty
              <select formControlName="specialtyId">
                <option value="">No specialty</option>
                @for (s of specialties; track s.id) {
                  <option [value]="s.id">{{ s.name }}</option>
                }
              </select></label
            ><label>Experience <input type="number" formControlName="yearsOfExperience" /></label
            ><label
              >Consultation fee <input type="number" formControlName="consultationFee" /></label
            ><label
              >Available days
              <input formControlName="availableDays" placeholder="MON,TUE,WED" /></label
            ><label
              >Available hours
              <input formControlName="availableHours" placeholder="09:00-17:00" /></label
            ><label class="wide"
              >Qualifications <textarea rows="3" formControlName="qualifications"></textarea>
            </label>
            <div class="modal-footer wide">
              <button class="ghost" type="button" (click)="closeModal()">Cancel</button
              ><button class="primary" type="submit" [disabled]="form.invalid || saving">
                {{ saving ? 'Saving...' : editingId ? 'Save changes' : 'Create doctor' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }
  `,
})
export class DoctorsComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(HealthcareApiService);
  private readonly fb = inject(FormBuilder);

  doctors: Doctor[] = [];
  specialties: Specialty[] = [];
  query = '';
  loading = false;
  saving = false;
  showModal = false;
  editingId?: number;
  deactivatingId?: number;
  error = '';
  message = '';

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['Doctor@123'],
    phone: ['', Validators.required],
    licenseNumber: ['', Validators.required],
    specialtyId: [''],
    yearsOfExperience: [0],
    qualifications: [''],
    consultationFee: [0],
    availableDays: ['MON,TUE,WED,THU,FRI'],
    availableHours: ['09:00-17:00'],
  });

  ngOnInit(): void {
    this.reload();
    this.api.getSpecialties().subscribe({ next: (s) => (this.specialties = s) });
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.api.getDoctors().subscribe({
      next: (d) => {
        this.doctors = d;
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load doctors.';
        this.loading = false;
      },
    });
  }

  filteredDoctors(): Doctor[] {
    const q = this.query.trim().toLowerCase();
    return q
      ? this.doctors.filter((d) =>
          `${d.firstName} ${d.lastName} ${d.email} ${d.licenseNumber ?? ''} ${d.specialty?.name ?? ''}`
            .toLowerCase()
            .includes(q),
        )
      : this.doctors;
  }

  activeCount(): number {
    return this.doctors.filter((d) => d.active !== false).length;
  }

  openCreate(): void {
    this.editingId = undefined;
    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      password: 'Doctor@123',
      phone: '',
      licenseNumber: '',
      specialtyId: '',
      yearsOfExperience: 0,
      qualifications: '',
      consultationFee: 0,
      availableDays: 'MON,TUE,WED,THU,FRI',
      availableHours: '09:00-17:00',
    });
    this.showModal = true;
  }

  openEdit(d: Doctor): void {
    if (!d.id) return;
    this.editingId = d.id;
    this.form.reset({
      firstName: d.firstName ?? '',
      lastName: d.lastName ?? '',
      email: d.email ?? '',
      password: '',
      phone: d.phone ?? '',
      licenseNumber: d.licenseNumber ?? '',
      specialtyId: d.specialty?.id ? String(d.specialty.id) : '',
      yearsOfExperience: d.yearsOfExperience ?? 0,
      qualifications: d.qualifications ?? '',
      consultationFee: d.consultationFee ?? 0,
      availableDays: d.availableDays ?? '',
      availableHours: d.availableHours ?? '',
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
  }

  save(): void {
    if (this.form.invalid) return;
    const r = this.form.getRawValue();

    if (!this.editingId && !r.password.trim()) {
      this.error = 'Password is required for a new doctor.';
      return;
    }

    const doctor: Partial<Doctor> = {
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      role: 'DOCTOR',
      licenseNumber: r.licenseNumber,
      specialty: r.specialtyId ? { id: Number(r.specialtyId), name: '' } : undefined,
      yearsOfExperience: Number(r.yearsOfExperience),
      qualifications: r.qualifications,
      consultationFee: Number(r.consultationFee),
      availableDays: r.availableDays,
      availableHours: r.availableHours,
    };

    if (r.password.trim()) doctor.password = r.password;

    this.saving = true;
    (this.editingId
      ? this.api.updateDoctor(this.editingId, doctor)
      : this.api.createDoctor(doctor)
    ).subscribe({
      next: () => {
        this.message = this.editingId
          ? 'Doctor updated successfully.'
          : 'Doctor created successfully.';
        this.closeModal();
        this.reload();
      },
      error: (e) => {
        this.error = e.error?.message || e.error?.error || 'Could not save doctor.';
        this.saving = false;
      },
    });
  }

  deactivateDoctor(doctor: Doctor): void {
    if (!doctor.id || !this.auth.hasRole(['ADMIN'])) return;

    const confirmed = window.confirm(
      'Deactivate this doctor account? The doctor will not be able to log in, but medical records will be kept.',
    );
    if (!confirmed) return;

    this.deactivatingId = doctor.id;
    this.api.deactivateUser(doctor.id).subscribe({
      next: () => {
        this.message = 'Doctor account deactivated. Medical records were kept.';
        this.deactivatingId = undefined;
        this.reload();
      },
      error: (error) => {
        this.error = error.error?.message || error.error?.error || 'Could not deactivate doctor.';
        this.deactivatingId = undefined;
      },
    });
  }

  activateDoctor(doctor: Doctor): void {
    if (!doctor.id || !this.auth.hasRole(['ADMIN'])) return;

    this.deactivatingId = doctor.id;
    this.api.activateUser(doctor.id).subscribe({
      next: () => {
        this.message = 'Doctor account activated.';
        this.deactivatingId = undefined;
        this.reload();
      },
      error: (error) => {
        this.error = error.error?.message || error.error?.error || 'Could not activate doctor.';
        this.deactivatingId = undefined;
      },
    });
  }

  initials(d: Doctor): string {
    return `${d.firstName?.[0] ?? ''}${d.lastName?.[0] ?? ''}`.toUpperCase() || 'DR';
  }
}
