-- Step 6.1: users + specialties + medicines
-- Safe/idempotent: uses natural unique keys (email, specialty name, medicine name).

START TRANSACTION;

SET @demo_password_hash := '$2a$10$oacWN6zWDoMmFeQWLWda8u/80PaMzcmKLUEbWvPBXCmcpOsNCwxvG';

-- Specialties
INSERT INTO specialties (name, description) VALUES
  ('Cardiology', 'Diagnosis and treatment of heart and blood vessel conditions.'),
  ('General Medicine', 'Primary care, routine checkups, and common medical conditions.'),
  ('Pediatrics', 'Medical care for infants, children, and adolescents.'),
  ('Neurology', 'Brain, nerve, and neurological disorder care.'),
  ('Radiology', 'Medical imaging review and diagnostic imaging support.'),
  ('Dermatology', 'Skin, hair, and nail condition diagnosis and treatment.'),
  ('Orthopedics', 'Bone, joint, and musculoskeletal care.')
ON DUPLICATE KEY UPDATE
  description = VALUES(description);

-- Base users: doctors, patients, and one lab technician.
-- All demo accounts use password: Demo@123456
INSERT INTO users (active, created_at, email, first_name, last_name, password, phone, role, updated_at) VALUES
  (1, NOW(), 'youssef.abbes.doctor@demo.local', 'Youssef', 'Abbes', @demo_password_hash, '+216 20 111 001', 'DOCTOR', NOW()),
  (1, NOW(), 'leila.trabelsi.doctor@demo.local', 'Leila', 'Trabelsi', @demo_password_hash, '+216 20 111 002', 'DOCTOR', NOW()),
  (1, NOW(), 'omar.mejri.doctor@demo.local', 'Omar', 'Mejri', @demo_password_hash, '+216 20 111 003', 'DOCTOR', NOW()),
  (1, NOW(), 'sarah.benali.patient@demo.local', 'Sarah', 'Ben Ali', @demo_password_hash, '+216 50 222 001', 'PATIENT', NOW()),
  (1, NOW(), 'amir.khelifi.patient@demo.local', 'Amir', 'Khelifi', @demo_password_hash, '+216 50 222 002', 'PATIENT', NOW()),
  (1, NOW(), 'mariem.chaabane.patient@demo.local', 'Mariem', 'Chaabane', @demo_password_hash, '+216 50 222 003', 'PATIENT', NOW()),
  (1, NOW(), 'nour.hammami.patient@demo.local', 'Nour', 'Hammami', @demo_password_hash, '+216 50 222 004', 'PATIENT', NOW()),
  (1, NOW(), 'ines.mansouri.lab@demo.local', 'Ines', 'Mansouri', @demo_password_hash, '+216 30 333 001', 'LAB_TECHNICIAN', NOW())
ON DUPLICATE KEY UPDATE
  active = VALUES(active),
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  phone = VALUES(phone),
  role = VALUES(role),
  updated_at = NOW();

-- Doctor joined-table rows
INSERT INTO doctors (user_id, license_number, specialty_id, years_of_experience, qualifications, consultation_fee, available_days, available_hours)
SELECT u.id, 'TN-MD-CARD-1001', s.id, 12, 'MD, Cardiology residency, echocardiography certification', 95.00, 'MON,TUE,WED,THU', '09:00-16:00'
FROM users u JOIN specialties s ON s.name = 'Cardiology'
WHERE u.email = 'youssef.abbes.doctor@demo.local'
ON DUPLICATE KEY UPDATE
  specialty_id = VALUES(specialty_id),
  years_of_experience = VALUES(years_of_experience),
  qualifications = VALUES(qualifications),
  consultation_fee = VALUES(consultation_fee),
  available_days = VALUES(available_days),
  available_hours = VALUES(available_hours);

INSERT INTO doctors (user_id, license_number, specialty_id, years_of_experience, qualifications, consultation_fee, available_days, available_hours)
SELECT u.id, 'TN-MD-GEN-1002', s.id, 8, 'MD, Family medicine and chronic disease follow-up', 65.00, 'MON,WED,FRI,SAT', '08:30-15:30'
FROM users u JOIN specialties s ON s.name = 'General Medicine'
WHERE u.email = 'leila.trabelsi.doctor@demo.local'
ON DUPLICATE KEY UPDATE
  specialty_id = VALUES(specialty_id),
  years_of_experience = VALUES(years_of_experience),
  qualifications = VALUES(qualifications),
  consultation_fee = VALUES(consultation_fee),
  available_days = VALUES(available_days),
  available_hours = VALUES(available_hours);

INSERT INTO doctors (user_id, license_number, specialty_id, years_of_experience, qualifications, consultation_fee, available_days, available_hours)
SELECT u.id, 'TN-MD-NEUR-1003', s.id, 10, 'MD, Neurology residency, headache and seizure disorders', 90.00, 'TUE,THU,FRI', '10:00-17:00'
FROM users u JOIN specialties s ON s.name = 'Neurology'
WHERE u.email = 'omar.mejri.doctor@demo.local'
ON DUPLICATE KEY UPDATE
  specialty_id = VALUES(specialty_id),
  years_of_experience = VALUES(years_of_experience),
  qualifications = VALUES(qualifications),
  consultation_fee = VALUES(consultation_fee),
  available_days = VALUES(available_days),
  available_hours = VALUES(available_hours);

