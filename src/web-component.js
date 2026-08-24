import { createEffortController } from './core.js'
import { renderers } from './effects.js'

const template = document.createElement('template')
template.innerHTML = `<style>:host{display:block;color-scheme:light dark;font:500 12px/1.3 system-ui,sans-serif}.labels{display:flex;justify-content:space-between;margin:0 3px 6px;color:color-mix(in srgb,currentColor 62%,transparent)}button{padding:0;border:0;background:none;color:inherit;font:inherit;cursor:pointer}.current{font-weight:700;color:currentColor}.rail{position:relative;height:32px;overflow:hidden;border:1px solid color-mix(in srgb,currentColor 16%,transparent);border-radius:10px;background:color-mix(in srgb,currentColor 7%,transparent)}canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:multiply}:host([theme=dark]) canvas{mix-blend-mode:screen}.thumb{position:absolute;top:50%;left:calc(16px + (100% - 32px) * var(--ratio));width:30px;height:30px;border:.5px solid #0002;border-radius:9px;background:linear-gradient(165deg,#fff,#e7e7e9);box-shadow:0 1px 3px #0004;transform:translate(-50%,-50%);pointer-events:none}input{appearance:none;position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:grab}input:active{cursor:grabbing}.rail:has(input:focus-visible){outline:2px solid Highlight;outline-offset:2px}@media(prefers-reduced-motion:reduce){canvas{display:none}}</style><div class="labels"></div><div class="rail"><canvas></canvas><div class="thumb"></div><input type="range" min="0" max="100" step="0.1"></div>`

export class ReasoningEffortControl extends HTMLElement {
  static observedAttributes = ['levels', 'value', 'renderer', 'theme', 'light-color', 'dark-color', 'density', 'spread', 'motion']
  #controller; #frame = 0; #started = performance.now(); #ignoreValueChange = false
  constructor() { super(); this.attachShadow({ mode: 'open' }).append(template.content.cloneNode(true)) }
  connectedCallback() { this.#setup(); this.#draw(performance.now()) }
  disconnectedCallback() { cancelAnimationFrame(this.#frame) }
  attributeChangedCallback(name) { if (this.isConnected && !(name === 'value' && this.#ignoreValueChange)) this.#setup() }
  #levels() { try { return JSON.parse(this.getAttribute('levels') ?? '["Off","Low","High","Max"]') } catch { return ['Off', 'Low', 'High', 'Max'] } }
  #setup() {
    const levels = this.#levels()
    this.#controller = createEffortController({ levels, value: this.getAttribute('value') ?? (levels.at(-1)?.id ?? levels.at(-1)), onCommit: level => {
      this.#ignoreValueChange = true; this.setAttribute('value', level.id); this.#ignoreValueChange = false
      this.dispatchEvent(new CustomEvent('effort-change', { detail: level, bubbles: true, composed: true }))
    } })
    const labels = this.shadowRoot.querySelector('.labels')
    labels.replaceChildren(...this.#controller.scale.levels.map((level, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = level.label
      button.addEventListener('click', () => { this.#controller.commit(this.#controller.scale.positions[index]); this.#started = performance.now(); this.#renderState() }); return button
    }))
    const input = this.shadowRoot.querySelector('input')
    input.oninput = () => { this.#controller.preview(input.value); this.#renderState() }
    input.onchange = () => { this.#controller.commit(input.value); this.#started = performance.now(); this.#renderState() }
    this.#renderState()
  }
  #renderState() {
    const state = this.#controller.state; this.style.setProperty('--ratio', String(state.preview / 100)); this.shadowRoot.querySelector('input').value = String(state.preview)
    this.shadowRoot.querySelectorAll('.labels button').forEach((button, index) => button.classList.toggle('current', index === state.snapped.index))
  }
  #draw = now => {
    const canvas = this.shadowRoot.querySelector('canvas'); const box = canvas.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.round(box.width * dpr)); const height = Math.max(1, Math.round(box.height * dpr))
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height }
    const context = canvas.getContext('2d'); context.setTransform(dpr, 0, 0, dpr, 0, 0)
    const ratio = (this.#controller?.state.preview ?? 0) / 100; const dark = this.getAttribute('theme') === 'dark'
    renderers.render(this.getAttribute('renderer') ?? 'cellular', context, { width: box.width, height: box.height, ratio, intensity: Math.pow(ratio, .72), elapsed: (now - this.#started) / 1000, time: now / 1000, color: this.getAttribute(dark ? 'dark-color' : 'light-color') ?? (dark ? '#aa63ee' : '#7547b5'), options: { density: Number(this.getAttribute('density') ?? .65), spread: Number(this.getAttribute('spread') ?? .72), motion: Number(this.getAttribute('motion') ?? .7) } })
    this.#frame = requestAnimationFrame(this.#draw)
  }
}

if (!customElements.get('reasoning-effort-control')) customElements.define('reasoning-effort-control', ReasoningEffortControl)
