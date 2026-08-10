export function sanitizeText(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function stripDangerousTags(str = '') {
  return String(str).replace(/<\/?(script|iframe|object|embed|link|style)[^>]*>/gi, '')
}

export function hashPassword(input = '') {
  let hash = 0
  const s = String(input)
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash << 5) - hash + s.charCodeAt(i)
    hash |= 0
  }
  return `h_${Math.abs(hash)}_${s.length}`
}
