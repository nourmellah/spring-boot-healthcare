export type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT' | 'LAB_TECHNICIAN';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type EmergencyStatus = 'ACTIVE' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
export type EmergencySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type LabStatus = 'PENDING' | 'COMPLETED' | 'REVIEWED';
export type MedicineType = 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'CREAM' | 'DROPS' | 'INHALER' | 'OTHER';
export type NotificationType =
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_REMINDER'
  | 'PRESCRIPTION_CREATED'
  | 'LAB_RESULT_AVAILABLE'
  | 'EMERGENCY_ALERT'
  | 'GENERAL';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone: string;
  role: UserRole;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Patient extends User {
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  medicalHistory?: string;
}

export interface Specialty {
  id?: number;
  name: string;
  description?: string;
}

export interface Doctor extends User {
  licenseNumber?: string;
  specialty?: Partial<Specialty>;
  yearsOfExperience?: number;
  qualifications?: string;
  consultationFee?: number;
  availableDays?: string;
  availableHours?: string;
}

export interface Appointment {
  id?: number;
  patient: Partial<Patient>;
  doctor: Partial<Doctor>;
  appointmentDate: string;
  status?: AppointmentStatus;
  reason?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Prescription {
  id?: number;
  patient: Partial<Patient>;
  doctor: Partial<Doctor>;
  appointment?: Partial<Appointment>;
  prescriptionDate?: string;
  diagnosis?: string;
  instructions?: string;
  validUntil?: string;
  medicines?: PrescriptionMedicine[];
}

export interface Medicine {
  id?: number;
  name: string;
  description?: string;
  manufacturer?: string;
  type?: MedicineType;
  stockQuantity?: number;
  unitPrice?: number;
  requiresPrescription?: boolean;
}

export interface PrescriptionMedicine {
  id?: number;
  prescription?: Partial<Prescription>;
  medicine: Partial<Medicine>;
  dosage: string;
  frequency: string;
  duration: number;
  instructions?: string;
  quantity: number;
}

export interface ConsultationNote {
  id?: number;
  appointment: Partial<Appointment>;
  doctor: Partial<Doctor>;
  chiefComplaint: string;
  symptoms?: string;
  examination?: string;
  diagnosis?: string;
  treatment?: string;
  followUp?: string;
  createdAt?: string;
}

export interface LabResult {
  id?: number;
  patient: Partial<Patient>;
  doctor?: Partial<Doctor>;
  testName: string;
  testDate?: string;
  results?: string;
  remarks?: string;
  filePath?: string;
  status?: LabStatus;
  uploadedBy?: number;
  createdAt?: string;
}

export interface VitalSign {
  id?: number;
  patient: Partial<Patient>;
  recordedAt?: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  notes?: string;
  recordedBy?: number;
}

export interface EmergencyAlert {
  id?: number;
  patient: Partial<Patient>;
  doctor?: Partial<Doctor>;
  description: string;
  location?: string;
  status?: EmergencyStatus;
  severity?: EmergencySeverity;
  createdAt?: string;
  resolvedAt?: string;
  resolution?: string;
}


export interface Notification {
  id?: number;
  userId?: number;
  title: string;
  message: string;
  type?: NotificationType;
  isRead?: boolean;
  createdAt?: string;
  readAt?: string;
  relatedEntity?: string;
  relatedEntityId?: number;
}

export interface AuditLog {
  id?: number;
  userId?: number;
  userRole?: string;
  action?: string;
  entity?: string;
  entityType?: string; // legacy frontend alias; backend sends `entity`
  entityId?: number;
  details?: string;
  ipAddress?: string;
  timestamp?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  activePatients: number;
  activeDoctors: number;
}
