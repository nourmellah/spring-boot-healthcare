-- Step 6.4: emergency alerts + notifications + audit logs
-- Safe/idempotent: emergencies and notifications are inserted only if matching demo records do not already exist.

START TRANSACTION;

SELECT id INTO @admin FROM users WHERE email = 'admin@hospital.com' LIMIT 1;
SELECT id INTO @dr_youssef FROM users WHERE email = 'youssef.abbes.doctor@demo.local' LIMIT 1;
SELECT id INTO @dr_leila   FROM users WHERE email = 'leila.trabelsi.doctor@demo.local' LIMIT 1;
SELECT id INTO @dr_omar    FROM users WHERE email = 'omar.mejri.doctor@demo.local' LIMIT 1;
SELECT id INTO @lab_ines   FROM users WHERE email = 'ines.mansouri.lab@demo.local' LIMIT 1;

SELECT id INTO @pt_sarah  FROM users WHERE email = 'sarah.benali.patient@demo.local' LIMIT 1;
SELECT id INTO @pt_amir   FROM users WHERE email = 'amir.khelifi.patient@demo.local' LIMIT 1;
SELECT id INTO @pt_mariem FROM users WHERE email = 'mariem.chaabane.patient@demo.local' LIMIT 1;
SELECT id INTO @pt_nour   FROM users WHERE email = 'nour.hammami.patient@demo.local' LIMIT 1;

SELECT id INTO @appt_sarah_confirmed FROM appointments
WHERE patient_id = @pt_sarah AND doctor_id = @dr_youssef AND reason = 'Follow-up for hypertension control'
ORDER BY id LIMIT 1;

SELECT id INTO @appt_mariem_confirmed FROM appointments
WHERE patient_id = @pt_mariem AND doctor_id = @dr_omar AND reason = 'Migraine evaluation'
ORDER BY id LIMIT 1;

SELECT id INTO @rx_sarah FROM prescriptions
WHERE patient_id = @pt_sarah AND doctor_id = @dr_youssef AND diagnosis = 'Essential hypertension'
ORDER BY id LIMIT 1;

SELECT id INTO @lab_amir FROM lab_results
WHERE patient_id = @pt_amir AND test_name = 'HbA1c'
ORDER BY id LIMIT 1;

-- Emergency alerts: these are intentionally seeded as real emergency_alerts so the notifications center still shows emergencies even if no backend notification exists.
INSERT INTO emergency_alerts (patient_id, doctor_id, description, location, status, severity, created_at, resolved_at, resolution)
SELECT @pt_sarah, @dr_youssef,
       'Severe chest discomfort with dizziness while at home. Patient requested urgent callback.',
       'Ariana, Tunis - Home',
       'ACTIVE', 'HIGH', DATE_SUB(NOW(), INTERVAL 35 MINUTE), NULL, NULL
WHERE @pt_sarah IS NOT NULL AND @dr_youssef IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM emergency_alerts
    WHERE patient_id = @pt_sarah AND description = 'Severe chest discomfort with dizziness while at home. Patient requested urgent callback.'
  );

INSERT INTO emergency_alerts (patient_id, doctor_id, description, location, status, severity, created_at, resolved_at, resolution)
SELECT @pt_nour, @dr_leila,
       'Asthma breathing difficulty at school after sports activity.',
       'Ben Arous - School infirmary',
       'RESOLVED', 'MEDIUM', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(DATE_SUB(NOW(), INTERVAL 2 DAY), INTERVAL 45 MINUTE),
       'Symptoms improved after rescue inhaler use. Parent advised to schedule control visit.'
WHERE @pt_nour IS NOT NULL AND @dr_leila IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM emergency_alerts
    WHERE patient_id = @pt_nour AND description = 'Asthma breathing difficulty at school after sports activity.'
  );

SELECT id INTO @emergency_sarah FROM emergency_alerts
WHERE patient_id = @pt_sarah AND description = 'Severe chest discomfort with dizziness while at home. Patient requested urgent callback.'
ORDER BY id LIMIT 1;

