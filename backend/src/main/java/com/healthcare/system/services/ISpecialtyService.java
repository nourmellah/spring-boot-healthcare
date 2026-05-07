package com.healthcare.system.services;

import com.healthcare.system.entities.Specialty;
import java.util.List;

public interface ISpecialtyService {
    
    Specialty createSpecialty(Specialty specialty);
    
    Specialty getSpecialtyById(Long id);
    
    Specialty getSpecialtyByName(String name);
    
    List<Specialty> getAllSpecialties();
    
    Specialty updateSpecialty(Specialty specialty);
    
    void deleteSpecialty(Long id);
}
