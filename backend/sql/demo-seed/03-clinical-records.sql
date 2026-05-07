-- Step 6.3: prescriptions + prescription medicines + lab results + vitals + consultation notes
-- Safe/idempotent: inserts linked records only when matching demo records do not already exist.

START TRANSACTION;

SELECT id INTO @dr_youssef FROM users WHERE email = 'youssef.abbes.doctor@demo.local' LIMIT 1;
SELECT id INTO @dr_leila   FROM users WHERE email = 'leila.trabelsi.doctor@demo.local' LIMIT 1;
SELECT id INTO @dr_omar    FROM users WHERE email = 'omar.mejri.doctor@demo.local' LIMIT 1;
SELECT id INTO @lab_ines   FROM users WHERE email = 'ines.mansouri.lab@demo.local' LIMIT 1;

SELECT id INTO @pt_sarah  FROM users WHERE email = 'sarah.benali.patient@demo.local' LIMIT 1;
SELECT id INTO @pt_amir   FROM users WHERE email = 'amir.khelifi.patient@demo.local' LIMIT 1;
SELECT id INTO @pt_mariem FROM users WHERE email = 'mariem.chaabane.patient@demo.local' LIMIT 1;
SELECT id INTO @pt_nour   FROM users WHERE email = 'nour.hammami.patient@demo.local' LIMIT 1;

SELECT id INTO @appt_sarah_completed FROM appointments
WHERE patient_id = @pt_sarah AND doctor_id = @dr_youssef AND reason = 'Post-checkup medication review'
ORDER BY id LIMIT 1;

SELECT id INTO @appt_nour_completed FROM appointments
WHERE patient_id = @pt_nour AND doctor_id = @dr_leila AND reason = 'Asthma cough and wheezing episode'
ORDER BY id LIMIT 1;

-- Consultation notes
INSERT INTO consultation_notes (appointment_id, doctor_id, chief_complaint, symptoms, examination, diagnosis, treatment, follow_up, created_at)
SELECT @appt_sarah_completed, @dr_youssef,
       'Medication follow-up for hypertension',
       'Occasional morning headaches, no chest pain, no shortness of breath.',
       'BP 138/86, pulse regular, no ankle edema.',
       'Essential hypertension, partially controlled.',
       'Continue lifestyle changes and start low-dose ACE inhibitor.',
       'Review blood pressure diary in 2 weeks.',
       DATE_SUB(NOW(), INTERVAL 9 DAY)
WHERE @appt_sarah_completed IS NOT NULL AND @dr_youssef IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM consultation_notes WHERE appointment_id = @appt_sarah_completed);

INSERT INTO consultation_notes (appointment_id, doctor_id, chief_complaint, symptoms, examination, diagnosis, treatment, follow_up, created_at)
SELECT @appt_nour_completed, @dr_leila,
       'Night cough and wheezing',
       'Dry cough at night, mild wheezing after exercise.',
       'Mild expiratory wheeze, oxygen saturation normal.',
       'Mild asthma exacerbation.',
       'Continue rescue inhaler and review inhaler technique.',
       'Follow up in 1 month or earlier if symptoms worsen.',
       DATE_SUB(NOW(), INTERVAL 5 DAY)
WHERE @appt_nour_completed IS NOT NULL AND @dr_leila IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM consultation_notes WHERE appointment_id = @appt_nour_completed);

-- Prescriptions
INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, prescription_date, diagnosis, instructions, created_at, valid_until)
SELECT @pt_sarah, @dr_youssef, @appt_sarah_completed, DATE_SUB(CURDATE(), INTERVAL 9 DAY),
       'Essential hypertension',
       'Take medication every morning. Continue salt reduction and daily walking.',
       DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_ADD(CURDATE(), INTERVAL 21 DAY)
WHERE @pt_sarah IS NOT NULL AND @dr_youssef IS NOT NULL AND @appt_sarah_completed IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM prescriptions WHERE appointment_id = @appt_sarah_completed);

SELECT id INTO @rx_sarah FROM prescriptions WHERE appointment_id = @appt_sarah_completed LIMIT 1;

INSERT INTO prescription_medicines (prescription_id, medicine_id, dosage, frequency, duration, instructions, quantity)
SELECT @rx_sarah, m.id, '10mg', 'Once daily', 30, 'Take in the morning with water.', 30
FROM medicines m
WHERE m.name = 'Lisinopril 10mg' AND @rx_sarah IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM prescription_medicines pm WHERE pm.prescription_id = @rx_sarah AND pm.medicine_id = m.id
  );

INSERT INTO prescriptions (patient_id, doctor_id, appointment_id, prescription_date, diagnosis, instructions, created_at, valid_until)
SELECT @pt_nour, @dr_leila, @appt_nour_completed, DATE_SUB(CURDATE(), INTERVAL 5 DAY),
       'Mild asthma exacerbation',
       'Use rescue inhaler only when needed. Return earlier if breathing becomes difficult.',
       DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY)
