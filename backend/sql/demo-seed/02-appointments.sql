-- Step 6.2: appointments
-- Safe/idempotent: checks patient + doctor + reason before inserting.

START TRANSACTION;

SELECT id INTO @dr_youssef FROM users WHERE email = 'youssef.abbes.doctor@demo.local' LIMIT 1;
SELECT id INTO @dr_leila   FROM users WHERE email = 'leila.trabelsi.doctor@demo.local' LIMIT 1;
SELECT id INTO @dr_omar    FROM users WHERE email = 'omar.mejri.doctor@demo.local' LIMIT 1;

SELECT id INTO @pt_sarah  FROM users WHERE email = 'sarah.benali.patient@demo.local' LIMIT 1;
SELECT id INTO @pt_amir   FROM users WHERE email = 'amir.khelifi.patient@demo.local' LIMIT 1;
SELECT id INTO @pt_mariem FROM users WHERE email = 'mariem.chaabane.patient@demo.local' LIMIT 1;
SELECT id INTO @pt_nour   FROM users WHERE email = 'nour.hammami.patient@demo.local' LIMIT 1;

INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, reason, notes, created_at, updated_at)
SELECT @pt_sarah, @dr_youssef, DATE_ADD(NOW(), INTERVAL 2 DAY), 'CONFIRMED',
       'Follow-up for hypertension control',
       'Patient should bring the last week of home blood pressure readings.',
       DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()
WHERE @pt_sarah IS NOT NULL AND @dr_youssef IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM appointments
    WHERE patient_id = @pt_sarah AND doctor_id = @dr_youssef AND reason = 'Follow-up for hypertension control'
  );

INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, reason, notes, created_at, updated_at)
SELECT @pt_sarah, @dr_youssef, DATE_SUB(NOW(), INTERVAL 9 DAY), 'COMPLETED',
       'Post-checkup medication review',
       'Blood pressure improved but still slightly above target.',
       DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)
WHERE @pt_sarah IS NOT NULL AND @dr_youssef IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM appointments
    WHERE patient_id = @pt_sarah AND doctor_id = @dr_youssef AND reason = 'Post-checkup medication review'
  );

INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, reason, notes, created_at, updated_at)
SELECT @pt_amir, @dr_leila, DATE_ADD(NOW(), INTERVAL 1 DAY), 'PENDING',
       'Diabetes routine control',
       'Patient requested review of glucose diary and diet plan.',
       DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()
WHERE @pt_amir IS NOT NULL AND @dr_leila IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM appointments
    WHERE patient_id = @pt_amir AND doctor_id = @dr_leila AND reason = 'Diabetes routine control'
  );

INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, reason, notes, created_at, updated_at)
SELECT @pt_mariem, @dr_omar, DATE_ADD(NOW(), INTERVAL 4 DAY), 'CONFIRMED',
       'Migraine evaluation',
       'Recurring headaches, sensitivity to light, and sleep disruption.',
       DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()
WHERE @pt_mariem IS NOT NULL AND @dr_omar IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM appointments
    WHERE patient_id = @pt_mariem AND doctor_id = @dr_omar AND reason = 'Migraine evaluation'
  );

INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, reason, notes, created_at, updated_at)
SELECT @pt_nour, @dr_leila, DATE_SUB(NOW(), INTERVAL 5 DAY), 'COMPLETED',
       'Asthma cough and wheezing episode',
       'Symptoms were worse during the night; checked inhaler technique.',
       DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)
WHERE @pt_nour IS NOT NULL AND @dr_leila IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM appointments
    WHERE patient_id = @pt_nour AND doctor_id = @dr_leila AND reason = 'Asthma cough and wheezing episode'
  );

INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, reason, notes, created_at, updated_at)
SELECT @pt_amir, @dr_youssef, DATE_SUB(NOW(), INTERVAL 2 DAY), 'CANCELLED',
       'Chest discomfort screening',
       'Cancelled by patient; advised to reschedule if symptoms return.',
       DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)
WHERE @pt_amir IS NOT NULL AND @dr_youssef IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM appointments
    WHERE patient_id = @pt_amir AND doctor_id = @dr_youssef AND reason = 'Chest discomfort screening'
  );

COMMIT;
