const defaultPosition = (_level, index, levels) => (index / (levels.length - 1)) * 100

export function normalizeLevels(input) {
  if (!Array.isArray(input) || input.length < 2) throw new TypeError('At least two effort levels are required')
  const seen = new Set()
  return input.map((level, index) => {
    const item = typeof level === 'string' ? { id: level, label: level } : { ...level }
    if (typeof item.id !== 'string' || item.id.trim() === '' || seen.has(item.id)) throw new TypeError(`Invalid or duplicate effort level at index ${index}`)
    seen.add(item.id)
    return Object.freeze({ id: item.id, label: String(item.label ?? item.id), meta: item.meta })
  })
}

export function createScale(input, options = {}) {
  const levels = normalizeLevels(input)
  const positionForLevel = options.positionForLevel ?? defaultPosition
  const positions = levels.map((level, index) => Number(positionForLevel(level, index, levels)))
  if (positions.some((value, index) => !Number.isFinite(value) || value < 0 || value > 100 || (index > 0 && value <= positions[index - 1]))) throw new TypeError('Custom level positions must be finite, strictly increasing values from 0 to 100')
  return Object.freeze({
    levels, positions: Object.freeze(positions),
    nearest(position) {
      const value = Math.max(0, Math.min(100, Number(position) || 0)); let best = 0
      for (let index = 1; index < positions.length; index += 1) if (Math.abs(positions[index] - value) < Math.abs(positions[best] - value)) best = index
      return { ...levels[best], index: best, position: positions[best] }
    },
    at(id) { const index = levels.findIndex(level => level.id === id); return index < 0 ? undefined : { ...levels[index], index, position: positions[index] } },
  })
}

export function levelsFromModel(model) {
  const efforts = model?.reasoning?.efforts
  if (!Array.isArray(efforts) || efforts.length < 2) return []
  return normalizeLevels(efforts.map(effort => ({ id: effort.id, label: effort.name ?? effort.id, meta: effort })))
}

export function createEffortController({ levels, value, onCommit = () => {}, positionForLevel } = {}) {
  const scale = createScale(levels, { positionForLevel }); let committed = scale.at(value) ?? scale.nearest(0); let preview = committed.position; const listeners = new Set()
  const emit = type => listeners.forEach(listener => listener({ type, preview, committed, snapped: scale.nearest(preview) }))
  return {
    scale, get state() { return { preview, committed, snapped: scale.nearest(preview) } },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    preview(position) { preview = Math.max(0, Math.min(100, Number(position) || 0)); emit('preview'); return this.state },
    cancel() { preview = committed.position; emit('cancel'); return this.state },
    commit(position = preview) { preview = Math.max(0, Math.min(100, Number(position) || 0)); committed = scale.nearest(preview); preview = committed.position; emit('commit'); onCommit(committed); return this.state },
    step(delta) { const next = Math.max(0, Math.min(scale.levels.length - 1, committed.index + Math.sign(delta))); return this.commit(scale.positions[next]) },
  }
}
