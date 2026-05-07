import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
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
          <button class="ghost" type="button" (click)="openCreateMedicine()">+ New medicine</button>
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
      @if (canManageInventory()) {
        <article>
          <span>⚠</span>
          <div>
            <strong>{{ lowStockCount() }}</strong>
            <small>Low stock</small>
          </div>
        </article>
      }
    </section>

    @if (canManageInventory()) {
      <section class="panel app-card">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Inventory</p>
            <h2>Medicine inventory</h2>
          </div>
          <button class="primary" type="button" (click)="openCreateMedicine()">
            + Add medicine
          </button>
        </header>

        <div class="toolbar">
          <div class="search-box">
            <span>⌕</span>
            <input
              placeholder="Search medicine, manufacturer, type or description"
              (input)="inventoryQuery = $any($event.target).value"
            />
          </div>
          <div class="meta-text">
            {{ filteredMedicines().length }} medicine{{
              filteredMedicines().length === 1 ? '' : 's'
            }}
          </div>
        </div>

        <div class="prescription-grid">
          @for (medicine of filteredMedicines(); track medicine.id) {
            <article class="prescription-card medicine-rich-card">
              <header>
                <div class="prescription-icon">💊</div>
                <div>
                  <h3>{{ medicine.name }}</h3>
                  <p>{{ medicine.manufacturer || 'Generic' }} · {{ medicine.type || 'OTHER' }}</p>
                </div>
                <span [class]="medicineStockClass(medicine)">{{
                  medicineStockText(medicine)
                }}</span>
              </header>

              <div class="prescription-detail-grid">
                <div>
                  <small>Stock</small>
                  <strong>{{ medicine.stockQuantity ?? 0 }}</strong>
                </div>
                <div>
                  <small>Unit price</small>
                  <strong>{{ medicine.unitPrice ?? 0 }}</strong>
                </div>
                <div>
                  <small>Prescription</small>
                  <strong>{{ medicine.requiresPrescription ? 'Required' : 'Not required' }}</strong>
                </div>
                <div class="wide">
                  <small>Description</small>
                  <p>{{ medicine.description || 'No description added.' }}</p>
                </div>
              </div>

              <footer class="card-footer-actions">
                <button class="secondary tiny" type="button" (click)="openEditMedicine(medicine)">
                  Edit medicine
                </button>
                <button
                  class="danger tiny"
                  type="button"
                  [disabled]="deletingInventoryMedicineId === medicine.id"
                  (click)="deleteMedicine(medicine)"
                >
                  {{ deletingInventoryMedicineId === medicine.id ? 'Deleting...' : 'Delete' }}
                </button>
              </footer>
            </article>
          } @empty {
            <div class="empty-state">
              <span>💊</span>
              <strong>No medicines found</strong>
              <p>Add medicines here, then reuse them inside prescriptions.</p>
            </div>
          }
        </div>
      </section>
    }

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
          {{ filteredPrescriptions().length }} prescription{{
            filteredPrescriptions().length === 1 ? '' : 's'
          }}
        </div>
      </div>

      @if (loading) {
        <div class="loading-row">
          <span class="spinner"></span> Loading prescriptions automatically...
        </div>
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
                  <span
                    >{{ prescription.medicines?.length || 0 }} item{{
                      prescription.medicines?.length === 1 ? '' : 's'
                    }}</span
                  >
                </div>

                @for (item of prescription.medicines || []; track item.id) {
                  <div class="medicine-line">
                    <span>💊</span>
                    <div>
                      <strong>{{ item.medicine.name || 'Medicine' }}</strong>
                      <small>
                        {{ item.dosage }} · {{ item.frequency }} · {{ item.duration }} day{{
                          item.duration === 1 ? '' : 's'
                        }}
                      </small>
                      @if (item.instructions) {
                        <p>{{ item.instructions }}</p>
                      }
                      @if (canManagePrescription(prescription)) {
                        <div class="inline-actions">
                          <button
                            class="secondary tiny"
                            type="button"
                            (click)="openMedicineModal(prescription, item)"
                          >
                            Edit
                          </button>
                          <button
                            class="danger tiny"
                            type="button"
                            [disabled]="deletingMedicineLineId === item.id"
                            (click)="deleteMedicationLine(prescription, item)"
                          >
                            {{ deletingMedicineLineId === item.id ? 'Deleting...' : 'Delete' }}
                          </button>
                        </div>
                      }
                    </div>
                    <em>Qty {{ item.quantity }}</em>
                  </div>
                } @empty {
                  <p class="empty compact">No medicines attached yet.</p>
                }
              </section>

              @if (canManagePrescription(prescription)) {
                <footer class="card-footer-actions">
                  <button class="tiny" type="button" (click)="openMedicineModal(prescription)">
                    + Add medication
                  </button>
                  <button class="secondary tiny" type="button" (click)="openEdit(prescription)">
                    Edit prescription
                  </button>
                  <button
                    class="danger tiny"
                    type="button"
                    [disabled]="deletingPrescriptionId === prescription.id"
                    (click)="deletePrescription(prescription)"
                  >
                    {{ deletingPrescriptionId === prescription.id ? 'Deleting...' : 'Delete' }}
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
              <h2>{{ editingPrescription ? 'Edit prescription' : 'Create prescription' }}</h2>
              <p>
                {{
                  editingPrescription
                    ? 'Update the diagnosis, instructions, or validity date. Patient and doctor links stay unchanged.'
                    : 'Create a treatment plan and optionally attach the first medicine.'
                }}
              </p>
            </div>
            <button class="icon-button" type="button" (click)="closeCreateModal()">×</button>
          </header>

          <form
            class="modal-body account-form-sections"
            [formGroup]="prescriptionForm"
            (ngSubmit)="savePrescription()"
          >
            <section class="form-section grid-form">
              <h3 class="wide">Prescription details</h3>

              @if (editingPrescription) {
                <label>Patient <input [value]="patientName(editingPrescription)" disabled /></label>
                <label>Doctor <input [value]="doctorName(editingPrescription)" disabled /></label>
              } @else {
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

                @if (auth.hasRole(['ADMIN'])) {
                  <label>
                    Doctor
                    <select formControlName="doctorId">
                      <option value="">Choose doctor</option>
                      @for (doctor of doctors; track doctor.id) {
                        <option [value]="doctor.id">
                          Dr. {{ doctor.firstName }} {{ doctor.lastName }}
                        </option>
                      }
                    </select>
                  </label>
                }
              }

              <label>Valid until <input type="date" formControlName="validUntil" /></label>
              <label class="wide"
                >Diagnosis <textarea rows="3" formControlName="diagnosis"></textarea>
              </label>
              <label class="wide"
                >Instructions <textarea rows="3" formControlName="instructions"></textarea>
              </label>
            </section>

            @if (!editingPrescription) {
              <section class="form-section grid-form" [formGroup]="medicineForm">
                <h3 class="wide">First medication item</h3>

                <label class="wide">
                  Existing medicine
                  <select formControlName="medicineId">
                    <option value="">Create or choose medicine</option>
                    @for (medicine of medicines; track medicine.id) {
                      <option [value]="medicine.id">
                        {{ medicine.name }} · {{ medicine.type || 'OTHER' }}
                      </option>
                    }
                  </select>
                </label>

                <label
                  >New medicine name
                  <input formControlName="newMedicineName" placeholder="Paracetamol"
                /></label>
                <label
                  >Manufacturer <input formControlName="manufacturer" placeholder="Generic"
                /></label>
                <label>
                  Type
                  <select formControlName="type">
                    @for (type of medicineTypes; track type) {
                      <option [value]="type">{{ type }}</option>
                    }
                  </select>
                </label>
                <label>Dosage <input formControlName="dosage" placeholder="500mg" /></label>
                <label
                  >Frequency <input formControlName="frequency" placeholder="Twice daily"
                /></label>
                <label
                  >Duration in days <input type="number" min="1" formControlName="duration"
                /></label>
                <label>Quantity <input type="number" min="1" formControlName="quantity" /></label>
                <label class="wide"
                  >Medication instructions
                  <textarea rows="2" formControlName="instructions"></textarea>
                </label>
              </section>
            }

            <div class="modal-footer">
              <span class="small-note">
                {{
                  editingPrescription
                    ? 'Only prescription details are edited here.'
                    : 'Leave medication fields empty if you only want to create the prescription record.'
                }}
              </span>
              <span class="form-spacer"></span>
              <button class="ghost" type="button" (click)="closeCreateModal()">Cancel</button>
              <button class="primary" type="submit" [disabled]="prescriptionForm.invalid || saving">
                {{
                  saving
                    ? 'Saving...'
                    : editingPrescription
                      ? 'Update prescription'
                      : 'Create prescription'
                }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }

    @if (showMedicineModal && selectedPrescription) {
      <div class="modal-backdrop" (click)="closeMedicineModal()">
        <section class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div>
              <h2>{{ editingMedicine ? 'Edit medication' : 'Add medication' }}</h2>
              <p>
                {{ selectedPrescription.diagnosis || 'Prescription' }} ·
                {{ patientName(selectedPrescription) }}
              </p>
            </div>
            <button class="icon-button" type="button" (click)="closeMedicineModal()">×</button>
          </header>

          <form
            class="modal-body grid-form"
            [formGroup]="medicineForm"
            (ngSubmit)="saveMedicationToSelected()"
          >
            <label class="wide">
              Existing medicine
              <select formControlName="medicineId">
                <option value="">
                  {{ editingMedicine ? 'Keep current medicine' : 'Create or choose medicine' }}
                </option>
                @for (medicine of medicines; track medicine.id) {
                  <option [value]="medicine.id">
                    {{ medicine.name }} · {{ medicine.type || 'OTHER' }}
                  </option>
                }
              </select>
            </label>

            <label
              >New medicine name <input formControlName="newMedicineName" placeholder="Ibuprofen"
            /></label>
            <label
              >Manufacturer <input formControlName="manufacturer" placeholder="Generic"
            /></label>
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
            <label
              >Duration in days <input type="number" min="1" formControlName="duration"
            /></label>
            <label>Quantity <input type="number" min="1" formControlName="quantity" /></label>
            <label class="wide"
              >Instructions <textarea rows="3" formControlName="instructions"></textarea>
            </label>

            <div class="modal-footer wide">
              <button class="ghost" type="button" (click)="closeMedicineModal()">Cancel</button>
              <button class="primary" type="submit" [disabled]="saving">
                {{
                  saving ? 'Saving...' : editingMedicine ? 'Update medication' : 'Add medication'
                }}
              </button>
            </div>
          </form>
        </section>
      </div>
    }

    @if (showInventoryModal) {
      <div class="modal-backdrop" (click)="closeInventoryModal()">
        <section class="modal" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div>
              <h2>{{ editingInventoryMedicine ? 'Edit medicine' : 'Add medicine' }}</h2>
              <p>Manage the reusable medicine catalog used by prescriptions.</p>
            </div>
            <button class="icon-button" type="button" (click)="closeInventoryModal()">×</button>
          </header>

          <form
            class="modal-body grid-form"
            [formGroup]="inventoryForm"
            (ngSubmit)="saveMedicine()"
          >
            <label>Name <input formControlName="name" placeholder="Paracetamol 500mg" /></label>
            <label
              >Manufacturer <input formControlName="manufacturer" placeholder="Generic"
            /></label>
            <label>
              Type
              <select formControlName="type">
                @for (type of medicineTypes; track type) {
                  <option [value]="type">{{ type }}</option>
                }
              </select>
            </label>
            <label
              >Stock quantity <input type="number" min="0" formControlName="stockQuantity"
            /></label>
            <label
              >Unit price <input type="number" min="0" step="0.01" formControlName="unitPrice"
            /></label>
            <label>
              Requires prescription
              <select formControlName="requiresPrescription">
                <option [ngValue]="true">Yes</option>
                <option [ngValue]="false">No</option>
              </select>
            </label>
            <label class="wide"
              >Description <textarea rows="3" formControlName="description"></textarea>
            </label>

            <div class="modal-footer wide">
              <button class="ghost" type="button" (click)="closeInventoryModal()">Cancel</button>
              <button class="primary" type="submit" [disabled]="inventoryForm.invalid || saving">
                {{
                  saving
                    ? 'Saving...'
                    : editingInventoryMedicine
                      ? 'Update medicine'
                      : 'Save medicine'
                }}
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
  inventoryQuery = '';
  showCreateModal = false;
  showMedicineModal = false;
  showInventoryModal = false;
  selectedPrescription?: Prescription;
  editingPrescription?: Prescription;
  editingMedicine?: PrescriptionMedicine;
  editingInventoryMedicine?: Medicine;
  deletingPrescriptionId?: number;
  deletingMedicineLineId?: number;
  deletingInventoryMedicineId?: number;
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

  readonly inventoryForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    manufacturer: ['Generic', Validators.required],
    type: ['TABLET' as MedicineType, Validators.required],
    stockQuantity: [0, Validators.min(0)],
    unitPrice: [0, Validators.min(0)],
    requiresPrescription: [true],
  });

  ngOnInit(): void {
    this.loadFormOptions();
    this.loadMedicines();
    this.reload();
  }

  canCreate(): boolean {
    return this.auth.hasRole(['ADMIN', 'DOCTOR']);
  }

  canManageInventory(): boolean {
    return this.auth.hasRole(['ADMIN', 'DOCTOR']);
  }

  canManagePrescription(prescription?: Prescription): boolean {
    const user = this.auth.currentUser;
    if (!user?.id || !prescription?.id) return false;
    if (user.role === 'ADMIN') return true;

    return user.role === 'DOCTOR' && prescription.doctor?.id === user.id;
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
        this.medicines = this.sortMedicines(medicines ?? []);
      });
  }

  pageSubtitle(): string {
    if (this.auth.hasRole(['PATIENT']))
      return 'Review your active treatment plans and doctor instructions.';
    if (this.auth.hasRole(['DOCTOR']))
      return 'Create, edit, and manage medication plans for your patients.';

    return 'Create and review patient medication plans.';
  }

  openCreate(): void {
    this.editingPrescription = undefined;
    this.prescriptionForm.reset({
      patientId: '',
      doctorId: '',
      diagnosis: '',
      instructions: '',
      validUntil: this.defaultValidUntil(),
    });
    this.resetMedicineForm();
    this.showCreateModal = true;
  }

  openEdit(prescription: Prescription): void {
    if (!this.canManagePrescription(prescription)) return;

    this.editingPrescription = prescription;
    this.prescriptionForm.reset({
      patientId: prescription.patient?.id ? String(prescription.patient.id) : '',
      doctorId: prescription.doctor?.id ? String(prescription.doctor.id) : '',
      diagnosis: prescription.diagnosis ?? '',
      instructions: prescription.instructions ?? '',
      validUntil: prescription.validUntil ?? this.defaultValidUntil(),
    });
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.saving = false;
    this.editingPrescription = undefined;
  }

  openMedicineModal(prescription: Prescription, medicineLine?: PrescriptionMedicine): void {
    if (!this.canManagePrescription(prescription)) return;

    this.selectedPrescription = prescription;
    this.editingMedicine = medicineLine;

    if (medicineLine) {
      this.medicineForm.reset({
        medicineId: medicineLine.medicine?.id ? String(medicineLine.medicine.id) : '',
        newMedicineName: '',
        manufacturer: medicineLine.medicine?.manufacturer || 'Generic',
        type: medicineLine.medicine?.type || 'TABLET',
        dosage: medicineLine.dosage || '',
        frequency: medicineLine.frequency || '',
        duration: medicineLine.duration || 7,
        quantity: medicineLine.quantity || 1,
        instructions: medicineLine.instructions || '',
      });
    } else {
      this.resetMedicineForm();
    }

    this.showMedicineModal = true;
  }

  closeMedicineModal(): void {
    this.showMedicineModal = false;
    this.selectedPrescription = undefined;
    this.editingMedicine = undefined;
    this.saving = false;
  }

  openCreateMedicine(): void {
    if (!this.canManageInventory()) return;

    this.editingInventoryMedicine = undefined;
    this.inventoryForm.reset({
      name: '',
      description: '',
      manufacturer: 'Generic',
      type: 'TABLET',
      stockQuantity: 0,
      unitPrice: 0,
      requiresPrescription: true,
    });
    this.showInventoryModal = true;
  }

  openEditMedicine(medicine: Medicine): void {
    if (!this.canManageInventory()) return;

    this.editingInventoryMedicine = medicine;
    this.inventoryForm.reset({
      name: medicine.name ?? '',
      description: medicine.description ?? '',
      manufacturer: medicine.manufacturer ?? 'Generic',
      type: medicine.type ?? 'TABLET',
      stockQuantity: medicine.stockQuantity ?? 0,
      unitPrice: medicine.unitPrice ?? 0,
      requiresPrescription: medicine.requiresPrescription ?? true,
    });
    this.showInventoryModal = true;
  }

  closeInventoryModal(): void {
    this.showInventoryModal = false;
    this.editingInventoryMedicine = undefined;
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
        return this.api
          .getPrescriptionMedicines(prescription.id)
          .pipe(catchError(() => of([] as PrescriptionMedicine[])));
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

  savePrescription(): void {
    if (this.prescriptionForm.invalid || !this.canCreate()) return;

    if (this.editingPrescription?.id) {
      this.updatePrescription();
      return;
    }

    this.createPrescription();
  }

  private createPrescription(): void {
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

  private updatePrescription(): void {
    if (!this.editingPrescription?.id) return;

    const raw = this.prescriptionForm.getRawValue();
    this.saving = true;
    this.error = '';

    this.api
      .updatePrescription(this.editingPrescription.id, {
        diagnosis: raw.diagnosis,
        instructions: raw.instructions,
        validUntil: raw.validUntil,
      })
      .subscribe({
        next: () => {
          this.message = 'Prescription updated successfully.';
          this.closeCreateModal();
          this.reload();
        },
        error: (error) => {
          this.error =
            error.error?.message || error.error?.error || 'Could not update prescription.';
          this.saving = false;
        },
      });
  }

  deletePrescription(prescription: Prescription): void {
    if (!prescription.id || !this.canManagePrescription(prescription)) return;

    const confirmed = window.confirm(
      'Delete this prescription and its medication lines? This cannot be undone.',
    );
    if (!confirmed) return;

    this.deletingPrescriptionId = prescription.id;
    this.error = '';

    this.api.deletePrescription(prescription.id).subscribe({
      next: () => {
        this.message = 'Prescription deleted successfully.';
        this.prescriptions = this.prescriptions.filter((item) => item.id !== prescription.id);
        this.deletingPrescriptionId = undefined;
      },
      error: (error) => {
        this.error = error.error?.message || error.error?.error || 'Could not delete prescription.';
        this.deletingPrescriptionId = undefined;
      },
    });
  }

  saveMedicationToSelected(): void {
    if (!this.selectedPrescription?.id) return;

    if (!this.hasMedicationDraft()) {
      this.error = 'Choose an existing medicine or enter a new medicine name.';
      return;
    }

    this.saving = true;
    this.error = '';

    const request: Observable<string | PrescriptionMedicine> = this.editingMedicine?.id
      ? this.updateMedicationLine(this.selectedPrescription.id, this.editingMedicine.id)
      : this.createOrAttachMedicine(this.selectedPrescription.id);

    request.subscribe({
      next: () => {
        this.message = this.editingMedicine
          ? 'Medication updated successfully.'
          : 'Medication added successfully.';
        this.closeMedicineModal();
        this.loadMedicines();
        this.reload();
      },
      error: (error: any) => {
        this.error = error.error?.message || error.error?.error || 'Could not save medication.';
        this.saving = false;
      },
    });
  }

  createOrAttachMedicine(prescriptionId: number): Observable<string> {
    return this.resolveMedicineFromForm().pipe(
      switchMap((medicine) =>
        this.api.addMedicineToPrescription(prescriptionId, this.buildMedicineLinePayload(medicine)),
      ),
    );
  }

  updateMedicationLine(
    prescriptionId: number,
    medicineLineId: number,
  ): Observable<PrescriptionMedicine> {
    return this.resolveMedicineFromForm().pipe(
      switchMap((medicine) =>
        this.api.updatePrescriptionMedicine(
          prescriptionId,
          medicineLineId,
          this.buildMedicineLinePayload(medicine),
        ),
      ),
    );
  }

  deleteMedicationLine(prescription: Prescription, item: PrescriptionMedicine): void {
    if (!prescription.id || !item.id || !this.canManagePrescription(prescription)) return;

    const confirmed = window.confirm('Delete this medication line from the prescription?');
    if (!confirmed) return;

    this.deletingMedicineLineId = item.id;
    this.error = '';

    this.api.deletePrescriptionMedicine(prescription.id, item.id).subscribe({
      next: () => {
        this.message = 'Medication removed successfully.';
        this.deletingMedicineLineId = undefined;
        this.reload();
      },
      error: (error) => {
        this.error = error.error?.message || error.error?.error || 'Could not remove medication.';
        this.deletingMedicineLineId = undefined;
      },
    });
  }

  saveMedicine(): void {
    if (this.inventoryForm.invalid || !this.canManageInventory()) return;

    const raw = this.inventoryForm.getRawValue();
    const payload: Partial<Medicine> = {
      name: raw.name.trim(),
      description: raw.description,
      manufacturer: raw.manufacturer || 'Generic',
      type: raw.type,
      stockQuantity: Math.max(0, Number(raw.stockQuantity) || 0),
      unitPrice: Math.max(0, Number(raw.unitPrice) || 0),
      requiresPrescription: raw.requiresPrescription,
    };

    this.saving = true;
    this.error = '';

    const request = this.editingInventoryMedicine?.id
      ? this.api.updateMedicine(this.editingInventoryMedicine.id, payload)
      : this.api.createMedicine(payload);

    request.subscribe({
      next: () => {
        this.message = this.editingInventoryMedicine
          ? 'Medicine updated successfully.'
          : 'Medicine created successfully.';
        this.closeInventoryModal();
        this.loadMedicines();
        this.reload();
      },
      error: (error) => {
        this.error = error.error?.message || error.error?.error || 'Could not save medicine.';
        this.saving = false;
      },
    });
  }

  deleteMedicine(medicine: Medicine): void {
    if (!medicine.id || !this.canManageInventory()) return;

    const confirmed = window.confirm(
      'Delete this medicine from the inventory? Medicines already used in prescriptions will be blocked by the backend.',
    );
    if (!confirmed) return;

    this.deletingInventoryMedicineId = medicine.id;
    this.error = '';

    this.api.deleteMedicine(medicine.id).subscribe({
      next: () => {
        this.message = 'Medicine deleted successfully.';
        this.deletingInventoryMedicineId = undefined;
        this.loadMedicines();
      },
      error: (error) => {
        this.error = error.error?.message || error.error?.error || 'Could not delete medicine.';
        this.deletingInventoryMedicineId = undefined;
      },
    });
  }

  private resolveMedicineFromForm(): Observable<Medicine> {
    const raw = this.medicineForm.getRawValue();
    const medicineId = Number(raw.medicineId);
    const existingMedicine =
      Number.isFinite(medicineId) && medicineId > 0
        ? this.medicines.find((medicine) => medicine.id === medicineId)
        : undefined;

    if (existingMedicine) {
      return of(existingMedicine);
    }

    if (raw.newMedicineName.trim()) {
      return this.api.createMedicine({
        name: raw.newMedicineName.trim(),
        manufacturer: raw.manufacturer || 'Generic',
        type: raw.type,
        stockQuantity: Math.max(0, Number(raw.quantity) || 0),
        requiresPrescription: true,
      });
    }

    if (this.editingMedicine?.medicine?.id) {
      return of(this.editingMedicine.medicine as Medicine);
    }

    throw new Error('No medicine selected');
  }

  private buildMedicineLinePayload(medicine: Medicine): Partial<PrescriptionMedicine> {
    const raw = this.medicineForm.getRawValue();

    return {
      medicine: { id: medicine.id },
      dosage: raw.dosage || 'As directed',
      frequency: raw.frequency || 'As directed',
      duration: Math.max(1, Number(raw.duration) || 1),
      quantity: Math.max(1, Number(raw.quantity) || 1),
      instructions: raw.instructions,
    };
  }

  hasMedicationDraft(): boolean {
    const raw = this.medicineForm.getRawValue();
    return Boolean(
      raw.medicineId || raw.newMedicineName.trim() || this.editingMedicine?.medicine?.id,
    );
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

  filteredMedicines(): Medicine[] {
    const query = this.inventoryQuery.trim().toLowerCase();

    if (!query) return this.medicines;

    return this.medicines.filter((medicine) =>
      [medicine.name, medicine.manufacturer, medicine.type, medicine.description]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }

  validCount(): number {
    return this.prescriptions.filter((prescription) => this.validityText(prescription) === 'Valid')
      .length;
  }

  medicationCount(): number {
    return this.prescriptions.reduce(
      (count, prescription) => count + (prescription.medicines?.length ?? 0),
      0,
    );
  }

  lowStockCount(): number {
    return this.medicines.filter(
      (medicine) => (medicine.stockQuantity ?? 0) > 0 && (medicine.stockQuantity ?? 0) < 10,
    ).length;
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

  medicineStockText(medicine: Medicine): string {
    const stock = medicine.stockQuantity ?? 0;

    if (stock <= 0) return 'Out of stock';
    if (stock < 10) return 'Low stock';

    return 'In stock';
  }

  medicineStockClass(medicine: Medicine): string {
    const stock = medicine.stockQuantity ?? 0;

    if (stock <= 0) return 'status cancelled';
    if (stock < 10) return 'status pending';

    return 'status confirmed';
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
    if (this.auth.hasRole(['PATIENT']))
      return 'No prescriptions have been attached to your patient profile yet.';
    if (this.auth.hasRole(['DOCTOR']))
      return 'No prescriptions have been written from your doctor profile yet.';

    return 'No prescriptions found.';
  }

  private sortMedicines(medicines: Medicine[]): Medicine[] {
    return [...medicines].sort((a, b) => `${a.name ?? ''}`.localeCompare(`${b.name ?? ''}`));
  }

  private defaultValidUntil(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 10);
  }
}