WHERE @pt_nour IS NOT NULL AND @dr_leila IS NOT NULL AND @appt_nour_completed IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM prescriptions WHERE appointment_id = @appt_nour_completed);

SELECT id INTO @rx_nour FROM prescriptions WHERE appointment_id = @appt_nour_completed LIMIT 1;

INSERT INTO prescription_medicines (prescription_id, medicine_id, dosage, frequency, duration, instructions, quantity)
SELECT @rx_nour, m.id, '100mcg', 'As needed', 30, 'Use 1 to 2 puffs during wheezing episodes. Do not exceed prescribed use.', 1
FROM medicines m
WHERE m.name = 'Salbutamol Inhaler' AND @rx_nour IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM prescription_medicines pm WHERE pm.prescription_id = @rx_nour AND pm.medicine_id = m.id
  );

-- Lab results
INSERT INTO lab_results (patient_id, doctor_id, test_name, test_date, results, remarks, file_path, status, uploaded_by, created_at)
SELECT @pt_sarah, @dr_youssef, 'Complete Blood Count', DATE_SUB(CURDATE(), INTERVAL 8 DAY),
       'Hemoglobin 13.2 g/dL, WBC 6.8 x10^9/L, Platelets 248 x10^9/L.',
       'Values within expected range. No urgent abnormality detected.',
       '/demo/labs/sarah-cbc.pdf', 'REVIEWED', @lab_ines, DATE_SUB(NOW(), INTERVAL 8 DAY)
WHERE @pt_sarah IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM lab_results WHERE patient_id = @pt_sarah AND test_name = 'Complete Blood Count' AND test_date = DATE_SUB(CURDATE(), INTERVAL 8 DAY)
  );

INSERT INTO lab_results (patient_id, doctor_id, test_name, test_date, results, remarks, file_path, status, uploaded_by, created_at)
SELECT @pt_amir, @dr_leila, 'HbA1c', DATE_SUB(CURDATE(), INTERVAL 2 DAY),
       'HbA1c 7.4%. Estimated average glucose remains above target.',
       'Doctor review recommended for therapy adjustment.',
       '/demo/labs/amir-hba1c.pdf', 'COMPLETED', @lab_ines, DATE_SUB(NOW(), INTERVAL 2 DAY)
WHERE @pt_amir IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM lab_results WHERE patient_id = @pt_amir AND test_name = 'HbA1c' AND test_date = DATE_SUB(CURDATE(), INTERVAL 2 DAY)
  );

INSERT INTO lab_results (patient_id, doctor_id, test_name, test_date, results, remarks, file_path, status, uploaded_by, created_at)
SELECT @pt_mariem, @dr_omar, 'Brain MRI', DATE_ADD(CURDATE(), INTERVAL 3 DAY),
       NULL,
       'Scheduled imaging exam. Results not uploaded yet.',
       NULL, 'PENDING', @lab_ines, NOW()
WHERE @pt_mariem IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM lab_results WHERE patient_id = @pt_mariem AND test_name = 'Brain MRI' AND test_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY)
  );

-- Vital signs
INSERT INTO vital_signs (patient_id, recorded_at, blood_pressure, heart_rate, temperature, weight, height, oxygen_saturation, respiratory_rate, notes, recorded_by)
SELECT @pt_sarah, DATE_SUB(NOW(), INTERVAL 3 DAY), '138/86', 78, 36.8, 70.2, 165.0, 98, 16,
       'Home BP still slightly high; no acute symptoms.', @dr_youssef
WHERE @pt_sarah IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM vital_signs WHERE patient_id = @pt_sarah AND blood_pressure = '138/86' AND DATE(recorded_at) = DATE_SUB(CURDATE(), INTERVAL 3 DAY)
  );

INSERT INTO vital_signs (patient_id, recorded_at, blood_pressure, heart_rate, temperature, weight, height, oxygen_saturation, respiratory_rate, notes, recorded_by)
SELECT @pt_amir, DATE_SUB(NOW(), INTERVAL 1 DAY), '132/82', 84, 36.7, 88.0, 178.0, 97, 17,
       'Routine diabetes visit; patient reports occasional fatigue.', @dr_leila
WHERE @pt_amir IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM vital_signs WHERE patient_id = @pt_amir AND blood_pressure = '132/82' AND DATE(recorded_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
  );

INSERT INTO vital_signs (patient_id, recorded_at, blood_pressure, heart_rate, temperature, weight, height, oxygen_saturation, respiratory_rate, notes, recorded_by)
SELECT @pt_nour, DATE_SUB(NOW(), INTERVAL 5 DAY), '104/68', 92, 37.1, 42.5, 150.0, 96, 20,
       'Mild wheezing, stable oxygen saturation after inhaler education.', @dr_leila
WHERE @pt_nour IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM vital_signs WHERE patient_id = @pt_nour AND heart_rate = 92 AND DATE(recorded_at) = DATE_SUB(CURDATE(), INTERVAL 5 DAY)
  );

COMMIT;
