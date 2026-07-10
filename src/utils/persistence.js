const STORAGE_PREFIX = 'quasar-app:'

export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function saveJson(key, value) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
  } catch {
    // Ignore quota errors or private browsing.
  }
}
