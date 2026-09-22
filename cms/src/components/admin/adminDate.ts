/**
 * A date, in the one shape this admin writes.
 *
 * PAYLOAD'S OWN FORMAT IS `d MMM yyyy`, set once in payload.config with the
 * note that it is global "so every date in the admin agrees". Every date Payload
 * draws obeys it; the ones this project draws by hand did not, because
 * `toLocaleDateString('en-GB', { month: 'short' })` is not the same function —
 * it answers "Sept" where date-fns answers "Sep". One month of the year,
 * four letters, in a row of facts sitting under a list that spells it three.
 *
 * So the month is trimmed to three. Every other short month already is, which
 * is why this went unnoticed until a September file was uploaded.
 *
 * NOT date-fns, THOUGH PAYLOAD USES IT. It is a transitive dependency here, not
 * a declared one, and importing from a package this app never asked for is how
 * a build breaks on someone else's upgrade.
 */
const parts = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function adminDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return parts
    .formatToParts(date)
    .map((part) => (part.type === 'month' ? part.value.slice(0, 3) : part.value))
    .join('')
}
