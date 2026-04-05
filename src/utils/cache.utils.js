// Simple in-memory cache with TTL

const cacheStore = new Map()

const getCache = (key) => {
  const entry = cacheStore.get(key)
  if (!entry) return null

  const { value, expiresAt } = entry
  if (expiresAt && Date.now() > expiresAt) {
    cacheStore.delete(key)
    return null
  }
  return value
}

const setCache = (key, value, ttlMs = 60000) => {
  const expiresAt = ttlMs ? Date.now() + ttlMs : null
  cacheStore.set(key, { value, expiresAt })
}

const clearCacheByPrefix = (prefix) => {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key)
    }
  }
}

const clearAllCache = () => {
  cacheStore.clear()
}

module.exports = { getCache, setCache, clearCacheByPrefix, clearAllCache }
