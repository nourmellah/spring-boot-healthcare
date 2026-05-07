package com.healthcare.system.services;

import com.healthcare.system.entities.Prescription;
import com.healthcare.system.entities.PrescriptionMedicine;
import java.util.List;

public interface IPrescriptionService {
    
    Prescription createPrescription(Prescription prescription, List<PrescriptionMedicine> medicines);
    
    Prescription getPrescriptionById(Long id);
    
    List<Prescription> getPatientPrescriptions(Long patientId);
    
    List<Prescription> getDoctorPrescriptions(Long doctorId);
    
    List<Prescription> getValidPrescriptions();
    
    Prescription updatePrescription(Prescription prescription);
    
    void addMedicineToPrescription(Long prescriptionId, PrescriptionMedicine medicine);
    
    List<PrescriptionMedicine> getPrescriptionMedicines(Long prescriptionId);
}