-- Patient joined-table rows
INSERT INTO patients (user_id, date_of_birth, gender, address, blood_group, emergency_contact, emergency_contact_name, medical_history)
SELECT id, '1989-04-18', 'FEMALE', 'Ariana, Tunis', 'A+', '+216 55 800 101', 'Karim Ben Ali', 'Mild hypertension. Allergy to penicillin reported by patient.'
FROM users WHERE email = 'sarah.benali.patient@demo.local'
ON DUPLICATE KEY UPDATE
  date_of_birth = VALUES(date_of_birth), gender = VALUES(gender), address = VALUES(address), blood_group = VALUES(blood_group),
  emergency_contact = VALUES(emergency_contact), emergency_contact_name = VALUES(emergency_contact_name), medical_history = VALUES(medical_history);

INSERT INTO patients (user_id, date_of_birth, gender, address, blood_group, emergency_contact, emergency_contact_name, medical_history)
SELECT id, '1978-11-03', 'MALE', 'La Marsa, Tunis', 'O+', '+216 55 800 102', 'Nadia Khelifi', 'Type 2 diabetes, currently monitored with oral medication.'
FROM users WHERE email = 'amir.khelifi.patient@demo.local'
ON DUPLICATE KEY UPDATE
  date_of_birth = VALUES(date_of_birth), gender = VALUES(gender), address = VALUES(address), blood_group = VALUES(blood_group),
  emergency_contact = VALUES(emergency_contact), emergency_contact_name = VALUES(emergency_contact_name), medical_history = VALUES(medical_history);

INSERT INTO patients (user_id, date_of_birth, gender, address, blood_group, emergency_contact, emergency_contact_name, medical_history)
SELECT id, '1996-07-22', 'FEMALE', 'Menzah 6, Tunis', 'B+', '+216 55 800 103', 'Sonia Chaabane', 'Recurrent migraines, no known drug allergies.'
FROM users WHERE email = 'mariem.chaabane.patient@demo.local'
ON DUPLICATE KEY UPDATE
  date_of_birth = VALUES(date_of_birth), gender = VALUES(gender), address = VALUES(address), blood_group = VALUES(blood_group),
  emergency_contact = VALUES(emergency_contact), emergency_contact_name = VALUES(emergency_contact_name), medical_history = VALUES(medical_history);

INSERT INTO patients (user_id, date_of_birth, gender, address, blood_group, emergency_contact, emergency_contact_name, medical_history)
SELECT id, '2014-02-10', 'FEMALE', 'Ben Arous', 'AB+', '+216 55 800 104', 'Hanen Hammami', 'Pediatric asthma, uses rescue inhaler when needed.'
FROM users WHERE email = 'nour.hammami.patient@demo.local'
ON DUPLICATE KEY UPDATE
  date_of_birth = VALUES(date_of_birth), gender = VALUES(gender), address = VALUES(address), blood_group = VALUES(blood_group),
  emergency_contact = VALUES(emergency_contact), emergency_contact_name = VALUES(emergency_contact_name), medical_history = VALUES(medical_history);

-- Medicines used by the prescription demo. Kept realistic but generic.
INSERT INTO medicines (name, description, manufacturer, type, stock_quantity, unit_price, requires_prescription) VALUES
  ('Paracetamol 500mg', 'Pain and fever relief tablet.', 'Medis Tunisia', 'TABLET', 420, 2.50, 0),
  ('Ibuprofen 400mg', 'Anti-inflammatory pain relief tablet.', 'PharmaCare', 'TABLET', 180, 4.20, 0),
  ('Amoxicillin 500mg', 'Antibiotic capsule for bacterial infections.', 'Saiph Pharma', 'CAPSULE', 120, 8.90, 1),
  ('Lisinopril 10mg', 'ACE inhibitor used for blood pressure control.', 'CardioMed', 'TABLET', 95, 12.50, 1),
  ('Metformin 850mg', 'Oral diabetes medication.', 'DiabCare', 'TABLET', 160, 7.80, 1),
  ('Salbutamol Inhaler', 'Rescue inhaler for asthma symptoms.', 'Respira', 'INHALER', 55, 18.00, 1),
  ('Omeprazole 20mg', 'Capsule for gastric acidity and reflux.', 'GastroPlus', 'CAPSULE', 130, 6.40, 1),
  ('Cetirizine 10mg', 'Antihistamine tablet for allergies.', 'AllerCare', 'TABLET', 210, 3.60, 0)
ON DUPLICATE KEY UPDATE
  description = VALUES(description), manufacturer = VALUES(manufacturer), type = VALUES(type), stock_quantity = VALUES(stock_quantity),
  unit_price = VALUES(unit_price), requires_prescription = VALUES(requires_prescription);

COMMIT;
