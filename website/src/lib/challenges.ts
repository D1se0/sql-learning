// challenges.ts — validación de retos contra la DB (los textos ahora viven en i18n;
// las soluciones SQL son lenguaje y se mantienen intactas en todos los idiomas)
type Translate = (k: string, vars?: Record<string, string | number>) => string

// normaliza filas para comparación laxa: stringifica y ordena
export function normalizeRows(rows: (string | number | null)[][]): string[] {
  return rows
    .map(r => r.map(c => (c === null ? 'NULL' : String(c))).join('|'))
    .sort((a, b) => a.localeCompare(b))
}

export function checkChallenge(
  ch: { hint: string },
  userResult: { columns: string[]; rows: (string | number | null)[][]; error?: string },
  solutionResult: { columns: string[]; rows: (string | number | null)[][]; error?: string },
  t: Translate
): { pass: boolean; reason: string } {
  if (userResult.error) return { pass: false, reason: t('ch.fail.error', { err: userResult.error }) }
  if (solutionResult.error) return { pass: false, reason: t('ch.fail.internal') }
  if (userResult.rows.length === 0) return { pass: false, reason: t('ch.fail.norows') }
  const a = normalizeRows(userResult.rows)
  const b = normalizeRows(solutionResult.rows)
  const same = a.length === b.length && a.every((v, i) => v === b[i])
  if (!same) {
    return {
      pass: false,
      reason: t('ch.fail.diff', { want: b.length, got: a.length, hint: ch.hint })
    }
  }
  return { pass: true, reason: t('ch.pass') }
}
