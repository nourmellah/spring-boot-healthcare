import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { HealthcareApiService } from '../../core/services/healthcare-api.service';
import { Patient, VitalSign } from '../../models/healthcare.models';

@Component({
  selector: 'app-vital-signs',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">Monitoring</p>
        <h1>{{ auth.hasRole(['PATIENT']) ? 'My vital signs' : 'Vital sign monitor' }}</h1>
        <p>{{ pageSubtitle() }}</p>
      </div>

      <div class="page-actions">
        <button class="ghost" type="button" (click)="reload()">Reload</button>
        @if (canCreate()) {
          <button class="primary" type="button" (click)="openCreate()">+ Record vitals</button>
        }
      </div>
    </div>

    @if (error) {
      <div class="notice warning">{{ error }}</div>
    }

    @if (message) {
      <div class="notice success">{{ message }}</div>
    }

    @if (auth.hasRole(['DOCTOR']) && patients.length) {
      <section class="panel filter-panel">
        <label>
          Select assigned patient
          <select
            [value]="selectedPatientId || ''"
            (change)="selectPatient($any($event.target).value)"
          >
            <option value="">Choose patient</option>
            @for (patient of patients; track patient.id) {
              <option [value]="patient.id">{{ patient.firstName }} {{ patient.lastName }}</option>
            }
          </select>
        </label>
      </section>
    }

    <section class="vital-metric-grid">
      <article>
        <span>🫀</span>
        <small>Heart rate</small>
        <strong>{{ latest()?.heartRate || '-' }}</strong>
        <em>bpm</em>
      </article>
      <article>
        <span>🌡</span>
        <small>Temperature</small>
        <strong>{{ latest()?.temperature || '-' }}</strong>
        <em>°C</em>
      </article>
      <article>
        <span>🫁</span>
        <small>Oxygen</small>
        <strong>{{ latest()?.oxygenSaturation || '-' }}</strong>
        <em>%</em>
      </article>
      <article>
        <span>🩸</span>
        <small>Blood pressure</small>
        <strong>{{ latest()?.bloodPressure || '-' }}</strong>
        <em>mmHg</em>
      </article>
    </section>

    <section class="panel app-card">
      <header class="section-heading">
        <div>
          <p class="eyebrow">History</p>
          <h2>Measurement timeline</h2>
        </div>
        <span class="badge">{{ vitals.length }} records</span>
      </header>

      @if (loading) {
        <div class="loading-row">
          <span class="spinner"></span> Loading vital signs automatically...
        </div>
      } @else {
        <div class="vital-timeline">
          @for (vital of vitals; track vital.id) {
            <article class="vital-card">
              <header>
                <div class="vital-date">
                  <strong>{{ formatDate(vital.recordedAt) }}</strong>
                  <small>{{ patientName(vital) }}</small>
                </div>

                <div class="actions">
                  <span class="status completed">Recorded</span>
                  @if (canManageVital(vital)) {
                    <button class="secondary tiny" type="button" (click)="openEdit(vital)">
                      Edit
                    </button>
                    <button
                      class="danger tiny"
                      type="button"
                      [disabled]="deletingId === vital.id"
                      (click)="deleteVital(vital)"
                    >
                      {{ deletingId === vital.id ? 'Deleting...' : 'Delete' }}
                    </button>
                  }
                </div>
              </header>

              <div class="vital-values">
                <div>
                  <small>BP</small><strong>{{ vital.bloodPressure || '-' }}</strong>
                </div>
                <div>
                  <small>HR</small><strong>{{ vital.heartRate || '-' }}</strong>
                </div>
                <div>
                  <small>Temp</small><strong>{{ vital.temperature || '-' }}</strong>
                </div>
                <div>
                  <small>SpO2</small><strong>{{ vital.oxygenSaturation || '-' }}</strong>
                </div>
              </div>

              @if (vital.notes) {
                <p>{{ vital.notes }}</p>
              }
            </article>
          } @empty {
            <div class="empty-state">
              <span>♡</span>
              <strong>No vital signs found</strong>
              <p>{{ emptyText() }}</p>
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
              <h2>{{ editingVital ? 'Edit vital signs' : 'Record vital signs' }}</h2>
              <p>
                {{
                  editingVital
                    ? 'Update the recorded measurements. The linked patient stays unchanged.'
                    : 'Add the latest patient measurements.'
                }}
              </p>
            </div>
            <button class="icon-button" type="button" (click)="closeModal()">×</button>
          </header>

          <form class="modal-body grid-form" [formGroup]="form" (ngSubmit)="save()">
            @if (!editingVital) {
              <label>
                Patient
                <select formControlName="patientId">
                  <option value="">Choose patient</option>
                  @for (patient of patients; track patient.id) {
                    <option [value]="patient.id">
                      {{ patient.firstName }} {{ patient.lastName }}
                    </option>
                  }
                </select>
              </label>
            } @else {
              <label>
                Patient
                <input [value]="patientName(editingVital)" disabled />
              </label>
            }

            <label
              >Blood pressure <input formControlName="bloodPressure" placeholder="120/80"
            /></label>
            <label>Heart rate <input type="number" formControlName="heartRate" /></label>
            <label
              >Temperature °C <input type="number" step="0.1" formControlName="temperature"
            /></label>
            <label>Weight kg <input type="number" step="0.1" formControlName="weight" /></label>
            <label>Height cm <input type="number" step="0.1" formControlName="height" /></label>
            <label>Oxygen % <input type="number" formControlName="oxygenSaturation" /></label>
            <label
              >Respiratory rate <input type="number" formControlName="respiratoryRate"
            /></label>
            <label class="wide">Notes <textarea rows="3" formControlName="notes"></textarea></label>

            <div class="modal-footer wide">
              <button class="ghost" type="button" (click)="closeModal()">Cancel</button>
              <button class="primary" type="submit" [disabled]="form.invalid || saving">
                {{ saving ? 'Saving...' : editingVital ? 'Update vitals' : 'Save vitals' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }
  `,
})
export class VitalSignsComponent implements OnInit {
  readonly auth = inject(AuthService);

  private readonly api = inject(HealthcareApiService);
  private readonly fb = inject(FormBuilder);

  patients: Patient[] = [];
  vitals: VitalSign[] = [];
  selectedPatientId?: number;
  editingVital?: VitalSign;
  deletingId?: number;
  showModal = false;
  saving = false;
  loading = false;
  error = '';
  message = '';

  readonly form = this.fb.nonNullable.group({
    patientId: ['', Validators.required],
    bloodPressure: [''],
    heartRate: [0],
    temperature: [0],
    weight: [0],
    height: [0],
    oxygenSaturation: [0],
    respiratoryRate: [0],
    notes: [''],
  });

  ngOnInit(): void {
    this.loadPatientsForRole();
    this.reload();
  }

  canCreate(): boolean {
    return this.auth.hasRole(['ADMIN', 'DOCTOR']);
  }

  canManageVital(vital: VitalSign): boolean {
    const user = this.auth.currentUser;
    if (!user?.id || !vital.id) return false;
    if (user.role === 'ADMIN') return true;

    return user.role === 'DOCTOR' && vital.recordedBy === user.id;
  }

  pageSubtitle(): string {
    if (this.auth.hasRole(['PATIENT']))
      return 'Track recent clinical measurements recorded by the care team.';
    if (this.auth.hasRole(['DOCTOR']))
      return 'Select an assigned patient, then record, edit, or review measurements.';

    return 'Record and review patient measurements in a more visual way.';
  }

  loadPatientsForRole(): void {
    const user = this.auth.currentUser;

    if (!this.canCreate() || !user?.id) return;

    if (user.role === 'ADMIN') {
      this.api.getPatients().subscribe({ next: (patients) => (this.patients = patients ?? []) });
      return;
    }

    forkJoin({
      patients: this.api.getPatients().pipe(catchError(() => of([] as Patient[]))),
      appointments: this.api.getDoctorAppointments(user.id).pipe(catchError(() => of([]))),
    }).subscribe(({ patients, appointments }) => {
      const linkedIds = new Set(
        appointments
          .map((appointment) => appointment.patient?.id)
          .filter((id): id is number => typeof id === 'number'),
      );

      this.patients = patients.filter((patient) => patient.id && linkedIds.has(patient.id));

      if (!this.selectedPatientId && this.patients[0]?.id) {
        this.selectedPatientId = this.patients[0].id;
        this.loadPatientVitals(this.selectedPatientId);
      }
    });
  }

  openCreate(): void {
    this.error = '';
    this.message = '';
    this.editingVital = undefined;
    this.form.reset({
      patientId: this.selectedPatientId ? String(this.selectedPatientId) : '',
      bloodPressure: '',
      heartRate: 0,
      temperature: 0,
      weight: 0,
      height: 0,
      oxygenSaturation: 0,
      respiratoryRate: 0,
      notes: '',
    });
    this.showModal = true;
  }

  openEdit(vital: VitalSign): void {
    if (!this.canManageVital(vital)) return;

    this.error = '';
    this.message = '';
    this.editingVital = vital;
    this.form.reset({
      patientId: vital.patient?.id ? String(vital.patient.id) : '',
      bloodPressure: vital.bloodPressure ?? '',
      heartRate: vital.heartRate ?? 0,
      temperature: vital.temperature ?? 0,
      weight: vital.weight ?? 0,
      height: vital.height ?? 0,
      oxygenSaturation: vital.oxygenSaturation ?? 0,
      respiratoryRate: vital.respiratoryRate ?? 0,
      notes: vital.notes ?? '',
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
    this.editingVital = undefined;
  }

  reload(): void {
    const user = this.auth.currentUser;

    if (!user?.id) return;

    this.error = '';
    this.loading = true;

    if (user.role === 'PATIENT') {
      this.loadPatientVitals(user.id);
      return;
    }

    if (user.role === 'DOCTOR') {
      if (this.selectedPatientId) {
        this.loadPatientVitals(this.selectedPatientId);
      } else {
        this.vitals = [];
        this.loading = false;
      }
      return;
    }

    this.api.getVitalSigns().subscribe({
      next: (vitals) => {
        this.vitals = this.sortVitals(vitals ?? []);
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load vital signs.';
        this.loading = false;
      },
    });
  }

  selectPatient(value: string): void {
    this.selectedPatientId = value ? Number(value) : undefined;
    this.reload();
  }

  loadPatientVitals(patientId: number): void {
    this.api.getPatientVitalSigns(patientId).subscribe({
      next: (vitals) => {
        this.vitals = this.sortVitals(vitals ?? []);
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load vital signs.';
        this.loading = false;
      },
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: Partial<VitalSign> = {
      bloodPressure: raw.bloodPressure,
      heartRate: Number(raw.heartRate),
      temperature: Number(raw.temperature),
      weight: Number(raw.weight),
      height: Number(raw.height),
      oxygenSaturation: Number(raw.oxygenSaturation),
      respiratoryRate: Number(raw.respiratoryRate),
      notes: raw.notes,
      recordedBy: this.auth.currentUser?.id,
    };

    this.saving = true;

    if (this.editingVital?.id) {
      this.api.updateVitalSign(this.editingVital.id, payload).subscribe({
        next: () => {
          this.message = 'Vital signs updated successfully.';
          this.closeModal();
          this.reload();
        },
        error: (error) => {
          this.error =
            error.error?.message || error.error?.error || 'Could not update vital signs.';
          this.saving = false;
        },
      });
      return;
    }

    this.api
      .createVitalSign({
        ...payload,
        patient: { id: Number(raw.patientId) },
      })
      .subscribe({
        next: () => {
          this.message = 'Vital signs saved successfully.';
          this.selectedPatientId = Number(raw.patientId);
          this.closeModal();
          this.reload();
        },
        error: (error) => {
          this.error = error.error?.message || error.error?.error || 'Could not save vital signs.';
          this.saving = false;
        },
      });
  }

  deleteVital(vital: VitalSign): void {
    if (!vital.id || !this.canManageVital(vital)) return;

    const confirmed = window.confirm(
      'Delete this vital sign record? This action cannot be undone.',
    );
    if (!confirmed) return;

    this.error = '';
    this.message = '';
    this.deletingId = vital.id;

    this.api.deleteVitalSign(vital.id).subscribe({
      next: () => {
        this.message = 'Vital signs deleted successfully.';
        this.deletingId = undefined;
        this.reload();
      },
      error: (error) => {
        this.error = error.error?.message || error.error?.error || 'Could not delete vital signs.';
        this.deletingId = undefined;
      },
    });
  }

  latest(): VitalSign | undefined {
    return this.vitals[0];
  }

  sortVitals(vitals: VitalSign[]): VitalSign[] {
    return [...vitals].sort((a, b) =>
      `${b.recordedAt ?? ''}`.localeCompare(`${a.recordedAt ?? ''}`),
    );
  }

  patientName(vital: VitalSign): string {
    return (
      `${vital.patient?.firstName ?? ''} ${vital.patient?.lastName ?? ''}`.trim() ||
      `Patient #${vital.patient?.id ?? '-'}`
    );
  }

  formatDate(value?: string): string {
    return value ? value.replace('T', ' ').slice(0, 16) : 'Latest record';
  }

  emptyText(): string {
    if (this.auth.hasRole(['DOCTOR'])) {
      return this.selectedPatientId
        ? 'No measurements have been recorded for the selected patient yet.'
        : 'Select an assigned patient to view or record vitals.';
    }

    return 'Recorded measurements will appear as a clinical timeline.';
  }
}
