package com.healthcare.system.repositories;

import com.healthcare.system.entities.Medicine;
import com.healthcare.system.entities.Medicine.MedicineType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    
    Optional<Medicine> findByName(String name);
    
    List<Medicine> findByType(MedicineType type);
    
    List<Medicine> findByNameContaining(String name);
    
    List<Medicine> findByManufacturer(String manufacturer);
    
    @Query("SELECT m FROM Medicine m WHERE m.stockQuantity < 10")
    List<Medicine> findLowStockMedicines();
    
    @Query("SELECT m FROM Medicine m WHERE m.stockQuantity > 0 ORDER BY m.name")
    List<Medicine> findAvailableMedicines();
}
