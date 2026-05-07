import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { HealthcareApiService } from '../../core/services/healthcare-api.service';
import {
  Appointment,
  ConsultationNote,
  EmergencyAlert,
  LabResult,
  Patient,
  Prescription,
  PrescriptionMedicine,
  VitalSign,
} from '../../models/healthcare.models';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">Care record</p>
        <h1>{{ patient ? patient.firstName + ' ' + patient.lastName : 'Patient profile' }}</h1>
        <p>Clinical overview with visits, medication, diagnostics, vitals and emergency history.</p>
      </div>

      <div class="page-actions">
        <a class="ghost" [routerLink]="backLink()">Back</a>
        <button class="ghost" type="button" (click)="reload()">Reload</button>
      </div>
    </div>

    @if (error) {
      <div class="notice warning">{{ error }}</div>
    }

    @if (loading) {
      <div class="panel app-card loading-row"><span class="spinner"></span> Loading patient care profile...</div>
    } @else if (patient) {
      <section class="patient-profile-hero">
        <div class="profile-main-card">
          <div class="profile-avatar">{{ initials(patient) }}</div>
          <div>
            <p class="eyebrow">Patient identity</p>
            <h2>{{ patient.firstName }} {{ patient.lastName }}</h2>
            <p>{{ patient.email }} · {{ patient.phone || 'No phone' }}</p>
            <div class="profile-tags">
              <span>{{ patient.bloodGroup || 'Blood group N/A' }}</span>
              <span>{{ patient.gender || 'Gender N/A' }}</span>
              <span>{{ patient.dateOfBirth || 'Birth date N/A' }}</span>
              <span [class.inactive]="patient.active === false" class="status">
                {{ patient.active === false ? 'Inactive' : 'Active' }}
              </span>
            </div>
          </div>
        </div>

        <article>
          <span>📅</span>
          <strong>{{ appointments.length }}</strong>
          <small>Appointments</small>
        </article>
        <article>
          <span>Rx</span>
          <strong>{{ prescriptions.length }}</strong>
          <small>Prescriptions</small>
        </article>
        <article>
          <span>🧪</span>
          <strong>{{ labResults.length }}</strong>
          <small>Lab results</small>
        </article>
        <article>
          <span>♡</span>
          <strong>{{ vitalSigns.length }}</strong>
          <small>Vital records</small>
        </article>
      </section>

      <section class="profile-grid-layout">
        <article class="panel app-card profile-section-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Medical history</p>
              <h2>Background notes</h2>
            </div>
          </div>
          <p class="profile-text-block">{{ patient.medicalHistory || medicalHistory || 'No medical history notes were added yet.' }}</p>

          <div class="profile-info-grid">
            <div>
              <small>Address</small>
              <strong>{{ patient.address || '-' }}</strong>
            </div>
            <div>
              <small>Emergency contact</small>
              <strong>{{ patient.emergencyContactName || '-' }}</strong>
              <p>{{ patient.emergencyContact || '-' }}</p>
            </div>
          </div>
        </article>

        <article class="panel app-card profile-section-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Latest vitals</p>
              <h2>Current clinical indicators</h2>
            </div>
            <a class="tiny" routerLink="/app/vital-signs">Open vitals</a>
          </div>

          @if (latestVital(); as vital) {
            <div class="vital-values profile-vitals">
              <div><small>BP</small><strong>{{ vital.bloodPressure || '-' }}</strong></div>
              <div><small>HR</small><strong>{{ vital.heartRate || '-' }}</strong></div>
              <div><small>Temp</small><strong>{{ vital.temperature || '-' }}</strong></div>
              <div><small>SpO₂</small><strong>{{ vital.oxygenSaturation || '-' }}</strong></div>
            </div>
          } @else {
            <p class="empty compact">No vital sign records yet.</p>
          }
        </article>
      </section>

      <section class="profile-grid-layout two-column-profile">
        <article class="panel app-card profile-section-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Appointments</p>
              <h2>Care timeline</h2>
            </div>
            <a class="tiny" routerLink="/app/appointments">Open schedule</a>
          </div>

          <div class="profile-feed-list">
            @for (appointment of appointments.slice(0, 5); track appointment.id) {
              <div class="profile-feed-item">
                <span>📅</span>
                <div>
                  <strong>{{ appointment.appointmentDate || '-' }}</strong>
                  <p>{{ appointment.reason || 'Appointment' }}</p>
                  <small>{{ appointment.status || 'PENDING' }} · {{ doctorName(appointment) }}</small>
                  @if (appointment.id && matchingConsultationNote(appointment.id)) {
                    <em class="visit-note-chip">Consultation note saved</em>
                  }
                </div>
              </div>
            } @empty {
              <p class="empty compact">No appointments found.</p>
            }
          </div>
        </article>

        <article class="panel app-card profile-section-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Prescriptions</p>
              <h2>Medication plans</h2>
            </div>
            <a class="tiny" routerLink="/app/prescriptions">Open prescriptions</a>
          </div>

          <div class="profile-feed-list">
            @for (prescription of prescriptions.slice(0, 5); track prescription.id) {
              <div class="profile-feed-item prescription-feed-item">
                <span>Rx</span>
                <div>
                  <strong>{{ prescription.diagnosis || 'Prescription' }}</strong>
                  <p>{{ prescription.instructions || 'No instructions added.' }}</p>
                  <small>{{ doctorNameFromPrescription(prescription) }} · Valid until {{ prescription.validUntil || '-' }}</small>

                  @if (prescription.medicines?.length) {
                    <div class="mini-medicine-tags">
                      @for (medicine of prescription.medicines || []; track medicine.id) {
                        <em>{{ medicine.medicine.name || 'Medicine' }}</em>
                      }
                    </div>
                  }
                </div>
              </div>
            } @empty {
              <p class="empty compact">No prescriptions found.</p>
            }
          </div>
        </article>
      </section>

      <section class="panel app-card profile-section-card profile-full-width-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Consultation notes</p>
            <h2>Doctor visit summaries</h2>
          </div>
          <a class="tiny" routerLink="/app/appointments">Open appointments</a>
        </div>

        <div class="profile-feed-list consultation-note-list">
          @for (note of consultationNotes.slice(0, 6); track note.id) {
            <div class="profile-feed-item consultation-note-item">
              <span>📝</span>
              <div>
                <strong>{{ note.diagnosis || note.chiefComplaint || 'Consultation note' }}</strong>
                <p>{{ note.treatment || note.examination || note.symptoms || 'Clinical note saved.' }}</p>
                @if (note.followUp) {
                  <small>Follow-up: {{ note.followUp }}</small>
                } @else {
                  <small>{{ note.createdAt || 'No date' }}</small>
                }
              </div>
            </div>
          } @empty {
            <p class="empty compact">No consultation notes found.</p>
          }
        </div>
      </section>

      <section class="profile-grid-layout two-column-profile">
        <article class="panel app-card profile-section-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Diagnostics</p>
              <h2>Lab results</h2>
            </div>
            <a class="tiny" routerLink="/app/lab-results">Open lab results</a>
          </div>

          <div class="profile-feed-list">
            @for (result of labResults.slice(0, 5); track result.id) {
              <div class="profile-feed-item">
                <span>🧪</span>
                <div>
                  <strong>{{ result.testName }}</strong>
                  <p>{{ result.results || result.remarks || 'No details added.' }}</p>
                  <small>{{ result.status || 'PENDING' }} · {{ result.testDate || result.createdAt || '-' }}</small>
                </div>
              </div>
            } @empty {
              <p class="empty compact">No lab results found.</p>
            }
          </div>
        </article>

        <article class="panel app-card profile-section-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Emergency history</p>
              <h2>Alerts</h2>
            </div>
            <a class="tiny" routerLink="/app/emergencies">Open alerts</a>
          </div>

          <div class="profile-feed-list">
            @for (alert of emergencies.slice(0, 5); track alert.id) {
              <div class="profile-feed-item emergency-profile-item">
                <span>🚨</span>
                <div>
                  <strong>{{ alert.severity || 'MEDIUM' }} · {{ alert.status || 'ACTIVE' }}</strong>
                  <p>{{ alert.description || 'Emergency alert' }}</p>
                  <small>{{ alert.location || 'No location' }} · {{ alert.createdAt || '-' }}</small>
                </div>
              </div>
            } @empty {
              <p class="empty compact">No emergency alerts found.</p>
            }
          </div>
        </article>
      </section>
    }
  `,
})
export class PatientProfileComponent implements OnInit {
  readonly auth = inject(AuthService);

  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(HealthcareApiService);

  patient?: Patient;
  medicalHistory = '';
  appointments: Appointment[] = [];
  prescriptions: Prescription[] = [];
  labResults: LabResult[] = [];
  vitalSigns: VitalSign[] = [];
  emergencies: EmergencyAlert[] = [];
  consultationNotes: ConsultationNote[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    const patientId = this.resolvePatientId();

    if (!patientId) {
      this.error = 'Could not identify patient profile.';
      return;
    }

    this.loading = true;
    this.error = '';

    forkJoin({
      patient: this.api.getPatient(patientId).pipe(catchError(() => of(undefined))),
      history: this.api.getPatientMedicalHistory(patientId).pipe(catchError(() => of(''))),
      appointments: this.api.getPatientAppointments(patientId).pipe(catchError(() => of([] as Appointment[]))),
      prescriptions: this.api.getPatientPrescriptions(patientId).pipe(catchError(() => of([] as Prescription[]))),
      labResults: this.api.getPatientLabResults(patientId).pipe(catchError(() => of([] as LabResult[]))),
      vitalSigns: this.api.getPatientVitalSigns(patientId).pipe(catchError(() => of([] as VitalSign[]))),
      emergencies: this.api.getPatientEmergencies(patientId).pipe(catchError(() => of([] as EmergencyAlert[]))),
      consultationNotes: this.api.getPatientConsultationNotes(patientId).pipe(catchError(() => of([] as ConsultationNote[]))),
    }).subscribe((result) => {
      this.patient = result.patient;
      this.medicalHistory = result.history || '';
      this.appointments = result.appointments ?? [];
      this.labResults = result.labResults ?? [];
      this.vitalSigns = this.sortByDate(result.vitalSigns ?? [], (item) => item.recordedAt);
      this.emergencies = this.sortByDate(result.emergencies ?? [], (item) => item.createdAt);
      this.consultationNotes = this.sortByDate(result.consultationNotes ?? [], (item) => item.createdAt);
      this.attachMedicines(result.prescriptions ?? []);
    });
  }

  private resolvePatientId(): number | undefined {
    const routeId = Number(this.route.snapshot.paramMap.get('id'));

    if (Number.isFinite(routeId) && routeId > 0) return routeId;

    const user = this.auth.currentUser;
    return user?.role === 'PATIENT' ? user.id : undefined;
  }

  private attachMedicines(prescriptions: Prescription[]): void {
    if (!prescriptions.length) {
      this.prescriptions = [];
      this.loading = false;
      return;
    }

    forkJoin(
      prescriptions.map((prescription) => {
        if (!prescription.id) return of([] as PrescriptionMedicine[]);
        return this.api.getPrescriptionMedicines(prescription.id).pipe(catchError(() => of([] as PrescriptionMedicine[])));
      }),
    ).subscribe((medicineLists) => {
      this.prescriptions = prescriptions.map((prescription, index) => ({
        ...prescription,
        medicines: medicineLists[index] ?? [],
      }));
      this.loading = false;
    });
  }

  private sortByDate<T>(items: T[], getDate: (item: T) => string | undefined): T[] {
    return [...items].sort((a, b) => {
      const left = new Date(getDate(a) || '').getTime() || 0;
      const right = new Date(getDate(b) || '').getTime() || 0;
      return right - left;
    });
  }

  backLink(): string {
    return this.auth.hasRole(['PATIENT']) ? '/app/dashboard' : '/app/patients';
  }

  latestVital(): VitalSign | undefined {
    return this.vitalSigns[0];
  }

  initials(patient: Patient): string {
    return `${patient.firstName?.[0] ?? ''}${patient.lastName?.[0] ?? ''}`.toUpperCase() || 'PT';
  }

  doctorName(appointment: Appointment): string {
    const doctor = appointment.doctor;
    const name = `${doctor?.firstName ?? ''} ${doctor?.lastName ?? ''}`.trim();
    return name ? `Dr. ${name}` : `Doctor #${doctor?.id ?? '-'}`;
  }


  matchingConsultationNote(appointmentId: number): ConsultationNote | undefined {
    return this.consultationNotes.find((note) => note.appointment?.id === appointmentId);
  }

  doctorNameFromPrescription(prescription: Prescription): string {
    const doctor = prescription.doctor;
    const name = `${doctor?.firstName ?? ''} ${doctor?.lastName ?? ''}`.trim();
    return name ? `Dr. ${name}` : `Doctor #${doctor?.id ?? '-'}`;
  }
}
