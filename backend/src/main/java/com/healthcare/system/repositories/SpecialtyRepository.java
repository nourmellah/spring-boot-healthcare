package com.healthcare.system.repositories;

import com.healthcare.system.entities.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SpecialtyRepository extends JpaRepository<Specialty, Long> {
    
    Optional<Specialty> findByName(String name);
    
    Boolean existsByName(String name);
}
