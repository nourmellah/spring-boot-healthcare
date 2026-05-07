package com.healthcare.system.repositories;

import com.healthcare.system.entities.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    List<AuditLog> findAllByOrderByTimestampDesc();
    
    List<AuditLog> findByUserId(Long userId);
    
    List<AuditLog> findByUserIdOrderByTimestampDesc(Long userId);
    
    List<AuditLog> findByEntity(String entity);
    
    List<AuditLog> findByEntityOrderByTimestampDesc(String entity);
    
    List<AuditLog> findByEntityAndEntityId(String entity, Long entityId);
    
    List<AuditLog> findByEntityAndEntityIdOrderByTimestampDesc(String entity, Long entityId);
    
    @Query("SELECT a FROM AuditLog a WHERE a.timestamp BETWEEN :startDate AND :endDate ORDER BY a.timestamp DESC")
    List<AuditLog> findAuditLogsBetweenDates(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT a FROM AuditLog a WHERE a.userId = :userId ORDER BY a.timestamp DESC")
    List<AuditLog> findUserActivityLog(Long userId);
}
