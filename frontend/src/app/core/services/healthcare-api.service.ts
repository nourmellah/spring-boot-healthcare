import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Appointment,
  AppointmentStatus,
  AuditLog,
  ConsultationNote,
  DashboardStats,
  Doctor,
  EmergencyAlert,
  EmergencyStatus,
  LabResult,
  Medicine,
  Notification,
  Patient,
  Prescription,
  PrescriptionMedicine,
  Specialty,
  User,
  VitalSign,
} from '../../models/healthcare.models';

@Injectable({ providedIn: 'root' })
export class HealthcareApiService {
  private readonly http = inject(HttpClient);
  private readonly api = '/api';

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.api}/admin/dashboard`);
  }

  createAdminUser(payload: Partial<User>): Observable<{ message: string; email: string; role: string }> {
    return this.http.post<{ message: string; email: string; role: string }>(
      `${this.api}/admin/create-admin`,
      payload,
    );
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/admin/users`);
  }

  activateUser(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/admin/users/${id}/activate`, {});
  }

  deactivateUser(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/admin/users/${id}/deactivate`, {});
  }

  getAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.api}/admin/audit-logs`);
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.api}/notifications`);
  }

  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.api}/notifications/unread`);
  }

  getUnreadNotificationCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.api}/notifications/unread/count`);
  }

  markNotificationAsRead(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/notifications/${id}/read`, {});
  }

  markAllNotificationsAsRead(): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/notifications/read-all`, {});
  }

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.api}/patients`);
  }

  getPatient(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.api}/patients/${id}`);
  }

  getPatientMedicalHistory(id: number): Observable<string> {
    return this.http.get(`${this.api}/patients/${id}/medical-history`, { responseType: 'text' });
  }

  createPatient(patient: Partial<Patient>): Observable<Patient> {
    return this.http.post<Patient>(`${this.api}/patients`, patient);
  }

  updatePatient(id: number, patient: Partial<Patient>): Observable<Patient> {
    return this.http.put<Patient>(`${this.api}/patients/${id}`, patient);
  }

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.api}/doctors`);
  }

  createDoctor(doctor: Partial<Doctor>): Observable<Doctor> {
    return this.http.post<Doctor>(`${this.api}/doctors`, doctor);
  }

  updateDoctor(id: number, doctor: Partial<Doctor>): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.api}/doctors/${id}`, doctor);
  }

  getSpecialties(): Observable<Specialty[]> {
    return this.http.get<Specialty[]>(`${this.api}/specialties`);
  }

  createSpecialty(specialty: Partial<Specialty>): Observable<Specialty> {
    return this.http.post<Specialty>(`${this.api}/specialties`, specialty);
  }

  updateSpecialty(id: number, specialty: Partial<Specialty>): Observable<Specialty> {
    return this.http.put<Specialty>(`${this.api}/specialties/${id}`, specialty);
  }

  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.api}/appointments`);
  }

  getPatientAppointments(patientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.api}/appointments/patient/${patientId}`);
  }

  getDoctorAppointments(doctorId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.api}/appointments/doctor/${doctorId}`);
  }

  createAppointment(appointment: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.api}/appointments`, appointment);
  }

  updateAppointmentStatus(id: number, status: AppointmentStatus): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.api}/appointments/${id}/status?status=${status}`, {});
  }

  getValidPrescriptions(): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.api}/prescriptions/valid`);
  }

  getPatientPrescriptions(patientId: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.api}/prescriptions/patient/${patientId}`);
  }

  getDoctorPrescriptions(doctorId: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.api}/prescriptions/doctor/${doctorId}`);
  }

  getPrescription(id: number): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.api}/prescriptions/${id}`);
  }

  createPrescription(prescription: Partial<Prescription>): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.api}/prescriptions`, prescription);
  }

  updatePrescription(id: number, prescription: Partial<Prescription>): Observable<Prescription> {
    return this.http.put<Prescription>(`${this.api}/prescriptions/${id}`, prescription);
  }

  getPrescriptionMedicines(prescriptionId: number): Observable<PrescriptionMedicine[]> {
    return this.http.get<PrescriptionMedicine[]>(`${this.api}/prescriptions/${prescriptionId}/medicines`);
  }

  addMedicineToPrescription(
    prescriptionId: number,
    medicine: Partial<PrescriptionMedicine>,
  ): Observable<string> {
    return this.http.post(`${this.api}/prescriptions/${prescriptionId}/medicines`, medicine, {
      responseType: 'text',
    });
  }

  getMedicines(): Observable<Medicine[]> {
    return this.http.get<Medicine[]>(`${this.api}/medicines`);
  }

  getAvailableMedicines(): Observable<Medicine[]> {
    return this.http.get<Medicine[]>(`${this.api}/medicines/available`);
  }

  createMedicine(medicine: Partial<Medicine>): Observable<Medicine> {
    return this.http.post<Medicine>(`${this.api}/medicines`, medicine);
  }

  getConsultationNotes(): Observable<ConsultationNote[]> {
    return this.http.get<ConsultationNote[]>(`${this.api}/consultation-notes`);
  }

  getAppointmentConsultationNote(appointmentId: number): Observable<ConsultationNote> {
    return this.http.get<ConsultationNote>(`${this.api}/consultation-notes/appointment/${appointmentId}`);
  }

  getPatientConsultationNotes(patientId: number): Observable<ConsultationNote[]> {
    return this.http.get<ConsultationNote[]>(`${this.api}/consultation-notes/patient/${patientId}`);
  }

  getDoctorConsultationNotes(doctorId: number): Observable<ConsultationNote[]> {
    return this.http.get<ConsultationNote[]>(`${this.api}/consultation-notes/doctor/${doctorId}`);
  }

  saveConsultationNote(note: Partial<ConsultationNote>): Observable<ConsultationNote> {
    return this.http.post<ConsultationNote>(`${this.api}/consultation-notes`, note);
  }

  updateConsultationNote(id: number, note: Partial<ConsultationNote>): Observable<ConsultationNote> {
    return this.http.put<ConsultationNote>(`${this.api}/consultation-notes/${id}`, note);
  }

  getLabResults(): Observable<LabResult[]> {
    return this.http.get<LabResult[]>(`${this.api}/lab-results`);
  }

  getPatientLabResults(patientId: number): Observable<LabResult[]> {
    return this.http.get<LabResult[]>(`${this.api}/lab-results/patient/${patientId}`);
  }

  getDoctorLabResults(doctorId: number): Observable<LabResult[]> {
    return this.http.get<LabResult[]>(`${this.api}/lab-results/doctor/${doctorId}`);
  }

  createLabResult(labResult: Partial<LabResult>): Observable<LabResult> {
    return this.http.post<LabResult>(`${this.api}/lab-results`, labResult);
  }

  updateLabResult(id: number, labResult: Partial<LabResult>): Observable<LabResult> {
    return this.http.put<LabResult>(`${this.api}/lab-results/${id}`, labResult);
  }

  getVitalSigns(): Observable<VitalSign[]> {
    return this.http.get<VitalSign[]>(`${this.api}/vital-signs`);
  }

  getPatientVitalSigns(patientId: number): Observable<VitalSign[]> {
    return this.http.get<VitalSign[]>(`${this.api}/vital-signs/patient/${patientId}`);
  }

  createVitalSign(vitalSign: Partial<VitalSign>): Observable<VitalSign> {
    return this.http.post<VitalSign>(`${this.api}/vital-signs`, vitalSign);
  }

  updateVitalSign(id: number, vitalSign: Partial<VitalSign>): Observable<VitalSign> {
    return this.http.put<VitalSign>(`${this.api}/vital-signs/${id}`, vitalSign);
  }

  getEmergencies(): Observable<EmergencyAlert[]> {
    return this.http.get<EmergencyAlert[]>(`${this.api}/emergencies`);
  }

  getActiveEmergencies(): Observable<EmergencyAlert[]> {
    return this.http.get<EmergencyAlert[]>(`${this.api}/emergencies/active`);
  }

  getPatientEmergencies(patientId: number): Observable<EmergencyAlert[]> {
    return this.http.get<EmergencyAlert[]>(`${this.api}/emergencies/patient/${patientId}`);
  }

  createEmergency(alert: Partial<EmergencyAlert>): Observable<EmergencyAlert> {
    return this.http.post<EmergencyAlert>(`${this.api}/emergencies`, alert);
  }

  updateEmergencyStatus(id: number, status: EmergencyStatus): Observable<EmergencyAlert> {
    return this.http.put<EmergencyAlert>(`${this.api}/emergencies/${id}/status?status=${status}`, {});
  }

  resolveEmergency(id: number, resolution = 'Handled by care team'): Observable<EmergencyAlert> {
    return this.http.put<EmergencyAlert>(
      `${this.api}/emergencies/${id}/resolve?resolution=${encodeURIComponent(resolution)}`,
      {},
    );
  }
}