SELECT id INTO @emergency_nour FROM emergency_alerts
WHERE patient_id = @pt_nour AND description = 'Asthma breathing difficulty at school after sports activity.'
ORDER BY id LIMIT 1;

-- Notifications for patients/doctors/lab. Values match the current Notification.NotificationType enum.
INSERT INTO notifications (user_id, title, message, type, is_read, created_at, read_at, related_entity, related_entity_id)
SELECT @pt_sarah,
       'Appointment confirmed',
       'Your cardiology follow-up appointment with Dr. Youssef Abbes is confirmed.',
       'APPOINTMENT_CONFIRMED', 0, DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL, 'Appointment', @appt_sarah_confirmed
WHERE @pt_sarah IS NOT NULL AND @appt_sarah_confirmed IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = @pt_sarah AND type = 'APPOINTMENT_CONFIRMED' AND related_entity = 'Appointment' AND related_entity_id = @appt_sarah_confirmed
  );

INSERT INTO notifications (user_id, title, message, type, is_read, created_at, read_at, related_entity, related_entity_id)
SELECT @dr_youssef,
       'Upcoming appointment',
       'Sarah Ben Ali has an upcoming hypertension follow-up appointment.',
       'APPOINTMENT_REMINDER', 0, DATE_SUB(NOW(), INTERVAL 90 MINUTE), NULL, 'Appointment', @appt_sarah_confirmed
WHERE @dr_youssef IS NOT NULL AND @appt_sarah_confirmed IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = @dr_youssef AND type = 'APPOINTMENT_REMINDER' AND related_entity = 'Appointment' AND related_entity_id = @appt_sarah_confirmed
  );

INSERT INTO notifications (user_id, title, message, type, is_read, created_at, read_at, related_entity, related_entity_id)
SELECT @pt_mariem,
       'Appointment confirmed',
       'Your neurology appointment for migraine evaluation is confirmed.',
       'APPOINTMENT_CONFIRMED', 0, DATE_SUB(NOW(), INTERVAL 4 HOUR), NULL, 'Appointment', @appt_mariem_confirmed
WHERE @pt_mariem IS NOT NULL AND @appt_mariem_confirmed IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = @pt_mariem AND type = 'APPOINTMENT_CONFIRMED' AND related_entity = 'Appointment' AND related_entity_id = @appt_mariem_confirmed
  );

INSERT INTO notifications (user_id, title, message, type, is_read, created_at, read_at, related_entity, related_entity_id)
SELECT @pt_sarah,
       'New prescription available',
       'Dr. Youssef Abbes added a prescription for your hypertension treatment plan.',
       'PRESCRIPTION_CREATED', 0, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, 'Prescription', @rx_sarah
WHERE @pt_sarah IS NOT NULL AND @rx_sarah IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = @pt_sarah AND type = 'PRESCRIPTION_CREATED' AND related_entity = 'Prescription' AND related_entity_id = @rx_sarah
  );

INSERT INTO notifications (user_id, title, message, type, is_read, created_at, read_at, related_entity, related_entity_id)
SELECT @pt_amir,
       'Lab result available',
       'Your HbA1c result has been uploaded and is ready for review.',
       'LAB_RESULT_AVAILABLE', 0, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, 'LabResult', @lab_amir
WHERE @pt_amir IS NOT NULL AND @lab_amir IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = @pt_amir AND type = 'LAB_RESULT_AVAILABLE' AND related_entity = 'LabResult' AND related_entity_id = @lab_amir
  );

-- Emergency notifications: linked to emergency_alerts. The frontend Step 4 can merge these with active emergency alerts and avoid duplicates.
INSERT INTO notifications (user_id, title, message, type, is_read, created_at, read_at, related_entity, related_entity_id)
SELECT @dr_youssef,
       'Emergency alert: Sarah Ben Ali',
       'High severity emergency alert: severe chest discomfort with dizziness.',
       'EMERGENCY_ALERT', 0, DATE_SUB(NOW(), INTERVAL 30 MINUTE), NULL, 'EmergencyAlert', @emergency_sarah
