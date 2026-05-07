import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { HealthcareApiService } from '../../core/services/healthcare-api.service';
import { Doctor, Patient, User, UserRole, Specialty } from '../../models/healthcare.models';

type AccountRole = UserRole;

type AccountFormValue = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  bloodGroup: string;
  emergencyContact: string;
  emergencyContactName: string;
  medicalHistory: string;
  licenseNumber: string;
  specialtyId: string;
  yearsOfExperience: number;
  qualifications: string;
  consultationFee: number;
  availableDays: string;
  availableHours: string;
};

type CreatedAccount = {
  role: AccountRole;
  email: string;
  password: string;
  name: string;
};

type RoleCard = {
  role: AccountRole;
  icon: string;
  title: string;
  description: string;
};

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  private readonly api = inject(HealthcareApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  users: User[] = [];
  specialties: Specialty[] = [];

  error = '';
  message = '';
  query = '';
  filter: 'ALL' | UserRole = 'ALL';

  showModal = false;
  saving = false;
  selectedRole: AccountRole = 'PATIENT';
  lastCreated: CreatedAccount | null = null;

  readonly filters: Array<'ALL' | UserRole> = [
    'ALL',
    'ADMIN',
    'DOCTOR',
    'PATIENT',
    'LAB_TECHNICIAN',
  ];

  readonly roleCards: RoleCard[] = [
    {
      role: 'PATIENT',
      icon: '🧍',
      title: 'Patient portal',
      description: 'Patient login, appointments, prescriptions, lab results and emergency help.',
    },
    {
      role: 'DOCTOR',
      icon: '🩺',
      title: 'Doctor workspace',
      description: 'Clinical schedule, patient care actions, prescriptions and diagnostics.',
    },
    {
      role: 'LAB_TECHNICIAN',
      icon: '🧪',
      title: 'Lab workspace',
      description: 'Diagnostic result entry and lab result workflow.',
    },
    {
      role: 'ADMIN',
      icon: '⚙',
      title: 'Admin console',
      description: 'User access, platform setup and administrative overview.',
    },
  ];

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    dateOfBirth: [''],
    gender: ['MALE'],
    address: [''],
    bloodGroup: [''],
    emergencyContact: [''],
    emergencyContactName: [''],
    medicalHistory: [''],
    licenseNumber: [''],
    specialtyId: [''],
    yearsOfExperience: [0],
    qualifications: [''],
    consultationFee: [0],
    availableDays: ['MON,TUE,WED,THU,FRI'],
    availableHours: ['09:00-17:00'],
  });

  ngOnInit(): void {
    this.reload();
    this.loadSpecialties();
  }

  reload(): void {
    this.error = '';

    this.api.getUsers().subscribe({
      next: (users) => {
        this.users = users ?? [];
      },
      error: () => {
        this.error = 'Could not load users.';
      },
    });
  }

  openCreate(role: AccountRole = 'PATIENT'): void {
    this.selectedRole = role;
    this.error = '';
    this.message = '';

    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: this.defaultPassword(role),
      dateOfBirth: '',
      gender: 'MALE',
      address: '',
      bloodGroup: '',
      emergencyContact: '',
      emergencyContactName: '',
      medicalHistory: '',
      licenseNumber: role === 'DOCTOR' ? this.generateLicense() : '',
      specialtyId: '',
      yearsOfExperience: 0,
      qualifications: '',
      consultationFee: 0,
      availableDays: 'MON,TUE,WED,THU,FRI',
      availableHours: '09:00-17:00',
    });

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.saving = false;
  }

  selectRole(role: AccountRole): void {
    const current = this.form.getRawValue();
    this.selectedRole = role;

    this.form.patchValue({
      password: current.password || this.defaultPassword(role),
      licenseNumber:
        role === 'DOCTOR' && !current.licenseNumber ? this.generateLicense() : current.licenseNumber,
    });
  }

  generatePassword(): void {
    this.form.patchValue({
      password: this.defaultPassword(this.selectedRole, true),
    });
  }

  createAccount(): void {
    if (this.form.invalid) return;

    this.error = '';
    this.message = '';

    const raw = this.form.getRawValue();

    if (this.selectedRole === 'DOCTOR' && !raw.licenseNumber) {
      this.error = 'License number is required for doctor accounts.';
      return;
    }

    this.saving = true;

    const request$ = this.createAccountRequest(raw);
    request$.subscribe(this.handleCreate(raw));
  }

  activate(id: number): void {
    this.api.activateUser(id).subscribe({
      next: () => {
        this.message = 'User activated. Login is enabled again.';
        this.reload();
      },
      error: () => {
        this.error = 'Could not activate user.';
      },
    });
  }

  deactivate(id: number): void {
    this.api.deactivateUser(id).subscribe({
      next: () => {
        this.message = 'User deactivated. Login is now blocked for this account.';
        this.reload();
      },
      error: () => {
        this.error = 'Could not deactivate user.';
      },
    });
  }

  filteredUsers(): User[] {
    const q = this.query.trim().toLowerCase();

    return this.users.filter((user) => {
      const roleMatch = this.filter === 'ALL' || user.role === this.filter;
      const searchable = `${user.firstName} ${user.lastName} ${user.email} ${user.role}`.toLowerCase();
      const textMatch = !q || searchable.includes(q);

      return roleMatch && textMatch;
    });
  }

  countRole(role: UserRole): number {
    return this.users.filter((user) => user.role === role).length;
  }

  initials(user: User): string {
    const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
    return initials || 'U';
  }

  roleLabel(role: UserRole): string {
    if (role === 'LAB_TECHNICIAN') return 'Lab technician';
    return role.charAt(0) + role.slice(1).toLowerCase();
  }

  roleHelp(role: UserRole): string {
    if (role === 'PATIENT') return 'Creates both a login account and a patient medical profile.';
    if (role === 'DOCTOR') return 'Creates both a login account and a doctor clinical profile.';
    if (role === 'LAB_TECHNICIAN') return 'Creates a login account for laboratory work only.';
    return 'Creates an administrator login account.';
  }

  private loadSpecialties(): void {
    this.api.getSpecialties().subscribe({
      next: (specialties) => {
        this.specialties = specialties ?? [];
      },
      error: () => undefined,
    });
  }

  private createAccountRequest(raw: AccountFormValue): Observable<unknown> {
    const base: Partial<User> = {
      firstName: raw.firstName,
      lastName: raw.lastName,
      email: raw.email,
      password: raw.password,
      phone: raw.phone,
      role: this.selectedRole,
    };

    if (this.selectedRole === 'PATIENT') {
      const payload: Partial<Patient> = {
        ...base,
        role: 'PATIENT',
        dateOfBirth: raw.dateOfBirth || undefined,
        gender: raw.gender as Patient['gender'],
        address: raw.address,
        bloodGroup: raw.bloodGroup,
        emergencyContact: raw.emergencyContact,
        emergencyContactName: raw.emergencyContactName,
        medicalHistory: raw.medicalHistory,
      };

      return this.api.createPatient(payload);
    }

    if (this.selectedRole === 'DOCTOR') {
      const payload: Partial<Doctor> = {
        ...base,
        role: 'DOCTOR',
        licenseNumber: raw.licenseNumber,
        specialty: raw.specialtyId ? { id: Number(raw.specialtyId) } : undefined,
        yearsOfExperience: Number(raw.yearsOfExperience || 0),
        qualifications: raw.qualifications,
        consultationFee: Number(raw.consultationFee || 0),
        availableDays: raw.availableDays,
        availableHours: raw.availableHours,
      };

      return this.api.createDoctor(payload);
    }

    if (this.selectedRole === 'ADMIN') {
      return this.api.createAdminUser(base);
    }

    return this.auth.register({
      firstName: raw.firstName,
      lastName: raw.lastName,
      email: raw.email,
      password: raw.password,
      phone: raw.phone,
      role: 'LAB_TECHNICIAN',
    });
  }

  private handleCreate(raw: AccountFormValue) {
    return {
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.message = `${this.roleLabel(this.selectedRole)} account created. It can now be used to log in.`;
        this.lastCreated = {
          role: this.selectedRole,
          email: raw.email,
          password: raw.password,
          name: `${raw.firstName} ${raw.lastName}`,
        };
        this.reload();
      },
      error: (err: { error?: { message?: string; error?: string } }) => {
        this.saving = false;
        this.error =
          err?.error?.message ||
          err?.error?.error ||
          'Could not create account. Check email uniqueness and required fields.';
      },
    };
  }

  private defaultPassword(role: UserRole, random = false): string {
    const suffix = random ? Math.floor(100 + Math.random() * 900) : '123';

    if (role === 'PATIENT') return `Patient@${suffix}`;
    if (role === 'DOCTOR') return `Doctor@${suffix}`;
    if (role === 'LAB_TECHNICIAN') return `Lab@${suffix}456`;
    return `Admin@${suffix}456`;
  }

  private generateLicense(): string {
    return `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
  }
}
