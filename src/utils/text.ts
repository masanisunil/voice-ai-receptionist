export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function namesMatch(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}

export function naturalDoctorName(name: string): string {
  return name
    .replace(/\bDR\.?\b/i, "Doctor")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b([A-Z]{2,})\b/g, (token) => token[0] + token.slice(1).toLowerCase());
}
