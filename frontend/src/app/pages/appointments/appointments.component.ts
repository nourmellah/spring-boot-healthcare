import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { HealthcareApiService } from '../../core/services/healthcare-api.service';
import {
  Appointment,
  AppointmentStatus,
  ConsultationNote,
  Doctor,
  Medicine,
  Patient,
} from '../../models/healthcare.models';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">Scheduling</p>
        <h1>{{ title() }}</h1>
        <p>{{ subtitle() }}</p>
      </div>

      <div class="page-actions">
        <button class="ghost" type="button" (click)="reload()">Reload</button>
        @if (canCreate()) {
          <button class="primary" type="button" (click)="openCreate()">+ New appointment</button>
        }
      </div>
    </div>

    @if (message) {
      <div class="notice success">{{ message }}</div>
    }

    @if (error) {
      <div class="notice warning">{{ error }}</div>
    }

    <section class="appointment-summary-grid">
      @for (status of statuses; track status) {
        <article>
          <span [class]="statusClass(status)">{{ status }}</span>
          <strong>{{ countByStatus(status) }}</strong>
          <small>{{ statusText(status) }}</small>
        </article>
      }
    </section>

    <section class="panel app-card">
      <div class="toolbar">
        <div class="search-box">
          <span>⌕</span>
          <input placeholder="Search patient, doctor, reason or status" (input)="query = $any($event.target).value" />
        </div>
        <div class="meta-text">
          {{ filteredAppointments().length }} appointment{{ filteredAppointments().length === 1 ? '' : 's' }}
        </div>
      </div>

      @if (loading) {
        <div class="loading-row"><span class="spinner"></span> Loading appointments automatically...</div>
      } @else {
        <div class="appointment-board">
          @for (status of statuses; track status) {
            <section class="board-column">
              <header>
                <span [class]="statusClass(status)">{{ status }}</span>
                <strong>{{ appointmentsByStatus(status).length }}</strong>
              </header>

              <div class="board-card-list">
                @for (appointment of appointmentsByStatus(status); track appointment.id) {
                  <article class="appointment-card">
                    <div class="appointment-time">
                      <span>📅</span>
                      <strong>{{ formatDate(appointment.appointmentDate) }}</strong>
                    </div>

                    <h3>{{ patientName(appointment) }}</h3>
                    <p>{{ doctorName(appointment) }}</p>

                    <div class="card-tags">
                      <span>{{ appointment.reason || 'Consultation' }}</span>
                      @if (appointment.notes) {
                        <span>{{ appointment.notes }}</span>
                      }
                    </div>

                    <footer>
                      <button class="tiny" type="button" (click)="openVisit(appointment)">
                        {{ canClinicalActions() ? 'Open visit' : 'View details' }}
                      </button>

                      @if (canUpdateStatus()) {
                        @if (appointment.status !== 'CONFIRMED') {
                          <button class="tiny" type="button" (click)="setStatus(appointment, 'CONFIRMED')">Confirm</button>
                        }
                        @if (appointment.status !== 'COMPLETED') {
                          <button class="secondary tiny" type="button" (click)="setStatus(appointment, 'COMPLETED')">Complete</button>
                        }
                        @if (appointment.status !== 'CANCELLED') {
                          <button class="danger tiny" type="button" (click)="setStatus(appointment, 'CANCELLED')">Cancel</button>
                        }
                      }
                    </footer>
                  </article>
                } @empty {
                  <div class="empty-state tiny-state">
                    <span>·</span>
                    <strong>No {{ status.toLowerCase() }}</strong>
                  </div>
                }
              </div>
            </section>
          }
        </div>
      }
    </section>

    @if (showModal) {
      <div class="modal-backdrop" (click)="closeModal()">
        <section class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div>
              <h2>New appointment</h2>
              <p>{{ auth.hasRole(['PATIENT']) ? 'Choose a doctor and a visit time.' : 'Choose a patient, doctor and visit time.' }}</p>
            </div>
            <button class="icon-button" type="button" (click)="closeModal()">×</button>
          </header>

          <form class="modal-body grid-form" [formGroup]="form" (ngSubmit)="create()">
            @if (!auth.hasRole(['PATIENT'])) {
              <label>
                Patient
                <select formControlName="patientId">
                  <option value="">Select patient</option>
                  @for (patient of patients; track patient.id) {
                    <option [value]="patient.id">{{ patient.firstName }} {{ patient.lastName }}</option>
                  }
                </select>
              </label>
            }

            <label>
              Doctor
              <select formControlName="doctorId">
                <option value="">Select doctor</option>
                @for (doctor of doctors; track doctor.id) {
                  <option [value]="doctor.id">Dr. {{ doctor.firstName }} {{ doctor.lastName }}</option>
                }
              </select>
            </label>

            <label>Appointment date <input type="datetime-local" formControlName="appointmentDate" /></label>
            <label class="wide">Reason <textarea rows="3" formControlName="reason"></textarea></label>
            <label class="wide">Notes <textarea rows="3" formControlName="notes"></textarea></label>

            <div class="modal-footer wide">
              <button class="ghost" type="button" (click)="closeModal()">Cancel</button>
              <button class="primary" type="submit" [disabled]="form.invalid || saving">
                {{ saving ? 'Saving...' : 'Create appointment' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }

    @if (showVisitModal && selectedAppointment) {
      <div class="modal-backdrop" (click)="closeVisit()">
        <section class="modal visit-modal large-modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div>
              <h2>{{ patientName(selectedAppointment) }}</h2>
              <p>{{ doctorName(selectedAppointment) }} · {{ formatDate(selectedAppointment.appointmentDate) }}</p>
            </div>
            <button class="icon-button" type="button" (click)="closeVisit()">×</button>
          </header>

          <div class="modal-body visit-workflow">
            <section class="visit-summary-grid">
              <article>
                <span [class]="statusClass(selectedAppointment.status)">{{ selectedAppointment.status || 'PENDING' }}</span>
                <strong>Visit status</strong>
                <small>{{ selectedAppointment.reason || 'Consultation' }}</small>
              </article>
              <article>
                <span>👤</span>
                <strong>{{ patientName(selectedAppointment) }}</strong>
                <small>Patient record</small>
              </article>
              <article>
                <span>🩺</span>
                <strong>{{ doctorName(selectedAppointment) }}</strong>
                <small>Assigned doctor</small>
              </article>
            </section>

            <div class="visit-actions-bar">
              @if (selectedAppointment.patient.id) {
                <a class="tiny" [routerLink]="['/app/patients', selectedAppointment.patient.id]">Open patient profile</a>
              }
              @if (canUpdateStatus()) {
                <button class="tiny" type="button" (click)="setStatus(selectedAppointment, 'CONFIRMED')">Confirm</button>
                <button class="secondary tiny" type="button" (click)="setStatus(selectedAppointment, 'COMPLETED')">Mark completed</button>
                <button class="danger tiny" type="button" (click)="setStatus(selectedAppointment, 'CANCELLED')">Cancel</button>
              }
            </div>

            @if (visitMessage) {
              <div class="notice success">{{ visitMessage }}</div>
            }

            @if (visitError) {
              <div class="notice warning">{{ visitError }}</div>
            }

            @if (canClinicalActions()) {
              <section class="visit-workflow-grid">
                <article class="panel workflow-card">
                  <div class="section-heading">
                    <div>
                      <p class="eyebrow">Step 1</p>
                      <h2>Consultation note</h2>
                    </div>
                    @if (consultationNote) {
                      <span class="status completed">Saved</span>
                    }
                  </div>

                  <form class="grid-form" [formGroup]="noteForm" (ngSubmit)="saveNote()">
                    <label class="wide">Chief complaint <textarea rows="2" formControlName="chiefComplaint"></textarea></label>
                    <label class="wide">Symptoms <textarea rows="2" formControlName="symptoms"></textarea></label>
                    <label class="wide">Examination <textarea rows="2" formControlName="examination"></textarea></label>
                    <label class="wide">Diagnosis <textarea rows="2" formControlName="diagnosis"></textarea></label>
                    <label class="wide">Treatment plan <textarea rows="2" formControlName="treatment"></textarea></label>
                    <label class="wide">Follow-up <textarea rows="2" formControlName="followUp"></textarea></label>
                    <div class="modal-footer wide">
                      <button class="primary" type="submit" [disabled]="noteForm.invalid || savingNote">
                        {{ savingNote ? 'Saving...' : consultationNote ? 'Update note' : 'Save note' }}
                      </button>
                    </div>
                  </form>
                </article>

                <article class="panel workflow-card">
                  <div class="section-heading">
                    <div>
                      <p class="eyebrow">Step 2</p>
                      <h2>Record vitals</h2>
                    </div>
                  </div>

                  <form class="grid-form" [formGroup]="vitalForm" (ngSubmit)="recordVitals()">
                    <label>Blood pressure <input formControlName="bloodPressure" placeholder="120/80" /></label>
                    <label>Heart rate <input type="number" formControlName="heartRate" /></label>
                    <label>Temperature <input type="number" step="0.1" formControlName="temperature" /></label>
                    <label>SpO₂ <input type="number" formControlName="oxygenSaturation" /></label>
                    <label>Weight <input type="number" step="0.1" formControlName="weight" /></label>
                    <label>Height <input type="number" step="0.1" formControlName="height" /></label>
                    <label class="wide">Notes <textarea rows="2" formControlName="notes"></textarea></label>
                    <div class="modal-footer wide">
                      <button class="primary" type="submit" [disabled]="vitalForm.invalid || savingVitals">
                        {{ savingVitals ? 'Saving...' : 'Record vitals' }}
                      </button>
                    </div>
                  </form>
                </article>

                <article class="panel workflow-card wide-workflow-card">
                  <div class="section-heading">
                    <div>
                      <p class="eyebrow">Step 3</p>
                      <h2>Create prescription with medication</h2>
                    </div>
                  </div>

                  <form class="grid-form" [formGroup]="prescriptionForm" (ngSubmit)="createPrescriptionFromVisit()">
                    <label>Diagnosis <input formControlName="diagnosis" /></label>
                    <label>Valid until <input type="date" formControlName="validUntil" /></label>
                    <label class="wide">Instructions <textarea rows="2" formControlName="instructions"></textarea></label>

                    <label>
                      Medicine
                      <select formControlName="medicineId">
                        <option value="">No medicine selected</option>
                        @for (medicine of medicines; track medicine.id) {
                          <option [value]="medicine.id">{{ medicine.name }}</option>
                        }
                      </select>
                    </label>
                    <label>Dosage <input formControlName="dosage" placeholder="500mg" /></label>
                    <label>Frequency <input formControlName="frequency" placeholder="Twice daily" /></label>
                    <label>Duration / days <input type="number" formControlName="duration" /></label>
                    <label>Quantity <input type="number" formControlName="quantity" /></label>
                    <label class="wide">Medicine instructions <textarea rows="2" formControlName="medicineInstructions"></textarea></label>

                    <div class="modal-footer wide">
                      <button class="primary" type="submit" [disabled]="prescriptionForm.invalid || savingPrescription">
                        {{ savingPrescription ? 'Saving...' : 'Create prescription' }}
                      </button>
                    </div>
                  </form>
                </article>
              </section>
            } @else {
              <section class="panel workflow-card">
                <p class="eyebrow">Visit information</p>
                <h2>{{ selectedAppointment.reason || 'Consultation' }}</h2>
                <p class="empty">{{ selectedAppointment.notes || 'No additional visit notes yet.' }}</p>
                @if (consultationNote) {
                  <div class="profile-text-block">
                    <strong>Doctor note:</strong>
                    <p>{{ consultationNote.diagnosis || consultationNote.treatment || consultationNote.followUp || 'Clinical note saved.' }}</p>
                  </div>
                }
              </section>
            }
          </div>
        </section>
      </div>
    }
  `,
})
export class AppointmentsComponent implements OnInit {
  readonly auth = inject(AuthService);

  private readonly api = inject(HealthcareApiService);
  private readonly fb = inject(FormBuilder);

  readonly statuses: AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

  appointments: Appointment[] = [];
  patients: Patient[] = [];
  doctors: Doctor[] = [];
  medicines: Medicine[] = [];
  query = '';
  loading = false;
  saving = false;
  showModal = false;
  error = '';
  message = '';

  selectedAppointment?: Appointment;
  consultationNote?: ConsultationNote;
  showVisitModal = false;
  savingNote = false;
  savingVitals = false;
  savingPrescription = false;
  visitMessage = '';
  visitError = '';

  readonly form = this.fb.nonNullable.group({
    patientId: [''],
    doctorId: ['', Validators.required],
    appointmentDate: ['', Validators.required],
    reason: [''],
    notes: [''],
  });

  readonly noteForm = this.fb.nonNullable.group({
    chiefComplaint: ['', Validators.required],
    symptoms: [''],
    examination: [''],
    diagnosis: [''],
    treatment: [''],
    followUp: [''],
  });

  readonly vitalForm = this.fb.nonNullable.group({
    bloodPressure: [''],
    heartRate: [72, Validators.required],
    temperature: [36.8, Validators.required],
    oxygenSaturation: [98],
    weight: [70],
    height: [170],
    notes: [''],
  });

  readonly prescriptionForm = this.fb.nonNullable.group({
    diagnosis: ['', Validators.required],
    instructions: ['', Validators.required],
    validUntil: ['', Validators.required],
    medicineId: [''],
    dosage: [''],
    frequency: [''],
    duration: [7],
    quantity: [1],
    medicineInstructions: [''],
  });

  ngOnInit(): void {
    this.reload();
    this.loadFormOptions();
  }

  loadFormOptions(): void {
    if (!this.auth.hasRole(['PATIENT'])) {
      this.api.getPatients().subscribe({ next: (patients) => (this.patients = patients ?? []) });
    }

    this.api.getDoctors().subscribe({ next: (doctors) => (this.doctors = doctors ?? []) });
    this.api.getAvailableMedicines().pipe(catchError(() => of([] as Medicine[]))).subscribe({
      next: (medicines) => (this.medicines = medicines ?? []),
    });
  }

  title(): string {
    const role = this.auth.currentUser?.role;

    if (role === 'PATIENT') return 'My appointments';
    if (role === 'DOCTOR') return 'My clinical schedule';

    return 'Appointment board';
  }

  subtitle(): string {
    const role = this.auth.currentUser?.role;

    if (role === 'PATIENT') return 'Book visits and follow the status of your upcoming care.';
    if (role === 'DOCTOR') return 'Review assigned visits and complete consultation workflows.';

    return 'Schedule patient visits and monitor appointment progress by status.';
  }

  canCreate(): boolean {
    return this.auth.hasRole(['ADMIN', 'PATIENT']);
  }

  canUpdateStatus(): boolean {
    return this.auth.hasRole(['ADMIN', 'DOCTOR']);
  }

  canClinicalActions(): boolean {
    return this.auth.hasRole(['ADMIN', 'DOCTOR']);
  }

  reload(): void {
    const user = this.auth.currentUser;

    if (!user?.id) return;

    this.loading = true;
    this.error = '';

    const request = user.role === 'PATIENT'
      ? this.api.getPatientAppointments(user.id)
      : user.role === 'DOCTOR'
        ? this.api.getDoctorAppointments(user.id)
        : this.api.getAppointments();

    request.subscribe({
      next: (appointments) => {
        this.appointments = appointments ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load appointments.';
        this.loading = false;
      },
    });
  }

  filteredAppointments(): Appointment[] {
    const query = this.query.trim().toLowerCase();

    if (!query) return this.appointments;

    return this.appointments.filter((appointment) =>
      `${this.patientName(appointment)} ${this.doctorName(appointment)} ${appointment.reason ?? ''} ${appointment.notes ?? ''} ${appointment.status ?? ''}`
        .toLowerCase()
        .includes(query),
    );
  }

  appointmentsByStatus(status: AppointmentStatus): Appointment[] {
    return this.filteredAppointments().filter((appointment) => (appointment.status ?? 'PENDING') === status);
  }

  countByStatus(status: AppointmentStatus): number {
    return this.appointments.filter((appointment) => (appointment.status ?? 'PENDING') === status).length;
  }

  statusText(status: AppointmentStatus): string {
    return {
      PENDING: 'Needs confirmation',
      CONFIRMED: 'Ready for visit',
      COMPLETED: 'Closed visits',
      CANCELLED: 'Cancelled visits',
    }[status];
  }

  openCreate(): void {
    this.form.reset({
      patientId: '',
      doctorId: '',
      appointmentDate: '',
      reason: '',
      notes: '',
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

    this.api.createAppointment({
      patient: { id: patientId },
      doctor: { id: Number(raw.doctorId) },
      appointmentDate: raw.appointmentDate,
      reason: raw.reason,
      notes: raw.notes,
      status: 'PENDING',
    }).subscribe({
      next: () => {
        this.message = 'Appointment created successfully.';
        this.closeModal();
        this.reload();
      },
      error: (error) => {
        this.error = error.error?.message || error.error?.error || 'Could not create appointment.';
        this.saving = false;
      },
    });
  }

  openVisit(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.consultationNote = undefined;
    this.visitMessage = '';
    this.visitError = '';
    this.showVisitModal = true;

    this.noteForm.reset({
      chiefComplaint: appointment.reason || '',
      symptoms: '',
      examination: '',
      diagnosis: '',
      treatment: '',
      followUp: '',
    });

    this.vitalForm.reset({
      bloodPressure: '',
      heartRate: 72,
      temperature: 36.8,
      oxygenSaturation: 98,
      weight: 70,
      height: 170,
      notes: '',
    });

    this.prescriptionForm.reset({
      diagnosis: '',
      instructions: '',
      validUntil: this.defaultValidUntil(),
      medicineId: '',
      dosage: '',
      frequency: '',
      duration: 7,
      quantity: 1,
      medicineInstructions: '',
    });

    if (appointment.id) {
      this.api.getAppointmentConsultationNote(appointment.id).pipe(catchError(() => of(undefined))).subscribe({
        next: (note) => {
          if (!note) return;

          this.consultationNote = note;
          this.noteForm.patchValue({
            chiefComplaint: note.chiefComplaint || appointment.reason || '',
            symptoms: note.symptoms || '',
            examination: note.examination || '',
            diagnosis: note.diagnosis || '',
            treatment: note.treatment || '',
            followUp: note.followUp || '',
          });
          this.prescriptionForm.patchValue({
            diagnosis: note.diagnosis || '',
            instructions: note.treatment || note.followUp || '',
          });
        },
      });
    }
  }

  closeVisit(): void {
    this.showVisitModal = false;
    this.selectedAppointment = undefined;
    this.consultationNote = undefined;
    this.savingNote = false;
    this.savingVitals = false;
    this.savingPrescription = false;
  }

  saveNote(): void {
    if (!this.selectedAppointment?.id || !this.selectedAppointment.doctor.id || this.noteForm.invalid) return;

    const raw = this.noteForm.getRawValue();
    const payload: Partial<ConsultationNote> = {
      appointment: { id: this.selectedAppointment.id },
      doctor: { id: this.selectedAppointment.doctor.id },
      chiefComplaint: raw.chiefComplaint,
      symptoms: raw.symptoms,
      examination: raw.examination,
      diagnosis: raw.diagnosis,
      treatment: raw.treatment,
      followUp: raw.followUp,
    };

    this.savingNote = true;
    const request = this.consultationNote?.id
      ? this.api.updateConsultationNote(this.consultationNote.id, payload)
      : this.api.saveConsultationNote(payload);

    request.subscribe({
      next: (note) => {
        this.consultationNote = note;
        this.savingNote = false;
        this.visitMessage = 'Consultation note saved.';
        this.prescriptionForm.patchValue({
          diagnosis: note.diagnosis || this.prescriptionForm.value.diagnosis || '',
          instructions: note.treatment || note.followUp || this.prescriptionForm.value.instructions || '',
        });
      },
      error: (error) => {
        this.savingNote = false;
        this.visitError = error.error?.message || error.error?.error || 'Could not save consultation note.';
      },
    });
  }

  recordVitals(): void {
    if (!this.selectedAppointment?.patient.id || this.vitalForm.invalid) return;

    const raw = this.vitalForm.getRawValue();

    this.savingVitals = true;
    this.api.createVitalSign({
      patient: { id: this.selectedAppointment.patient.id },
      bloodPressure: raw.bloodPressure,
      heartRate: Number(raw.heartRate),
      temperature: Number(raw.temperature),
      oxygenSaturation: Number(raw.oxygenSaturation),
      weight: Number(raw.weight),
      height: Number(raw.height),
      notes: raw.notes,
      recordedBy: this.auth.currentUser?.id,
    }).subscribe({
      next: () => {
        this.savingVitals = false;
        this.visitMessage = 'Vital signs recorded.';
      },
      error: (error) => {
        this.savingVitals = false;
        this.visitError = error.error?.message || error.error?.error || 'Could not record vital signs.';
      },
    });
  }

  createPrescriptionFromVisit(): void {
    if (!this.selectedAppointment?.id || !this.selectedAppointment.patient.id || !this.selectedAppointment.doctor.id) return;
    if (this.prescriptionForm.invalid) return;

    const raw = this.prescriptionForm.getRawValue();
    this.savingPrescription = true;

    this.api.createPrescription({
      patient: { id: this.selectedAppointment.patient.id },
      doctor: { id: this.selectedAppointment.doctor.id },
      appointment: { id: this.selectedAppointment.id },
      diagnosis: raw.diagnosis,
      instructions: raw.instructions,
      validUntil: raw.validUntil,
    }).subscribe({
      next: (prescription) => {
        const medicineId = Number(raw.medicineId);

        if (!prescription.id || !medicineId) {
          this.finishPrescriptionCreation('Prescription created.');
          return;
        }

        this.api.addMedicineToPrescription(prescription.id, {
          medicine: { id: medicineId },
          dosage: raw.dosage || 'As prescribed',
          frequency: raw.frequency || 'As needed',
          duration: Number(raw.duration) || 1,
          quantity: Number(raw.quantity) || 1,
          instructions: raw.medicineInstructions,
        }).subscribe({
          next: () => this.finishPrescriptionCreation('Prescription and medicine plan created.'),
          error: () => this.finishPrescriptionCreation('Prescription created, but medicine line was not attached.'),
        });
      },
      error: (error) => {
        this.savingPrescription = false;
        this.visitError = error.error?.message || error.error?.error || 'Could not create prescription.';
      },
    });
  }

  private finishPrescriptionCreation(message: string): void {
    this.savingPrescription = false;
    this.visitMessage = message;
    this.prescriptionForm.patchValue({
      diagnosis: '',
      instructions: '',
      medicineId: '',
      dosage: '',
      frequency: '',
      medicineInstructions: '',
    });
  }

  setStatus(appointment: Appointment, status: AppointmentStatus): void {
    if (!appointment.id) return;

    this.api.updateAppointmentStatus(appointment.id, status).subscribe({
      next: (updated) => {
        appointment.status = updated.status ?? status;
        const selectedAppointment = this.selectedAppointment;
        if (selectedAppointment && selectedAppointment.id === appointment.id) {
          selectedAppointment.status = updated.status ?? status;
          this.selectedAppointment = selectedAppointment;
        }
        this.message = `Appointment marked as ${status}.`;
        this.reload();
      },
      error: () => {
        this.error = 'Could not update appointment status.';
      },
    });
  }

  patientName(appointment: Appointment): string {
    const name = `${appointment.patient.firstName ?? ''} ${appointment.patient.lastName ?? ''}`.trim();
    return name || `Patient #${appointment.patient.id ?? '-'}`;
  }

  doctorName(appointment: Appointment): string {
    const name = `${appointment.doctor.firstName ?? ''} ${appointment.doctor.lastName ?? ''}`.trim();
    return name ? `Dr. ${name}` : `Doctor #${appointment.doctor.id ?? '-'}`;
  }

  statusClass(status?: AppointmentStatus): string {
    return `status ${(status ?? 'PENDING').toLowerCase()}`;
  }

  formatDate(value?: string): string {
    return value ? value.replace('T', ' ').slice(0, 16) : '-';
  }

  private defaultValidUntil(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 10);
  }
}
