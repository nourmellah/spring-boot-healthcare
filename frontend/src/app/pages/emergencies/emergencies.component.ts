import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { HealthcareApiService } from '../../core/services/healthcare-api.service';
import { EmergencyAlert, EmergencySeverity, EmergencyStatus, Patient } from '../../models/healthcare.models';

@Component({
  selector: 'app-emergencies',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">Urgent care</p>
        <h1>{{ auth.hasRole(['PATIENT']) ? 'Emergency help' : 'Emergency notification center' }}</h1>
        <p>{{ pageSubtitle() }}</p>
      </div>

      <div class="page-actions">
        <button class="ghost" type="button" (click)="reload()">Reload</button>
        <button class="danger" type="button" (click)="openCreate()">🚨 New alert</button>
      </div>
    </div>

    @if (error) {
      <div class="notice warning">{{ error }}</div>
    }

    @if (message) {
      <div class="notice success">{{ message }}</div>
    }

    <section class="emergency-overview notification-overview">
      <article class="emergency-big-card">
        <div>
          <span class="pulse-dot"></span>
          <p class="eyebrow">{{ auth.hasRole(['PATIENT']) ? 'My alert history' : 'Active notification inbox' }}</p>
          <strong>{{ emergencies.length }}</strong>
          <small>{{ auth.hasRole(['PATIENT']) ? 'visible patient alerts' : 'visible to the care team' }}</small>
        </div>
        <p>{{ overviewText() }}</p>
      </article>
      <article><span>🔴</span><strong>{{ countSeverity('CRITICAL') }}</strong><small>Critical</small></article>
      <article><span>🟠</span><strong>{{ countSeverity('HIGH') }}</strong><small>High</small></article>
      <article><span>🟡</span><strong>{{ countSeverity('MEDIUM') }}</strong><small>Medium</small></article>
    </section>

    <section class="panel app-card">
      <header class="section-heading">
        <div>
          <p class="eyebrow">Alert inbox</p>
          <h2>Emergency notifications</h2>
        </div>
        <div class="segment-control">
          <button type="button" [class.active]="filter === 'ALL'" (click)="filter = 'ALL'">All</button>
          <button type="button" [class.active]="filter === 'CRITICAL'" (click)="filter = 'CRITICAL'">Critical</button>
          <button type="button" [class.active]="filter === 'HIGH'" (click)="filter = 'HIGH'">High</button>
        </div>
      </header>

      @if (loading) {
        <div class="loading-row"><span class="spinner"></span> Loading emergency alerts...</div>
      } @else {
        <div class="alert-feed">
          @for (alert of filteredEmergencies(); track alert.id) {
            <article class="alert-card" [class.critical-alert]="alert.severity === 'CRITICAL'">
              <div class="alert-leading">
                <span [class]="'severity-dot large ' + severityClass(alert.severity)"></span>
              </div>
              <div class="alert-body">
                <header>
                  <div>
                    <strong>{{ alert.severity || 'MEDIUM' }} alert</strong>
                    <small>{{ formatDate(alert.createdAt) }}</small>
                  </div>
                  <span [class]="statusClass(alert.status)">{{ alert.status || 'ACTIVE' }}</span>
                </header>

                <p>{{ alert.description || 'No description provided.' }}</p>

                <div class="alert-meta">
                  <span>👤 {{ patientName(alert) }}</span>
                  <span>📍 {{ alert.location || 'No location' }}</span>
                  @if (alert.doctor?.id) {
                    <span>🩺 Doctor #{{ alert.doctor?.id }}</span>
                  }
                </div>

                @if (alert.id && auth.hasRole(['ADMIN', 'DOCTOR'])) {
                  <footer>
                    <button class="tiny" type="button" (click)="setStatus(alert.id, 'IN_PROGRESS')">Start handling</button>
                    <button class="secondary tiny" type="button" (click)="resolve(alert.id)">Resolve</button>
                    <button class="danger tiny" type="button" (click)="setStatus(alert.id, 'CANCELLED')">Cancel</button>
                  </footer>
                }
              </div>
            </article>
          } @empty {
            <div class="empty-state">
              <span>✓</span>
              <strong>No emergency alerts found</strong>
              <p>{{ emptyText() }}</p>
            </div>
          }
        </div>
      }
    </section>

    @if (showModal) {
      <div class="modal-backdrop" (click)="closeModal()">
        <section class="modal small" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div>
              <h2>Create emergency alert</h2>
              <p>{{ auth.hasRole(['PATIENT']) ? 'This will be attached to your patient account.' : 'Create an urgent notification for the care team.' }}</p>
            </div>
            <button class="icon-button" type="button" (click)="closeModal()">×</button>
          </header>

          <form class="modal-body grid-form" [formGroup]="form" (ngSubmit)="create()">
            @if (!auth.hasRole(['PATIENT'])) {
              <label class="wide">
                Patient
                <select formControlName="patientId">
                  <option value="">Choose patient</option>
                  @for (patient of patients; track patient.id) {
                    <option [value]="patient.id">{{ patient.firstName }} {{ patient.lastName }}</option>
                  }
                </select>
              </label>
            }

            <label>
              Severity
              <select formControlName="severity">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </label>
            <label>Location <input formControlName="location" placeholder="Room 203" /></label>
            <label class="wide">Description <textarea rows="4" formControlName="description"></textarea></label>

            <div class="modal-footer wide">
              <button class="ghost" type="button" (click)="closeModal()">Cancel</button>
              <button class="danger" type="submit" [disabled]="form.invalid || saving">
                {{ saving ? 'Sending...' : 'Create alert' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }
  `,
})
export class EmergenciesComponent implements OnInit {
  readonly auth = inject(AuthService);

  private readonly api = inject(HealthcareApiService);
  private readonly fb = inject(FormBuilder);

  patients: Patient[] = [];
  emergencies: EmergencyAlert[] = [];
  filter: 'ALL' | EmergencySeverity = 'ALL';
  loading = false;
  saving = false;
  showModal = false;
  error = '';
  message = '';

  readonly form = this.fb.nonNullable.group({
    patientId: [''],
    severity: ['MEDIUM'],
    location: [''],
    description: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.auth.hasRole(['ADMIN', 'DOCTOR'])) {
      this.api.getPatients().subscribe({ next: (patients) => (this.patients = patients ?? []) });
    }

    this.reload();
  }

  pageSubtitle(): string {
    return this.auth.hasRole(['PATIENT'])
      ? 'Create an urgent alert and track your active emergency requests.'
      : 'Alerts behave like notifications: high priority, live, and action-oriented.';
  }

  overviewText(): string {
    return this.auth.hasRole(['PATIENT'])
      ? 'Your current and previous emergency requests appear here.'
      : 'Critical alerts are sorted first. The same active alerts appear in the top-bar notification popup.';
  }

  reload(): void {
    const user = this.auth.currentUser;

    if (!user?.id) return;

    this.loading = true;
    this.error = '';

    const request = user.role === 'PATIENT'
      ? this.api.getPatientEmergencies(user.id)
      : this.api.getActiveEmergencies();

    request.subscribe({
      next: (emergencies) => {
        this.emergencies = this.sortEmergencies(emergencies ?? []);
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load emergency alerts.';
        this.loading = false;
      },
    });
  }

  openCreate(): void {
    this.form.reset({
      patientId: '',
      severity: 'MEDIUM',
      location: '',
      description: '',
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
  }

  create(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const user = this.auth.currentUser;
    const patientId = user?.role === 'PATIENT' ? user.id : Number(raw.patientId);

    if (!patientId) {
      this.error = 'Choose a patient.';
      return;
    }

    this.saving = true;

    this.api.createEmergency({
      patient: { id: patientId },
      severity: raw.severity as EmergencySeverity,
      status: 'ACTIVE',
      location: raw.location,
      description: raw.description,
    }).subscribe({
      next: () => {
        this.message = 'Emergency alert created successfully.';
        this.closeModal();
        this.reload();
      },
      error: (error) => {
        this.error = error.error?.message || error.error?.error || 'Could not create emergency.';
        this.saving = false;
      },
    });
  }

  setStatus(id: number, status: EmergencyStatus): void {
    this.api.updateEmergencyStatus(id, status).subscribe({
      next: () => {
        this.message = `Emergency marked as ${status}.`;
        this.reload();
      },
      error: () => {
        this.error = 'Could not update emergency status.';
      },
    });
  }

  resolve(id: number): void {
    this.api.resolveEmergency(id, 'Resolved from the emergency notification center').subscribe({
      next: () => {
        this.message = 'Emergency resolved.';
        this.reload();
      },
      error: () => {
        this.setStatus(id, 'RESOLVED');
      },
    });
  }

  filteredEmergencies(): EmergencyAlert[] {
    return this.filter === 'ALL'
      ? this.emergencies
      : this.emergencies.filter((emergency) => emergency.severity === this.filter);
  }

  sortEmergencies(items: EmergencyAlert[]): EmergencyAlert[] {
    const rank: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

    return [...items].sort(
      (a, b) => (rank[a.severity ?? 'MEDIUM'] ?? 2) - (rank[b.severity ?? 'MEDIUM'] ?? 2),
    );
  }

  patientName(alert: EmergencyAlert): string {
    return `${alert.patient?.firstName ?? ''} ${alert.patient?.lastName ?? ''}`.trim() || `Patient #${alert.patient?.id ?? '-'}`;
  }

  countSeverity(severity: EmergencySeverity): number {
    return this.emergencies.filter((emergency) => emergency.severity === severity).length;
  }

  severityClass(severity?: string): string {
    return (severity ?? 'MEDIUM').toLowerCase();
  }

  statusClass(status?: string): string {
    return `status ${(status ?? 'ACTIVE').toLowerCase()}`;
  }

  formatDate(value?: string): string {
    return value ? value.replace('T', ' ').slice(0, 16) : 'Just now';
  }

  emptyText(): string {
    return this.auth.hasRole(['PATIENT'])
      ? 'Create a new alert if you need urgent assistance.'
      : 'The care team notification inbox is clear.';
  }
}
