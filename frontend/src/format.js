export function formatWhen(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

export function prettyVerdict(verdict) {
  if (!verdict) return "—"
  return verdict.replaceAll("_", " ")
}

export function verdictClass(verdict) {
  if (verdict === "accepted") return "verdict ok"
  if (verdict === "queued" || verdict === "running") return "verdict pending"
  if (!verdict) return "verdict"
  return "verdict bad"
}
