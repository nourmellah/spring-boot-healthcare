import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { HealthcareApiService } from '../../core/services/healthcare-api.service';
import { Doctor, LabResult, LabStatus, Patient } from '../../models/healthcare.models';

@Component({
  selector: 'app-lab-results',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">Diagnostics</p>
        <h1>{{ title() }}</h1>
        <p>{{ subtitle() }}</p>
      </div>

      <div class="page-actions">
        <button class="ghost" type="button" (click)="reload()">Reload</button>
        @if (canCreate()) {
          <button class="primary" type="button" (click)="openCreate()">+ Add result</button>
        }
      </div>
    </div>

    @if (error) {
      <div class="notice warning">{{ error }}</div>
    }

    @if (message) {
      <div class="notice success">{{ message }}</div>
    }

    <section class="lab-status-grid">
      <article>
        <span>🧪</span>
        <strong>{{ results.length }}</strong>
        <small>Total visible</small>
      </article>
      <article>
        <span class="status pending">PENDING</span>
        <strong>{{ countStatus('PENDING') }}</strong>
        <small>Waiting for completion</small>
      </article>
      <article>
        <span class="status completed">COMPLETED</span>
        <strong>{{ countStatus('COMPLETED') }}</strong>
        <small>Completed tests</small>
      </article>
      <article>
        <span class="status reviewed">REVIEWED</span>
        <strong>{{ countStatus('REVIEWED') }}</strong>
        <small>Doctor reviewed</small>
      </article>
    </section>

    <section class="panel app-card">
      <div class="toolbar">
        <div class="search-box">
          <span>⌕</span>
          <input
            placeholder="Search patient, doctor, test name, status or result"
            (input)="query = $any($event.target).value"
          />
        </div>
        <div class="meta-text">{{ filteredResults().length }} result{{ filteredResults().length === 1 ? '' : 's' }}</div>
      </div>

      @if (loading) {
        <div class="loading-row"><span class="spinner"></span> Loading lab results automatically...</div>
      } @else {
        <div class="lab-card-grid">
          @for (result of filteredResults(); track result.id || result.testName + result.testDate) {
            <article class="lab-card">
              <header>
                <div class="lab-icon">🧪</div>
                <div>
                  <h3>{{ result.testName }}</h3>
                  <p>{{ patientName(result) }}</p>
                </div>
                <span [class]="statusClass(result.status)">{{ result.status || 'PENDING' }}</span>
              </header>

              <div class="lab-body">
                <div>
                  <small>Test date</small>
                  <strong>{{ result.testDate || '-' }}</strong>
                </div>
                <div>
                  <small>Doctor</small>
                  <strong>{{ doctorName(result) }}</strong>
                </div>
                <div class="wide">
                  <small>Result</small>
                  <p>{{ result.results || 'No result details added yet.' }}</p>
                </div>
                @if (result.remarks) {
                  <div class="wide">
                    <small>Remarks</small>
                    <p>{{ result.remarks }}</p>
                  </div>
                }
              </div>

              @if (result.filePath) {
                <footer><span>📎 {{ result.filePath }}</span></footer>
              }
            </article>
          } @empty {
            <div class="empty-state">
              <span>🧪</span>
              <strong>{{ emptyTitle() }}</strong>
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
              <h2>Add lab result</h2>
              <p>The backend stores metadata and a file path. Real upload is not implemented yet.</p>
            </div>
            <button class="icon-button" type="button" (click)="closeModal()">×</button>
          </header>

          <form class="modal-body grid-form" [formGroup]="form" (ngSubmit)="create()">
            <label>
              Patient
              <select formControlName="patientId">
                <option value="">Choose patient</option>
                @for (patient of patients; track patient.id) {
                  <option [value]="patient.id">{{ patient.firstName }} {{ patient.lastName }}</option>
                }
              </select>
            </label>

            <label>
              Doctor
              <select formControlName="doctorId">
                <option value="">Optional doctor</option>
                @for (doctor of doctors; track doctor.id) {
                  <option [value]="doctor.id">Dr. {{ doctor.firstName }} {{ doctor.lastName }}</option>
                }
              </select>
            </label>

            <label>Test name <input formControlName="testName" placeholder="Blood test" /></label>
            <label>Test date <input type="date" formControlName="testDate" /></label>
            <label>
              Status
              <select formControlName="status">
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="REVIEWED">Reviewed</option>
              </select>
            </label>
            <label>File path <input formControlName="filePath" placeholder="/uploads/result.pdf" /></label>
            <label class="wide">Results <textarea rows="3" formControlName="results"></textarea></label>
            <label class="wide">Remarks <textarea rows="3" formControlName="remarks"></textarea></label>

            <div class="modal-footer wide">
              <button class="ghost" type="button" (click)="closeModal()">Cancel</button>
              <button class="primary" type="submit" [disabled]="form.invalid || saving">
                {{ saving ? 'Saving...' : 'Save lab result' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }
  `,
})
export class LabResultsComponent implements OnInit {
  readonly auth = inject(AuthService);

  private readonly api = inject(HealthcareApiService);
  private readonly fb = inject(FormBuilder);

  patients: Patient[] = [];
  doctors: Doctor[] = [];
  results: LabResult[] = [];
  query = '';
  showModal = false;
  saving = false;
  loading = false;
  error = '';
  message = '';

  readonly form = this.fb.nonNullable.group({
    patientId: ['', Validators.required],
    doctorId: [''],
    testName: ['', Validators.required],
    testDate: [''],
    results: [''],
    remarks: [''],
    filePath: [''],
    status: ['PENDING'],
  });

  ngOnInit(): void {
    this.loadFormOptions();
    this.reload();
  }

  title(): string {
    if (this.auth.hasRole(['PATIENT'])) return 'My lab results';
    if (this.auth.hasRole(['LAB_TECHNICIAN'])) return 'Lab result entry';

    return 'Lab result inbox';
  }

  subtitle(): string {
    if (this.auth.hasRole(['PATIENT'])) return 'Review diagnostic reports attached to your patient profile.';
    if (this.auth.hasRole(['DOCTOR'])) return 'Review diagnostic results linked to your doctor profile.';
    if (this.auth.hasRole(['LAB_TECHNICIAN'])) return 'Create diagnostic records for patients and doctors.';

    return 'Review diagnostic results and their current status.';
  }

  canCreate(): boolean {
    return this.auth.hasRole(['ADMIN', 'LAB_TECHNICIAN']);
  }

  loadFormOptions(): void {
    if (!this.canCreate()) return;

    this.api.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients ?? [];
      },
      error: () => {
        this.patients = [];
      },
    });

    this.api.getDoctors().subscribe({
      next: (doctors) => {
        this.doctors = doctors ?? [];
      },
      error: () => {
        this.doctors = [];
      },
    });
  }

  openCreate(): void {
    this.form.reset({
      patientId: '',
      doctorId: '',
      testName: '',
      testDate: '',
      results: '',
      remarks: '',
      filePath: '',
      status: 'PENDING',
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
  }

  reload(): void {
    const user = this.auth.currentUser;

    if (!user?.id) return;

    this.loading = true;
    this.error = '';

    if (user.role === 'LAB_TECHNICIAN') {
      this.results = [];
      this.loading = false;
      return;
    }

    const request = user.role === 'PATIENT'
      ? this.api.getPatientLabResults(user.id)
      : user.role === 'DOCTOR'
        ? this.api.getDoctorLabResults(user.id)
        : this.api.getLabResults();

    request.subscribe({
      next: (results) => {
        this.results = results ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load lab results.';
        this.loading = false;
      },
    });
  }

  filteredResults(): LabResult[] {
    const query = this.query.trim().toLowerCase();

    if (!query) return this.results;

    return this.results.filter((result) =>
      `${this.patientName(result)} ${this.doctorName(result)} ${result.testName ?? ''} ${result.status ?? ''} ${result.results ?? ''}`
        .toLowerCase()
        .includes(query),
    );
  }

  create(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    this.saving = true;

    this.api.createLabResult({
      patient: { id: Number(raw.patientId) },
      doctor: raw.doctorId ? { id: Number(raw.doctorId) } : undefined,
      testName: raw.testName,
      testDate: raw.testDate,
      results: raw.results,
      remarks: raw.remarks,
      filePath: raw.filePath,
      status: raw.status as LabStatus,
      uploadedBy: this.auth.currentUser?.id,
    }).subscribe({
      next: (createdResult) => {
        this.message = 'Lab result saved successfully.';
        this.closeModal();

        if (this.auth.hasRole(['LAB_TECHNICIAN'])) {
          this.results = [createdResult, ...this.results];
        } else {
          this.reload();
        }
      },
      error: (error) => {
        this.error = error.error?.message || error.error?.error || 'Could not save lab result.';
        this.saving = false;
      },
    });
  }

  countStatus(status: LabStatus): number {
    return this.results.filter((result) => (result.status ?? 'PENDING') === status).length;
  }

  statusClass(status?: LabStatus): string {
    return `status ${(status ?? 'PENDING').toLowerCase()}`;
  }

  patientName(result: LabResult): string {
    return `${result.patient?.firstName ?? ''} ${result.patient?.lastName ?? ''}`.trim() || `Patient #${result.patient?.id ?? '-'}`;
  }

  doctorName(result: LabResult): string {
    if (!result.doctor) return 'Not assigned';

    const name = `${result.doctor.firstName ?? ''} ${result.doctor.lastName ?? ''}`.trim();
    return name ? `Dr. ${name}` : `Doctor #${result.doctor.id ?? '-'}`;
  }

  emptyTitle(): string {
    return this.auth.hasRole(['LAB_TECHNICIAN']) ? 'Result entry mode' : 'No lab results found';
  }

  emptyText(): string {
    if (this.auth.hasRole(['LAB_TECHNICIAN'])) {
      return 'Create a result using the button above. The backend does not expose a full lab-technician inbox yet.';
    }

    return 'Diagnostic reports will appear here after they are created.';
  }
}
