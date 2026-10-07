// Read and immutably update nested values by path, e.g. "hero.image.src".
const parts = (path) => String(path).split('.').map((p) => (/^\d+$/.test(p) ? Number(p) : p))

export function getAt(obj, path) {
  return parts(path).reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

export function setAt(obj, path, value) {
  const keys = parts(path)
  const go = (o, i) => {
    if (i === keys.length) return value
    const k = keys[i]
    const base = Array.isArray(o) ? [...o] : { ...(o ?? (typeof k === 'number' ? [] : {})) }
    base[k] = go(o?.[k], i + 1)
    return base
  }
  return go(obj, 0)
}

// Swap uploaded-but-not-yet-deployed image paths for local copies so the
// preview can show them straight away.
export function mapImages(value, map) {
  if (!map || !Object.keys(map).length) return value
  if (typeof value === 'string') return map[value] ?? value
  if (Array.isArray(value)) return value.map((v) => mapImages(v, map))
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapImages(v, map)]))
  return value
}

export const clone = (v) => JSON.parse(JSON.stringify(v))
