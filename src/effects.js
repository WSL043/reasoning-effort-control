export class RendererRegistry {
  #renderers = new Map()
  define(name, renderer) {
    if (!/^[a-z][a-z0-9-]*$/u.test(name) || typeof renderer !== 'function') throw new TypeError('Renderer names must be kebab-case and renderers must be functions')
    this.#renderers.set(name, renderer); return this
  }
  get(name) { return this.#renderers.get(name) }
  list() { return [...this.#renderers.keys()] }
  render(name, context, frame) { const renderer = this.get(name); if (!renderer) throw new RangeError(`Unknown renderer: ${name}`); return renderer(context, frame) }
}

const clamp = value => Math.max(0, Math.min(1, value))
const smooth = value => { const x = clamp(value); return x * x * (3 - 2 * x) }
const hash = (x, y) => ((Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1 + 1) % 1
const clear = (context, frame) => context.clearRect(0, 0, frame.width, frame.height)

export function quietRenderer(context, frame) { clear(context, frame) }

export function cellularRenderer(context, frame) {
  clear(context, frame)
  const ratio = clamp(frame.ratio)
  if (ratio <= 0) return
  const density = Math.round(40 + clamp(frame.options?.density ?? .65) * 48); const rows = 6
  const cellWidth = frame.width / density; const cellHeight = frame.height / rows
  const spread = .16 + clamp(frame.options?.spread ?? .72) * .7; const movement = .15 + clamp(frame.options?.motion ?? .7) * 1.4
  const elapsed = Math.max(0, frame.elapsed); const maxReveal = ratio > .995 ? smooth(elapsed / .9) : 0
  const tailFront = ratio > .995 ? 1.02 - maxReveal * 1.08 : Math.max(.015, ratio * (1 - spread * smooth(elapsed / 1.8)))
  context.fillStyle = frame.color
  for (let column = 0; column < density; column += 1) {
    const x = (column + .5) / density
    if (x > ratio || x < tailFront) continue
    const distance = (ratio - x) / Math.max(.001, ratio - tailFront)
    for (let row = 0; row < rows; row += 1) {
      const random = hash(column, row); const arrival = elapsed - random * .72 - distance * .55
      if (arrival <= 0) continue
      const flicker = .45 + .55 * smooth(Math.sin(frame.time * (5 + movement * 7) + x * 34 + random * 9) * .5 + .5)
      const envelope = Math.pow(1 - distance, .64) * (ratio < .995 ? .72 : 1)
      context.globalAlpha = clamp((.08 + envelope * flicker * .76) * frame.intensity)
      const inset = Math.max(1, cellWidth * .13)
      context.fillRect(column * cellWidth + inset, row * cellHeight + 1, Math.max(1, cellWidth - inset * 2), Math.max(1, cellHeight - 2))
    }
  }
  context.globalAlpha = 1
}

export function flowRenderer(context, frame) {
  clear(context, frame); const ratio = clamp(frame.ratio); if (ratio <= 0) return
  context.strokeStyle = frame.color; context.lineCap = 'round'
  for (let row = 0; row < 5; row += 1) {
    const phase = frame.time * (.6 + row * .08); const end = frame.width * ratio; context.beginPath()
    for (let x = 0; x <= end; x += 4) { const y = frame.height * ((row + 1) / 6) + Math.sin(x * .06 + phase + row) * (1.5 + frame.intensity * 2); if (x === 0) context.moveTo(x, y); else context.lineTo(x, y) }
    context.globalAlpha = (.08 + row * .025) * frame.intensity; context.lineWidth = 1; context.stroke()
  }
  context.globalAlpha = 1
}

export const renderers = new RendererRegistry().define('quiet', quietRenderer).define('cellular', cellularRenderer).define('flow', flowRenderer)
export function defineRenderer(name, renderer) { renderers.define(name, renderer) }
