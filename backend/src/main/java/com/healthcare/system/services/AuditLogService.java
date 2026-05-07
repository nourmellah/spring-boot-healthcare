package com.healthcare.system.services;

import com.healthcare.system.entities.AuditLog;
import com.healthcare.system.repositories.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @Transactional
    public void logAction(Long userId, String userRole, String action, String entity, Long entityId, String details) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUserId(userId);
        auditLog.setUserRole(userRole);
        auditLog.setAction(action);
        auditLog.setEntity(entity);
        auditLog.setEntityId(entityId);
        auditLog.setDetails(details);
        auditLog.setTimestamp(LocalDateTime.now());
        // IP address can be set from HTTP request context
        
        auditLogRepository.save(auditLog);
    }
    
    public List<AuditLog> getUserActivityLog(Long userId) {
        return auditLogRepository.findUserActivityLog(userId);
    }
    
    public List<AuditLog> getEntityAuditLog(String entity, Long entityId) {
        return auditLogRepository.findByEntityAndEntityIdOrderByTimestampDesc(entity, entityId);
    }
    
    public List<AuditLog> getAuditLogsBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        return auditLogRepository.findAuditLogsBetweenDates(startDate, endDate);
    }
    
    public List<AuditLog> getAllAuditLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }
}
