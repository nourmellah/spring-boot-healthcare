package com.healthcare.system.services;

import com.healthcare.system.entities.Patient;
import java.util.List;

public interface IPatientService {
    
    Patient registerPatient(Patient patient);
    
    Patient getPatientById(Long id);
    
    List<Patient> getAllPatients();
    
    List<Patient> getActivePatients();
    
    Patient updatePatient(Patient patient);
    
    void deletePatient(Long id);
    
    List<Patient> searchPatients(String searchTerm);
    
    List<Patient> getPatientsByBloodGroup(String bloodGroup);
    
    Long getActivePatientCount();
    
    String getPatientMedicalHistory(Long patientId);
}
