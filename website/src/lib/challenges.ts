// challenges.ts — retos para practicar con validación real contra la DB
export type Challenge = {
  id: string
  level: 'fácil' | 'medio' | 'difícil'
  title: string
  brief: string
  hint: string
  solution: string
  // si true, cualquier query cuyo primer SELECT dé las mismas filas (en cualquier orden) pasa
  relaxed?: boolean
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    level: 'fácil',
    title: 'Primeras filas',
    brief: 'Devuelve el nombre y apellido de los 5 primeros pacientes ordenados por patient_id.',
    hint: 'SELECT ... FROM patients ORDER BY ... LIMIT ...',
    solution: 'SELECT first_name, last_name FROM patients ORDER BY patient_id LIMIT 5'
  },
  {
    id: 'c2',
    level: 'fácil',
    title: 'Filtro por ciudad',
    brief: 'Pacientes de Madrid, ordenados alfabéticamente por apellido.',
    hint: 'WHERE city = ... ORDER BY ...',
    solution: "SELECT first_name, last_name, city FROM patients WHERE city = 'Madrid' ORDER BY last_name"
  },
  {
    id: 'c3',
    level: 'fácil',
    title: 'Contar admisiones',
    brief: '¿Cuántas admisiones hay en total?',
    hint: 'COUNT(*) sobre admissions.',
    solution: 'SELECT COUNT(*) FROM admissions'
  },
  {
    id: 'c4',
    level: 'medio',
    title: 'Media por especialidad',
    brief: 'Salario medio de los médicos por especialidad, redondeado a 2 decimales.',
    hint: 'GROUP BY specialty + ROUND(AVG(...), 2).',
    solution: 'SELECT specialty, ROUND(AVG(salary),2) AS avg_salary FROM doctors GROUP BY specialty'
  },
  {
    id: 'c5',
    level: 'medio',
    title: 'Pacientes ingresados ahora',
    brief: 'Admisiones sin fecha de alta (discharge_date IS NULL) con nombre del paciente.',
    hint: 'JOIN patients + IS NULL.',
    solution: `SELECT p.first_name, p.last_name, a.admission_date, a.diagnosis
FROM admissions a
JOIN patients p ON p.patient_id = a.patient_id
WHERE a.discharge_date IS NULL`
  },
  {
    id: 'c6',
    level: 'medio',
    title: 'LIKE con patrón',
    brief: 'Pacientes cuyo teléfono termina en "011" (patrón).',
    hint: "LIKE '%011'.",
    solution: "SELECT first_name, last_name, phone FROM patients WHERE phone LIKE '%011'"
  },
  {
    id: 'c7',
    level: 'medio',
    title: 'Rango de peso',
    brief: 'Pacientes con peso entre 55 y 65 kg, ordenados por peso descendente.',
    hint: 'BETWEEN + ORDER BY ... DESC.',
    solution: 'SELECT first_name, last_name, weight FROM patients WHERE weight BETWEEN 55 AND 65 ORDER BY weight DESC'
  },
  {
    id: 'c8',
    level: 'difícil',
    title: 'Ingresos por departamento',
    brief: 'Nombre de departamento y número de admisiones, solo los que tienen más de 3, ordenados por count desc.',
    hint: 'JOIN departments + GROUP BY + HAVING COUNT(*) > 3.',
    solution: `SELECT d.name, COUNT(*) AS ingresos
FROM admissions a
JOIN departments d ON d.department_id = a.department_id
GROUP BY d.name
HAVING COUNT(*) > 3
ORDER BY ingresos DESC`
  },
  {
    id: 'c9',
    level: 'difícil',
    title: 'Window: ranking por peso',
    brief: 'Nombre, peso y ROW_NUMBER() OVER (ORDER BY weight DESC) de los pacientes.',
    hint: 'Función ventana sin PARTITION, solo ORDER BY.',
    solution: `SELECT first_name, weight,
  ROW_NUMBER() OVER (ORDER BY weight DESC) AS rn
FROM patients`
  },
  {
    id: 'c10',
    level: 'difícil',
    title: 'Subconsulta con agregado',
    brief: 'Pacientes cuyo peso está por encima de la media global (subconsulta en WHERE).',
    hint: 'WHERE weight > (SELECT AVG(weight) ...).',
    solution: `SELECT first_name, last_name, weight
FROM patients
WHERE weight > (SELECT AVG(weight) FROM patients)
ORDER BY weight DESC`
  }
]

// normaliza filas para comparación laxa: stringifica y ordena
export function normalizeRows(rows: (string | number | null)[][]): string[] {
  return rows
    .map(r => r.map(c => (c === null ? 'NULL' : String(c))).join('|'))
    .sort((a, b) => a.localeCompare(b))
}

export function checkChallenge(
  ch: Challenge,
  userResult: { columns: string[]; rows: (string | number | null)[][]; error?: string },
  solutionResult: { columns: string[]; rows: (string | number | null)[][]; error?: string }
): { pass: boolean; reason: string } {
  if (userResult.error) return { pass: false, reason: `Tu query tiene un error: ${userResult.error}` }
  if (solutionResult.error) return { pass: false, reason: 'Error interno validando (avisa en GitHub issues)' }
  if (userResult.rows.length === 0) return { pass: false, reason: 'Tu query no devuelve filas — revisa los filtros.' }
  const a = normalizeRows(userResult.rows)
  const b = normalizeRows(solutionResult.rows)
  const same = a.length === b.length && a.every((v, i) => v === b[i])
  if (!same) {
    return {
      pass: false,
      reason: `Resultado distinto: esperadas ${b.length} filas, devueltas ${a.length}. Pista: ${ch.hint}`
    }
  }
  return { pass: true, reason: '¡Correcto! El result-set coincide con la solución.' }
}
