package com.healthcare.system.controllers;

import com.healthcare.system.entities.Notification;
import com.healthcare.system.security.UserDetailsImpl;
import com.healthcare.system.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT', 'LAB_TECHNICIAN')")
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;
    
    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(notificationService.getUserNotifications(currentUser.getId()));
    }
    
    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getMyUnreadNotifications(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(notificationService.getUnreadNotifications(currentUser.getId()));
    }
    
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getMyUnreadNotificationCount(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(currentUser.getId())));
    }
    
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        notificationService.markAsRead(id, currentUser.getId());
        return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
    }
    
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }
}