WHERE @dr_youssef IS NOT NULL AND @emergency_sarah IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = @dr_youssef AND type = 'EMERGENCY_ALERT' AND related_entity = 'EmergencyAlert' AND related_entity_id = @emergency_sarah
  );

INSERT INTO notifications (user_id, title, message, type, is_read, created_at, read_at, related_entity, related_entity_id)
SELECT @pt_sarah,
       'Emergency alert received',
       'Your emergency alert was received. A doctor has been notified.',
       'EMERGENCY_ALERT', 1, DATE_SUB(NOW(), INTERVAL 29 MINUTE), DATE_SUB(NOW(), INTERVAL 20 MINUTE), 'EmergencyAlert', @emergency_sarah
WHERE @pt_sarah IS NOT NULL AND @emergency_sarah IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = @pt_sarah AND type = 'EMERGENCY_ALERT' AND related_entity = 'EmergencyAlert' AND related_entity_id = @emergency_sarah
  );

INSERT INTO notifications (user_id, title, message, type, is_read, created_at, read_at, related_entity, related_entity_id)
SELECT @lab_ines,
       'Pending lab upload',
       'Brain MRI for Mariem Chaabane is scheduled and awaiting result upload.',
       'GENERAL', 0, DATE_SUB(NOW(), INTERVAL 6 HOUR), NULL, 'LabResult', NULL
WHERE @lab_ines IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = @lab_ines AND title = 'Pending lab upload' AND message = 'Brain MRI for Mariem Chaabane is scheduled and awaiting result upload.'
  );

-- Audit logs for the audit page demo.
INSERT INTO audit_logs (user_id, user_role, action, entity, entity_id, details, ip_address, timestamp)
SELECT COALESCE(@admin, @dr_leila), 'ADMIN', 'CREATE', 'User', @pt_sarah,
       'Demo seed created patient account Sarah Ben Ali.', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 5 DAY)
WHERE @pt_sarah IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM audit_logs WHERE entity = 'User' AND entity_id = @pt_sarah AND details = 'Demo seed created patient account Sarah Ben Ali.'
  );

INSERT INTO audit_logs (user_id, user_role, action, entity, entity_id, details, ip_address, timestamp)
SELECT @dr_youssef, 'DOCTOR', 'UPDATE', 'Appointment', @appt_sarah_confirmed,
       'Doctor confirmed cardiology follow-up appointment.', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 2 HOUR)
WHERE @dr_youssef IS NOT NULL AND @appt_sarah_confirmed IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM audit_logs WHERE entity = 'Appointment' AND entity_id = @appt_sarah_confirmed AND details = 'Doctor confirmed cardiology follow-up appointment.'
  );

INSERT INTO audit_logs (user_id, user_role, action, entity, entity_id, details, ip_address, timestamp)
SELECT @lab_ines, 'LAB_TECHNICIAN', 'CREATE', 'LabResult', @lab_amir,
       'Lab technician uploaded HbA1c result for Amir Khelifi.', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE @lab_ines IS NOT NULL AND @lab_amir IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM audit_logs WHERE entity = 'LabResult' AND entity_id = @lab_amir AND details = 'Lab technician uploaded HbA1c result for Amir Khelifi.'
  );

INSERT INTO audit_logs (user_id, user_role, action, entity, entity_id, details, ip_address, timestamp)
SELECT @pt_sarah, 'PATIENT', 'CREATE', 'EmergencyAlert', @emergency_sarah,
       'Patient created high severity emergency alert.', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 35 MINUTE)
WHERE @pt_sarah IS NOT NULL AND @emergency_sarah IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM audit_logs WHERE entity = 'EmergencyAlert' AND entity_id = @emergency_sarah AND details = 'Patient created high severity emergency alert.'
  );

COMMIT;
