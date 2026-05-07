import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { HealthcareApiService } from '../../core/services/healthcare-api.service';
import {
  Appointment,
  DashboardStats,
  EmergencyAlert,
  LabResult,
  Prescription,
} from '../../models/healthcare.models';

type DashboardAction = {
  icon: string;
  label: string;
  help: string;
  path: string;
};

type RoleConfig = {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions: DashboardAction[];
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="dashboard-hero role-hero">
      <div>
        <p class="eyebrow">{{ roleConfig().eyebrow }}</p>
        <h1>{{ roleConfig().title }}</h1>
        <p>{{ roleConfig().subtitle }}</p>
      </div>

      @if (canUseEmergency()) {
        <div class="hero-status-card">
          <span class="live-dot"></span>
          <div>
            <strong>{{ activeEmergencies.length }}</strong>
            <small>active emergency alert{{ activeEmergencies.length === 1 ? '' : 's' }}</small>
          </div>
        </div>
      } @else {
        <div class="hero-status-card calm-card">
          <span>🧪</span>
          <div>
            <strong>{{ labResults.length }}</strong>
            <small>created result{{ labResults.length === 1 ? '' : 's' }} this session</small>
          </div>
        </div>
      }
    </div>

    @if (error) {
      <div class="notice warning">{{ error }}</div>
    }

    <section class="workspace-grid">
      @if (canUseEmergency()) {
        <article class="metric-card emergency-card">
          <span class="metric-icon">🚨</span>
          <small>{{ auth.hasRole(['PATIENT']) ? 'My emergency alerts' : 'Emergency center' }}</small>
          <strong>{{ activeEmergencies.length }}</strong>
          <p>{{ activeEmergencies.length ? 'Open incidents require review.' : 'No active alerts at the moment.' }}</p>
          <a routerLink="/app/emergencies">Open alerts →</a>
        </article>
      }

      @if (canUseAppointments()) {
        <article class="metric-card">
          <span class="metric-icon">📅</span>
          <small>{{ auth.hasRole(['PATIENT']) ? 'My visits' : 'Appointments' }}</small>
          <strong>{{ appointments.length }}</strong>
          <p>{{ appointmentSummary() }}</p>
          <a routerLink="/app/appointments">Open schedule →</a>
        </article>
      }

      @if (auth.hasRole(['ADMIN']) && stats) {
        <article class="metric-card">
          <span class="metric-icon">👥</span>
          <small>Patients</small>
          <strong>{{ stats.totalPatients }}</strong>
          <p>{{ stats.activePatients }} active profiles</p>
          <a routerLink="/app/patients">View patients →</a>
        </article>

        <article class="metric-card">
          <span class="metric-icon">🩺</span>
          <small>Doctors</small>
          <strong>{{ stats.totalDoctors }}</strong>
          <p>{{ stats.activeDoctors }} active doctors</p>
          <a routerLink="/app/doctors">Open directory →</a>
        </article>
      } @else {
        @if (canUsePrescriptions()) {
          <article class="metric-card">
            <span class="metric-icon">Rx</span>
            <small>Prescriptions</small>
            <strong>{{ prescriptions.length }}</strong>
            <p>{{ auth.hasRole(['PATIENT']) ? 'Your active treatment records.' : 'Care plans created by doctors.' }}</p>
            <a routerLink="/app/prescriptions">Open prescriptions →</a>
          </article>
        }

        <article class="metric-card">
          <span class="metric-icon">🧪</span>
          <small>Lab results</small>
          <strong>{{ labResults.length }}</strong>
          <p>{{ labResultSummary() }}</p>
          <a routerLink="/app/lab-results">Open lab →</a>
        </article>
      }
    </section>

    <section class="role-action-strip">
      @for (action of roleConfig().actions; track action.path + action.label) {
        <a [routerLink]="action.path">
          <span>{{ action.icon }}</span>
          <div>
            <strong>{{ action.label }}</strong>
            <small>{{ action.help }}</small>
          </div>
        </a>
      }
    </section>

    <section class="dashboard-columns">
      @if (canUseAppointments()) {
        <article class="panel app-card">
          <header class="section-heading">
            <div>
              <p class="eyebrow">Care flow</p>
              <h2>{{ auth.hasRole(['PATIENT']) ? 'Your care timeline' : 'Appointment workflow' }}</h2>
            </div>
            <button class="ghost" type="button" (click)="loadOverview()">Reload</button>
          </header>

          <div class="timeline-list">
            @for (appointment of appointments.slice(0, 5); track appointment.id) {
              <div class="timeline-item">
                <span class="timeline-dot"></span>
                <div>
                  <strong>{{ formatDate(appointment.appointmentDate) }}</strong>
                  <p>{{ appointmentLabel(appointment) }}</p>
                </div>
                <span [class]="statusClass(appointment.status)">{{ appointment.status || 'PENDING' }}</span>
              </div>
            } @empty {
              <div class="empty-state small">
                <span>📅</span>
                <strong>No appointments loaded</strong>
                <p>Appointments will appear here after creation.</p>
              </div>
            }
          </div>
        </article>
      }

      @if (canUseEmergency()) {
        <article class="panel app-card">
          <header class="section-heading">
            <div>
              <p class="eyebrow">Live alerts</p>
              <h2>{{ auth.hasRole(['PATIENT']) ? 'My emergency notifications' : 'Emergency notifications' }}</h2>
            </div>
            <a class="tiny" routerLink="/app/emergencies">View all</a>
          </header>

          <div class="alert-feed compact-feed">
            @for (alert of sortedEmergencies().slice(0, 4); track alert.id) {
              <div class="alert-card-mini">
                <span [class]="'severity-dot ' + severityClass(alert.severity)"></span>
                <div>
                  <strong>{{ alert.severity || 'MEDIUM' }} · {{ alert.status || 'ACTIVE' }}</strong>
                  <p>{{ alert.description || 'Emergency alert' }}</p>
                  <small>{{ alert.location || 'No location' }}</small>
                </div>
              </div>
            } @empty {
              <div class="empty-state small">
                <span>✓</span>
                <strong>No active emergency</strong>
                <p>The alert inbox is currently clear.</p>
              </div>
            }
          </div>
        </article>
      } @else {
        <article class="panel app-card">
          <header class="section-heading">
            <div>
              <p class="eyebrow">Laboratory</p>
              <h2>Result entry workflow</h2>
            </div>
            <a class="tiny" routerLink="/app/lab-results">Open lab</a>
          </header>

          <div class="demo-workflow-list">
            <div><span>1</span><p>Select patient and doctor</p></div>
            <div><span>2</span><p>Enter diagnostic result metadata</p></div>
            <div><span>3</span><p>Doctor and patient can view results from their portal</p></div>
          </div>
        </article>
      }
    </section>
  `,
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);

  private readonly api = inject(HealthcareApiService);

  stats?: DashboardStats;
  appointments: Appointment[] = [];
  activeEmergencies: EmergencyAlert[] = [];
  prescriptions: Prescription[] = [];
  labResults: LabResult[] = [];
  error = '';

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    const user = this.auth.currentUser;
    this.error = '';

    if (!user?.id) return;

    if (user.role === 'ADMIN') {
      this.api.getDashboardStats().subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: () => {
          this.error = 'Dashboard statistics could not be loaded.';
        },
      });
      this.api.getAppointments().subscribe({ next: (items) => (this.appointments = items ?? []), error: () => (this.appointments = []) });
      this.api.getValidPrescriptions().subscribe({ next: (items) => (this.prescriptions = items ?? []), error: () => (this.prescriptions = []) });
      this.api.getLabResults().subscribe({ next: (items) => (this.labResults = items ?? []), error: () => (this.labResults = []) });
      this.loadEmergencies();
      return;
    }

    if (user.role === 'PATIENT') {
      this.api.getPatientAppointments(user.id).subscribe({ next: (items) => (this.appointments = items ?? []), error: () => (this.appointments = []) });
      this.api.getPatientPrescriptions(user.id).subscribe({ next: (items) => (this.prescriptions = items ?? []), error: () => (this.prescriptions = []) });
      this.api.getPatientLabResults(user.id).subscribe({ next: (items) => (this.labResults = items ?? []), error: () => (this.labResults = []) });
      this.loadEmergencies();
      return;
    }

    if (user.role === 'DOCTOR') {
      this.api.getDoctorAppointments(user.id).subscribe({ next: (items) => (this.appointments = items ?? []), error: () => (this.appointments = []) });
      this.api.getDoctorPrescriptions(user.id).subscribe({ next: (items) => (this.prescriptions = items ?? []), error: () => (this.prescriptions = []) });
      this.api.getDoctorLabResults(user.id).subscribe({ next: (items) => (this.labResults = items ?? []), error: () => (this.labResults = []) });
      this.loadEmergencies();
      return;
    }

    this.appointments = [];
    this.prescriptions = [];
    this.activeEmergencies = [];
    this.labResults = [];
  }

  loadEmergencies(): void {
    const user = this.auth.currentUser;

    if (!this.canUseEmergency() || !user?.id) {
      this.activeEmergencies = [];
      return;
    }

    const request = user.role === 'PATIENT'
      ? this.api.getPatientEmergencies(user.id)
      : this.api.getActiveEmergencies();

    request.subscribe({
      next: (alerts) => {
        this.activeEmergencies = (alerts ?? []).filter((alert) =>
          ['ACTIVE', 'IN_PROGRESS'].includes(alert.status ?? 'ACTIVE'),
        );
      },
      error: () => {
        this.activeEmergencies = [];
      },
    });
  }

  roleConfig(): RoleConfig {
    const role = this.auth.currentUser?.role;

    if (role === 'ADMIN') {
      return {
        eyebrow: 'Administration',
        title: 'Hospital operations center',
        subtitle: 'Manage accounts, medical profiles, appointments and urgent care activity from one place.',
        actions: [
          { icon: '⚙', label: 'Create account', help: 'Create role-specific logins', path: '/app/accounts' },
          { icon: '👥', label: 'Create patient', help: 'Add a patient profile', path: '/app/patients' },
          { icon: '🩺', label: 'Add doctor', help: 'Manage care teams', path: '/app/doctors' },
          { icon: '📅', label: 'Schedule visit', help: 'Book an appointment', path: '/app/appointments' },
          { icon: '🧾', label: 'Audit trail', help: 'Review logged actions', path: '/app/audit-logs' },
        ],
      };
    }

    if (role === 'DOCTOR') {
      return {
        eyebrow: 'Doctor workspace',
        title: 'Your clinical day',
        subtitle: 'Follow assigned visits, prescriptions, patient results and emergency alerts.',
        actions: [
          { icon: '📅', label: 'My schedule', help: 'Confirm or complete visits', path: '/app/appointments' },
          { icon: '👥', label: 'My patients', help: 'Patients linked to your appointments', path: '/app/patients' },
          { icon: 'Rx', label: 'Write prescription', help: 'Create a care plan', path: '/app/prescriptions' },
          { icon: '🚨', label: 'Alert center', help: 'Handle urgent incidents', path: '/app/emergencies' },
        ],
      };
    }

    if (role === 'PATIENT') {
      return {
        eyebrow: 'Patient portal',
        title: 'Your healthcare space',
        subtitle: 'Book appointments, review prescriptions, view lab results and request emergency help.',
        actions: [
          { icon: '🧍', label: 'My profile', help: 'Open your care record', path: '/app/my-profile' },
          { icon: '📅', label: 'Book appointment', help: 'Request a doctor visit', path: '/app/appointments' },
          { icon: 'Rx', label: 'My prescriptions', help: 'Review treatment plans', path: '/app/prescriptions' },
          { icon: '🧪', label: 'My results', help: 'View lab reports', path: '/app/lab-results' },
          { icon: '🚨', label: 'Emergency help', help: 'Create urgent alert', path: '/app/emergencies' },
        ],
      };
    }

    return {
      eyebrow: 'Laboratory',
      title: 'Diagnostic result entry',
      subtitle: 'Create lab result records and keep doctors informed about completed tests.',
      actions: [{ icon: '🧪', label: 'Add result', help: 'Create a lab record', path: '/app/lab-results' }],
    };
  }

  roleIcon(): string {
    const role = this.auth.currentUser?.role;

    if (role === 'ADMIN') return '⚙';
    if (role === 'DOCTOR') return '🩺';
    if (role === 'PATIENT') return '🧍';
    if (role === 'LAB_TECHNICIAN') return '🧪';

    return '✓';
  }

  canUseAppointments(): boolean {
    return this.auth.hasRole(['ADMIN', 'DOCTOR', 'PATIENT']);
  }

  canUseEmergency(): boolean {
    return this.auth.hasRole(['ADMIN', 'DOCTOR', 'PATIENT']);
  }

  canUsePrescriptions(): boolean {
    return this.auth.hasRole(['ADMIN', 'DOCTOR', 'PATIENT']);
  }

  appointmentSummary(): string {
    const pending = this.appointments.filter((appointment) => (appointment.status ?? 'PENDING') === 'PENDING').length;

    if (this.auth.hasRole(['PATIENT'])) return `${pending} waiting for confirmation.`;
    if (this.auth.hasRole(['DOCTOR'])) return `${pending} pending visits in your schedule.`;

    return `${pending} appointments still need action.`;
  }

  labResultSummary(): string {
    if (this.auth.hasRole(['LAB_TECHNICIAN'])) {
      return 'Create results here. Global lab result browsing is restricted by the backend.';
    }

    return 'Recent diagnostic information.';
  }

  appointmentLabel(appointment: Appointment): string {
    if (this.auth.hasRole(['PATIENT'])) {
      return `with Dr. ${appointment.doctor.firstName || 'Doctor'} ${appointment.doctor.lastName || ''}`;
    }

    if (this.auth.hasRole(['DOCTOR'])) {
      return `${appointment.patient.firstName || 'Patient'} ${appointment.patient.lastName || ''}`;
    }

    return `${appointment.patient.firstName || 'Patient'} with Dr. ${appointment.doctor.firstName || 'Doctor'}`;
  }

  sortedEmergencies(): EmergencyAlert[] {
    const rank: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

    return [...this.activeEmergencies].sort(
      (a, b) => (rank[a.severity ?? 'MEDIUM'] ?? 2) - (rank[b.severity ?? 'MEDIUM'] ?? 2),
    );
  }

  severityClass(severity?: string): string {
    return (severity ?? 'MEDIUM').toLowerCase();
  }

  statusClass(status?: string): string {
    return `status ${(status ?? 'PENDING').toLowerCase()}`;
  }

  formatDate(value?: string): string {
    return value ? value.replace('T', ' ').slice(0, 16) : '-';
  }
}
