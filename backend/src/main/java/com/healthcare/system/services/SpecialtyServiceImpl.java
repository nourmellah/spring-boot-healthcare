package com.healthcare.system.services;

import com.healthcare.system.entities.Specialty;
import com.healthcare.system.repositories.SpecialtyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.util.List;

@Service
public class SpecialtyServiceImpl implements ISpecialtyService {
    
    @Autowired
    private SpecialtyRepository specialtyRepository;
    
    @Override
    @Transactional
    public Specialty createSpecialty(Specialty specialty) {
        if (specialtyRepository.existsByName(specialty.getName())) {
            throw new RuntimeException("Specialty already exists: " + specialty.getName());
        }
        return specialtyRepository.save(specialty);
    }
    
    @Override
    public Specialty getSpecialtyById(Long id) {
        return specialtyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Specialty not found with ID: " + id));
    }
    
    @Override
    public Specialty getSpecialtyByName(String name) {
        return specialtyRepository.findByName(name)
            .orElseThrow(() -> new RuntimeException("Specialty not found: " + name));
    }
    
    @Override
    public List<Specialty> getAllSpecialties() {
        return specialtyRepository.findAll();
    }
    
    @Override
    @Transactional
    public Specialty updateSpecialty(Specialty specialty) {
        if (!specialtyRepository.existsById(specialty.getId())) {
            throw new RuntimeException("Specialty not found with ID: " + specialty.getId());
        }
        return specialtyRepository.save(specialty);
    }
    
    @Override
    @Transactional
    public void deleteSpecialty(Long id) {
        if (!specialtyRepository.existsById(id)) {
            throw new RuntimeException("Specialty not found with ID: " + id);
        }
        specialtyRepository.deleteById(id);
    }
}
