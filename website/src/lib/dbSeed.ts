// dbSeed.ts — DB de práctica ficticia (SQLite via sql.js WASM)
// Esquema hospitalario coherente con los ejemplos del cheatsheet original (patients, admissions, doctors)

export const DB_NAME = 'hospital_lab.db'

export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE patients (
  patient_id  INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name  TEXT    NOT NULL,
  last_name   TEXT    NOT NULL,
  birth_date  DATE,
  weight      REAL CHECK (weight > 0),
  city        TEXT,
  phone       TEXT UNIQUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctors (
  doctor_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name  TEXT    NOT NULL,
  last_name   TEXT    NOT NULL,
  specialty   TEXT    NOT NULL,
  salary      NUMERIC(10,2) CHECK (salary > 0),
  hired_at    DATE
);

CREATE TABLE departments (
  department_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL UNIQUE,
  floor           INTEGER,
  budget          NUMERIC(12,2)
);

CREATE TABLE admissions (
  admission_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id     INTEGER NOT NULL REFERENCES patients(patient_id),
  doctor_id      INTEGER REFERENCES doctors(doctor_id),
  department_id  INTEGER REFERENCES departments(department_id),
  admission_date DATE    NOT NULL,
  discharge_date DATE,
  diagnosis      TEXT,
  severity       TEXT CHECK (severity IN ('low','medium','high','critical'))
);

CREATE TABLE lab_results (
  result_id    INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id   INTEGER NOT NULL REFERENCES patients(patient_id),
  test_name    TEXT    NOT NULL,
  value        REAL,
  unit         TEXT,
  performed_at DATE
);
`

export const SEED_SQL = `
-- 🧑‍⚕️ DOCTORS (8)
INSERT INTO doctors (first_name, last_name, specialty, salary, hired_at) VALUES
('Miyuki','Riviera','Cardiología',5400,'2019-03-11'),
('Deunan','Knute','Neurología',6100,'2017-09-04'),
('Lois','McAllister','Traumatología',4850,'2020-01-20'),
('Hal','Jensen','Pediatría',4600,'2021-06-15'),
('Anya','Dmitrievna','Cardiología',5900,'2018-11-02'),
('Bruno','Costa','Neurología',6350,'2016-05-30'),
('Carla','Mendez','Urgencias',5100,'2022-02-14'),
('Diego','Serrano','Urgencias',4980,'2023-08-01');

-- 🏥 DEPARTMENTS (5)
INSERT INTO departments (name, floor, budget) VALUES
('Urgencias',0,450000),
('Cardiología',2,620000),
('Neurología',3,580000),
('Traumatología',1,390000),
('Pediatría',1,310000);

-- 🧑 PATIENTS (20)
INSERT INTO patients (first_name, last_name, birth_date, weight, city, phone) VALUES
('Alice','Nakamura','1991-04-12',64.5,'Madrid','+34-600-111-001'),
('Bruno','Diaz','1985-11-30',88.0,'Barcelona','+34-600-111-002'),
('Carla','Ortiz','2001-07-08',57.2,'Valencia','+34-600-111-003'),
('Diego','Lorca','1978-02-17',95.4,'Madrid','+34-600-111-004'),
('Elena','Marques','1996-09-25',61.0,'Sevilla','+34-600-111-005'),
('Felix','Wong','1988-01-05',80.3,'Barcelona','+34-600-111-006'),
('Gina','Rossi','1999-12-14',55.8,'Valencia','+34-600-111-007'),
('Hector','Vega','1974-06-21',91.7,'Sevilla','+34-600-111-008'),
('Iris','Soler','2003-03-30',52.4,'Madrid','+34-600-111-009'),
('Jonas','Weber','1982-10-09',85.0,'Bilbao','+34-600-111-010'),
('Kira','Nakamura','1994-08-19',59.6,'Madrid','+34-600-111-011'),
('Liam','Torres','1969-05-02',78.9,'Valencia','+34-600-111-012'),
('Mia','Costa','2000-02-27',56.5,'Bilbao','+34-600-202-013'),
('Noa','Blanco','1997-07-16',60.1,'Madrid','+34-600-111-014'),
('Oscar','Rey','1986-12-03',83.2,'Sevilla',NULL),
('Paula','Sanz','1993-04-28',66.7,'Barcelona','+34-600-111-016'),
('Quim','Roca','1971-09-11',90.5,'Valencia','+34-600-111-017'),
('Ruth','Vidal','1998-11-23',58.3,'Bilbao','+34-600-111-018'),
('Sergi','Pujol','1990-01-08',72.4,'Madrid','+34-600-111-019'),
('Tania','Rios','2002-06-06',54.9,'Sevilla','+34-600-111-020');

-- 🏥 ADMISSIONS (25)
INSERT INTO admissions (patient_id, doctor_id, department_id, admission_date, discharge_date, diagnosis, severity) VALUES
(1,1,2,'2025-01-10','2025-01-15','Arritmia','high'),
(2,3,4,'2025-01-12','2025-01-20','Fractura de fémur','medium'),
(3,4,5,'2025-02-01','2025-02-03','Fiebre alta','low'),
(4,7,1,'2025-02-03',NULL,'Dolor torácico','critical'),
(5,1,2,'2025-02-05','2025-02-09','Taquicardia','medium'),
(6,2,3,'2025-02-07','2025-02-18','Migraña crónica','medium'),
(7,4,5,'2025-02-10','2025-02-12','Gastroenteritis','low'),
(8,7,1,'2025-02-12','2025-02-13','Hipertensión','high'),
(9,4,5,'2025-02-15','2025-02-16','Vacuna/observación','low'),
(10,2,3,'2025-02-17',NULL,'Epilepsia','high'),
(11,5,2,'2025-02-20','2025-02-24','Soplo cardíaco','medium'),
(12,7,1,'2025-02-22','2025-02-23','Caída','low'),
(13,3,4,'2025-02-25','2025-03-01','Esguince tobillo','low'),
(14,5,2,'2025-03-01','2025-03-06','Palpitaciones','medium'),
(15,6,3,'2025-03-03','2025-03-10','Pólipo nasal','low'),
(16,8,1,'2025-03-05',NULL,'Fractura costal','high'),
(17,2,3,'2025-03-08','2025-03-12','Neuralgia','medium'),
(18,4,5,'2025-03-10','2025-03-11','Revisión alergia','low'),
(19,6,3,'2025-03-12','2025-03-19','Lumbago','medium'),
(20,8,1,'2025-03-14','2025-03-15','Intoxicación leve','low'),
(1,5,2,'2025-03-20',NULL,'Control arritmia','medium'),
(2,6,3,'2025-04-01','2025-04-04','Dolor cervical','low'),
(5,1,2,'2025-04-05','2025-04-10','Control cardiaco','low'),
(9,7,1,'2025-04-08',NULL,'Asma','medium'),
(11,5,2,'2025-04-10','2025-04-14','Arritmia','high');

-- 🧪 LAB_RESULTS (30)
INSERT INTO lab_results (patient_id, test_name, value, unit, performed_at) VALUES
(1,'HDL',42,'mg/dL','2025-01-11'),
(1,'LDL',130,'mg/dL','2025-01-11'),
(2,'Glucosa',95,'mg/dL','2025-01-13'),
(2,'HDL',38,'mg/dL','2025-01-13'),
(3,'Glucosa',88,'mg/dL','2025-02-02'),
(4,'Troponina',0.03,'ng/mL','2025-02-03'),
(4,'HDL',45,'mg/dL','2025-02-03'),
(5,'HDL',51,'mg/dL','2025-02-06'),
(5,'LDL',118,'mg/dL','2025-02-06'),
(6,'Glucosa',110,'mg/dL','2025-02-08'),
(7,'Glucosa, ayunas',86,'mg/dL','2025-02-11'),
(8,'Glucosa',132,'mg/dL','2025-02-13'),
(9,'Hemograma WBC',7.2,'10^3/µL','2025-02-15'),
(10,'RMN',1,NULL,'2025-02-18'),
(11,'HDL',48,'mg/dL','2025-02-21'),
(12,'Glucosa',92,'mg/dL','2025-02-23'),
(13,'RCR',12,'mm/h','2025-02-26'),
(14,'HDL',55,'mg/dL','2025-03-02'),
(14,'LDL',105,'mg/dL','2025-03-02'),
(15,'Glucosa',101,'mg/dL','2025-03-04'),
(16,'Troponina',0.5,'ng/mL','2025-03-06'),
(17,'HDL',40,'mg/dL','2025-03-09'),
(18,'Glucosa',90,'mg/dL','2025-03-11'),
(19,'PCR',8.7,'mg/L','2025-03-13'),
(20,'Glucosa',87,'mg/dL','2025-03-15'),
(1,'HDL',44,'mg/dL','2025-03-21'),
(5,'LDL',112,'mg/dL','2025-04-06'),
(9,'Hemograma WBC',9.8,'10^3/µL','2025-04-09'),
(11,'HDL',50,'mg/dL','2025-04-11'),
(20,'PCR',5.2,'mg/L','2025-04-16');
`
