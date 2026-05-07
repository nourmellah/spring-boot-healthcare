import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { HealthcareApiService } from '../../core/services/healthcare-api.service';
import {
  Doctor,
  Medicine,
  MedicineType,
  Patient,
  Prescription,
  PrescriptionMedicine,
} from '../../models/healthcare.models';

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <p class="eyebrow">Medication</p>
        <h1>{{ auth.hasRole(['PATIENT']) ? 'My prescriptions' : 'Prescription workspace' }}</h1>
        <p>{{ pageSubtitle() }}</p>
      </div>

      <div class="page-actions">
        <button class="ghost" type="button" (click)="reload()">Reload</button>
        @if (canCreate()) {
          <button class="primary" type="button" (click)="openCreate()">+ New prescription</button>
        }
      </div>
    </div>

    @if (error) {
      <div class="notice warning">{{ error }}</div>
    }

    @if (message) {
      <div class="notice success">{{ message }}</div>
    }

    <section class="directory-summary compact-summary">
      <article>
        <span>Rx</span>
        <div>
          <strong>{{ prescriptions.length }}</strong>
          <small>Total visible</small>
        </div>
      </article>
      <article>
        <span>✓</span>
        <div>
          <strong>{{ validCount() }}</strong>
          <small>Still valid</small>
        </div>
      </article>
      <article>
        <span>💊</span>
        <div>
          <strong>{{ medicationCount() }}</strong>
          <small>Medication lines</small>
        </div>
      </article>
    </section>

    <section class="panel app-card">
      <div class="toolbar">
        <div class="search-box">
          <span>⌕</span>
          <input
            placeholder="Search patient, doctor, diagnosis, instructions or medicine"
            (input)="query = $any($event.target).value"
          />
        </div>
        <div class="meta-text">
          {{ filteredPrescriptions().length }} prescription{{ filteredPrescriptions().length === 1 ? '' : 's' }}
        </div>
      </div>

      @if (loading) {
        <div class="loading-row"><span class="spinner"></span> Loading prescriptions automatically...</div>
      } @else {
        <div class="prescription-grid">
          @for (prescription of filteredPrescriptions(); track prescription.id) {
            <article class="prescription-card medicine-rich-card">
              <header>
                <div class="prescription-icon">Rx</div>
                <div>
                  <h3>{{ prescription.diagnosis || 'Prescription' }}</h3>
                  <p>{{ patientName(prescription) }}</p>
                </div>
                <span [class]="validityClass(prescription)">{{ validityText(prescription) }}</span>
              </header>

              <div class="prescription-detail-grid">
                <div>
                  <small>Doctor</small>
                  <strong>{{ doctorName(prescription) }}</strong>
                </div>
                <div>
                  <small>Valid until</small>
                  <strong>{{ prescription.validUntil || '-' }}</strong>
                </div>
                <div class="wide">
                  <small>Instructions</small>
                  <p>{{ prescription.instructions || 'No instructions added yet.' }}</p>
                </div>
              </div>

              <section class="medicine-list">
                <div class="medicine-list-header">
                  <strong>Medication plan</strong>
                  <span>{{ prescription.medicines?.length || 0 }} item{{ prescription.medicines?.length === 1 ? '' : 's' }}</span>
                </div>

                @for (item of prescription.medicines || []; track item.id) {
                  <div class="medicine-line">
                    <span>💊</span>
                    <div>
                      <strong>{{ item.medicine.name || 'Medicine' }}</strong>
                      <small>
                        {{ item.dosage }} · {{ item.frequency }} · {{ item.duration }} day{{ item.duration === 1 ? '' : 's' }}
                      </small>
                      @if (item.instructions) {
                        <p>{{ item.instructions }}</p>
                      }
                    </div>
                    <em>Qty {{ item.quantity }}</em>
                  </div>
                } @empty {
                  <p class="empty compact">No medicines attached yet.</p>
                }
              </section>

              @if (canCreate()) {
                <footer class="card-footer-actions">
                  <button class="tiny" type="button" (click)="openMedicineModal(prescription)">
                    + Add medication
                  </button>
                </footer>
              }
            </article>
          } @empty {
            <div class="empty-state">
              <span>Rx</span>
              <strong>No prescriptions found</strong>
              <p>{{ emptyText() }}</p>
            </div>
          }
        </div>
      }
    </section>

    @if (showCreateModal) {
      <div class="modal-backdrop" (click)="closeCreateModal()">
        <section class="modal large-modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div>
              <h2>Create prescription</h2>
              <p>Create a treatment plan and optionally attach the first medicine.</p>
            </div>
            <button class="icon-button" type="button" (click)="closeCreateModal()">×</button>
          </header>

          <form class="modal-body account-form-sections" [formGroup]="prescriptionForm" (ngSubmit)="createPrescription()">
            <section class="form-section grid-form">
              <h3 class="wide">Prescription details</h3>

              <label>
                Patient
                <select formControlName="patientId">
                  <option value="">Choose patient</option>
                  @for (patient of patients; track patient.id) {
                    <option [value]="patient.id">{{ patient.firstName }} {{ patient.lastName }}</option>
                  }
                </select>
              </label>

              @if (auth.hasRole(['ADMIN'])) {
                <label>
                  Doctor
                  <select formControlName="doctorId">
                    <option value="">Choose doctor</option>
                    @for (doctor of doctors; track doctor.id) {
                      <option [value]="doctor.id">Dr. {{ doctor.firstName }} {{ doctor.lastName }}</option>
                    }
                  </select>
                </label>
              }

              <label>Valid until <input type="date" formControlName="validUntil" /></label>
              <label class="wide">Diagnosis <textarea rows="3" formControlName="diagnosis"></textarea></label>
              <label class="wide">Instructions <textarea rows="3" formControlName="instructions"></textarea></label>
            </section>

            <section class="form-section grid-form" [formGroup]="medicineForm">
              <h3 class="wide">First medication item</h3>

              <label class="wide">
                Existing medicine
                <select formControlName="medicineId">
                  <option value="">Create or choose medicine</option>
                  @for (medicine of medicines; track medicine.id) {
                    <option [value]="medicine.id">{{ medicine.name }} · {{ medicine.type || 'OTHER' }}</option>
                  }
                </select>
              </label>

              <label>New medicine name <input formControlName="newMedicineName" placeholder="Paracetamol" /></label>
              <label>Manufacturer <input formControlName="manufacturer" placeholder="Generic" /></label>
              <label>
                Type
                <select formControlName="type">
                  @for (type of medicineTypes; track type) {
                    <option [value]="type">{{ type }}</option>
                  }
                </select>
              </label>
              <label>Dosage <input formControlName="dosage" placeholder="500mg" /></label>
              <label>Frequency <input formControlName="frequency" placeholder="Twice daily" /></label>
              <label>Duration in days <input type="number" min="1" formControlName="duration" /></label>
              <label>Quantity <input type="number" min="1" formControlName="quantity" /></label>
              <label class="wide">Medication instructions <textarea rows="2" formControlName="instructions"></textarea></label>
            </section>

            <div class="modal-footer">
              <span class="small-note">Leave medication fields empty if you only want to create the prescription record.</span>
              <span class="form-spacer"></span>
              <button class="ghost" type="button" (click)="closeCreateModal()">Cancel</button>
              <button class="primary" type="submit" [disabled]="prescriptionForm.invalid || saving">
                {{ saving ? 'Saving...' : 'Create prescription' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }

    @if (showMedicineModal) {
      <div class="modal-backdrop" (click)="closeMedicineModal()">
        <section class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div>
              <h2>Add medication</h2>
              <p>{{ selectedPrescription?.diagnosis || 'Prescription' }} · {{ patientName(selectedPrescription) }}</p>
            </div>
            <button class="icon-button" type="button" (click)="closeMedicineModal()">×</button>
          </header>

          <form class="modal-body grid-form" [formGroup]="medicineForm" (ngSubmit)="addMedicationToSelected()">
            <label class="wide">
              Existing medicine
              <select formControlName="medicineId">
                <option value="">Create or choose medicine</option>
                @for (medicine of medicines; track medicine.id) {
                  <option [value]="medicine.id">{{ medicine.name }} · {{ medicine.type || 'OTHER' }}</option>
                }
              </select>
            </label>

            <label>New medicine name <input formControlName="newMedicineName" placeholder="Ibuprofen" /></label>
            <label>Manufacturer <input formControlName="manufacturer" placeholder="Generic" /></label>
            <label>
              Type
              <select formControlName="type">
                @for (type of medicineTypes; track type) {
                  <option [value]="type">{{ type }}</option>
                }
              </select>
            </label>
            <label>Dosage <input formControlName="dosage" placeholder="200mg" /></label>
            <label>Frequency <input formControlName="frequency" placeholder="Once daily" /></label>
            <label>Duration in days <input type="number" min="1" formControlName="duration" /></label>
            <label>Quantity <input type="number" min="1" formControlName="quantity" /></label>
            <label class="wide">Instructions <textarea rows="3" formControlName="instructions"></textarea></label>

            <div class="modal-footer wide">
              <button class="ghost" type="button" (click)="closeMedicineModal()">Cancel</button>
              <button class="primary" type="submit" [disabled]="saving">
                {{ saving ? 'Saving...' : 'Add medication' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }
  `,
})
export class PrescriptionsComponent implements OnInit {
  readonly auth = inject(AuthService);

  private readonly api = inject(HealthcareApiService);
  private readonly fb = inject(FormBuilder);

  patients: Patient[] = [];
  doctors: Doctor[] = [];
  medicines: Medicine[] = [];
  prescriptions: Prescription[] = [];
  query = '';
  showCreateModal = false;
  showMedicineModal = false;
  selectedPrescription?: Prescription;
  saving = false;
  loading = false;
  error = '';
  message = '';

  readonly medicineTypes: MedicineType[] = [
    'TABLET',
    'CAPSULE',
    'SYRUP',
    'INJECTION',
    'CREAM',
    'DROPS',
    'INHALER',
    'OTHER',
  ];

  readonly prescriptionForm = this.fb.nonNullable.group({
    patientId: ['', Validators.required],
    doctorId: [''],
    diagnosis: [''],
    instructions: [''],
    validUntil: ['', Validators.required],
  });

  readonly medicineForm = this.fb.nonNullable.group({
    medicineId: [''],
    newMedicineName: [''],
    manufacturer: ['Generic'],
    type: ['TABLET' as MedicineType],
    dosage: [''],
    frequency: [''],
    duration: [7],
    quantity: [1],
    instructions: [''],
  });

  ngOnInit(): void {
    this.loadFormOptions();
    this.loadMedicines();
    this.reload();
  }

  canCreate(): boolean {
    return this.auth.hasRole(['ADMIN', 'DOCTOR']);
  }

  loadFormOptions(): void {
    const user = this.auth.currentUser;

    if (!this.canCreate() || !user?.id) return;

    if (user.role === 'ADMIN') {
      this.api.getPatients().subscribe({ next: (patients) => (this.patients = patients ?? []) });
      this.api.getDoctors().subscribe({ next: (doctors) => (this.doctors = doctors ?? []) });
      return;
    }

    this.api
      .getDoctorAppointments(user.id)
      .pipe(catchError(() => of([])))
      .subscribe((appointments) => {
        const seen = new Set<number>();
        this.patients = appointments
          .map((appointment) => appointment.patient as Patient)
          .filter((patient) => {
            if (!patient.id || seen.has(patient.id)) return false;
            seen.add(patient.id);
            return true;
          });
      });
  }

  loadMedicines(): void {
    this.api
      .getMedicines()
      .pipe(catchError(() => of([] as Medicine[])))
      .subscribe((medicines) => {
        this.medicines = medicines ?? [];
      });
  }

  pageSubtitle(): string {
    if (this.auth.hasRole(['PATIENT'])) return 'Review your active treatment plans and doctor instructions.';
    if (this.auth.hasRole(['DOCTOR'])) return 'Create prescriptions and attach medication plans for your patients.';

    return 'Create and review patient medication plans.';
  }

  openCreate(): void {
    this.prescriptionForm.reset({
      patientId: '',
      doctorId: '',
      diagnosis: '',
      instructions: '',
      validUntil: '',
    });
    this.resetMedicineForm();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.saving = false;
  }

  openMedicineModal(prescription: Prescription): void {
    this.selectedPrescription = prescription;
    this.resetMedicineForm();
    this.showMedicineModal = true;
  }

  closeMedicineModal(): void {
    this.showMedicineModal = false;
    this.selectedPrescription = undefined;
    this.saving = false;
  }

  resetMedicineForm(): void {
    this.medicineForm.reset({
      medicineId: '',
      newMedicineName: '',
      manufacturer: 'Generic',
      type: 'TABLET',
      dosage: '',
      frequency: '',
      duration: 7,
      quantity: 1,
      instructions: '',
    });
  }

  reload(): void {
    const user = this.auth.currentUser;

    this.loading = true;
    this.error = '';
    this.message = '';

    if (user?.role === 'PATIENT' && user.id) {
      this.api.getPatientPrescriptions(user.id).subscribe({
        next: (prescriptions) => this.setPrescriptions(prescriptions),
        error: () => this.failLoading('Could not load your prescriptions.'),
      });
      return;
    }

    if (user?.role === 'DOCTOR' && user.id) {
      this.api.getDoctorPrescriptions(user.id).subscribe({
        next: (prescriptions) => this.setPrescriptions(prescriptions),
        error: () => this.failLoading('Could not load doctor prescriptions.'),
      });
      return;
    }

    this.api.getValidPrescriptions().subscribe({
      next: (prescriptions) => this.setPrescriptions(prescriptions),
      error: () => this.failLoading('Could not load prescriptions.'),
    });
  }

  setPrescriptions(prescriptions: Prescription[]): void {
    const records = prescriptions ?? [];

    if (!records.length) {
      this.prescriptions = [];
      this.loading = false;
      return;
    }

    forkJoin(
      records.map((prescription) => {
        if (!prescription.id) return of([] as PrescriptionMedicine[]);
        return this.api.getPrescriptionMedicines(prescription.id).pipe(catchError(() => of([] as PrescriptionMedicine[])));
      }),
    ).subscribe((medicineLists) => {
      this.prescriptions = records.map((prescription, index) => ({
        ...prescription,
        medicines: medicineLists[index] ?? prescription.medicines ?? [],
      }));
      this.loading = false;
    });
  }

  failLoading(message: string): void {
    this.error = message;
    this.loading = false;
  }

  createPrescription(): void {
    if (this.prescriptionForm.invalid || !this.canCreate()) return;

    const user = this.auth.currentUser;
    const raw = this.prescriptionForm.getRawValue();
    const doctorId = user?.role === 'DOCTOR' ? user.id : Number(raw.doctorId);

    if (!doctorId) {
      this.error = 'Please choose a doctor.';
      return;
    }

    const payload: Partial<Prescription> = {
      patient: { id: Number(raw.patientId) },
      doctor: { id: doctorId },
      diagnosis: raw.diagnosis,
      instructions: raw.instructions,
      validUntil: raw.validUntil,
    };

    this.saving = true;
    this.error = '';

    this.api
      .createPrescription(payload)
      .pipe(
        switchMap((prescription) => {
          if (!prescription.id || !this.hasMedicationDraft()) return of('created');

          return this.createOrAttachMedicine(prescription.id);
        }),
      )
      .subscribe({
        next: () => {
          this.message = 'Prescription saved successfully.';
          this.closeCreateModal();
          this.loadMedicines();
          this.reload();
        },
        error: (error) => {
          this.error = error.error?.message || error.error?.error || 'Could not save prescription.';
          this.saving = false;
        },
      });
  }

  addMedicationToSelected(): void {
    if (!this.selectedPrescription?.id) return;

    if (!this.hasMedicationDraft()) {
      this.error = 'Choose an existing medicine or enter a new medicine name.';
      return;
    }

    this.saving = true;
    this.error = '';

    this.createOrAttachMedicine(this.selectedPrescription.id).subscribe({
      next: () => {
        this.message = 'Medication added successfully.';
        this.closeMedicineModal();
        this.loadMedicines();
        this.reload();
      },
      error: (error) => {
        this.error = error.error?.message || error.error?.error || 'Could not add medication.';
        this.saving = false;
      },
    });
  }

  createOrAttachMedicine(prescriptionId: number) {
    const raw = this.medicineForm.getRawValue();
    const medicineId = Number(raw.medicineId);
    const existingMedicine = Number.isFinite(medicineId) && medicineId > 0
      ? this.medicines.find((medicine) => medicine.id === medicineId)
      : undefined;

    const medicineRequest = existingMedicine
      ? of(existingMedicine)
      : this.api.createMedicine({
          name: raw.newMedicineName.trim(),
          manufacturer: raw.manufacturer || 'Generic',
          type: raw.type,
          stockQuantity: Math.max(0, Number(raw.quantity) || 0),
          requiresPrescription: true,
        });

    return medicineRequest.pipe(
      switchMap((medicine) =>
        this.api.addMedicineToPrescription(prescriptionId, {
          medicine: { id: medicine.id },
          dosage: raw.dosage || 'As directed',
          frequency: raw.frequency || 'As directed',
          duration: Math.max(1, Number(raw.duration) || 1),
          quantity: Math.max(1, Number(raw.quantity) || 1),
          instructions: raw.instructions,
        }),
      ),
    );
  }

  hasMedicationDraft(): boolean {
    const raw = this.medicineForm.getRawValue();
    return Boolean(raw.medicineId || raw.newMedicineName.trim());
  }

  filteredPrescriptions(): Prescription[] {
    const query = this.query.trim().toLowerCase();

    if (!query) return this.prescriptions;

    return this.prescriptions.filter((prescription) =>
      [
        prescription.diagnosis,
        prescription.instructions,
        this.patientName(prescription),
        this.doctorName(prescription),
        ...(prescription.medicines ?? []).map((item) => item.medicine.name),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }

  validCount(): number {
    return this.prescriptions.filter((prescription) => this.validityText(prescription) === 'Valid').length;
  }

  medicationCount(): number {
    return this.prescriptions.reduce((count, prescription) => count + (prescription.medicines?.length ?? 0), 0);
  }

  expiringSoonCount(): number {
    const now = new Date();
    const inTwoWeeks = new Date();
    inTwoWeeks.setDate(now.getDate() + 14);

    return this.prescriptions.filter((prescription) => {
      if (!prescription.validUntil) return false;
      const validUntil = new Date(prescription.validUntil);
      return validUntil >= now && validUntil <= inTwoWeeks;
    }).length;
  }

  validityText(prescription?: Prescription): string {
    if (!prescription?.validUntil) return 'Open';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validUntil = new Date(prescription.validUntil);
    return validUntil >= today ? 'Valid' : 'Expired';
  }

  validityClass(prescription: Prescription): string {
    return this.validityText(prescription) === 'Valid' ? 'status confirmed' : 'status cancelled';
  }

  patientName(prescription?: Prescription): string {
    const patient = prescription?.patient;
    const name = `${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`.trim();
    return name || `Patient #${patient?.id ?? '-'}`;
  }

  doctorName(prescription?: Prescription): string {
    const doctor = prescription?.doctor;
    const name = `${doctor?.firstName ?? ''} ${doctor?.lastName ?? ''}`.trim();
    return name ? `Dr. ${name}` : `Doctor #${doctor?.id ?? '-'}`;
  }

  emptyText(): string {
    if (this.auth.hasRole(['PATIENT'])) return 'No prescriptions have been attached to your patient profile yet.';
    if (this.auth.hasRole(['DOCTOR'])) return 'No prescriptions have been written from your doctor profile yet.';

    return 'No prescriptions found.';
  }
}
