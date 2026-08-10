export function required(val, label = 'This field') {
  if (val === null || val === undefined || String(val).trim() === '') return `${label} is required`
  return ''
}

export function phoneCN(val) {
  if (!/^1\d{10}$/.test(String(val))) return 'Please enter an 11-digit phone number starting with 1'
  return ''
}

export function ageRange(val, min = 60, max = 100) {
  const n = Number(val)
  if (Number.isNaN(n)) return 'Age must be a number'
  if (n < min || n > max) return `Age must be between ${min} and ${max}`
  return ''
}

export function passwordRule(val) {
  const s = String(val)
  if (s.length < 6) return 'Password must be at least 6 characters'
  if (!/[A-Za-z]/.test(s) || !/\d/.test(s)) return 'Password must include letters and numbers'
  return ''
}

export function confirmPassword(val, source) {
  if (String(val) !== String(source)) return 'Passwords do not match'
  return ''
}

export function ratingRange(val) {
  const n = Number(val)
  if (n < 1 || n > 5) return 'Rating must be between 1 and 5'
  return ''
}
