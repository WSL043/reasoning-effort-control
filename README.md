# Reasoning Effort Control

A framework-neutral reasoning-effort control for AI interfaces, with model-aware levels and extensible visual renderers. It separates model capabilities, continuous interaction, commit-time snapping, and visual feedback.

[Interactive playground](https://wsl043.github.io/reasoning-effort-control/) · [Report a bug](https://github.com/WSL043/reasoning-effort-control/issues/new/choose)

## Why it exists

- Uses the exact effort levels published by a model instead of assuming four fixed labels.
- Previews continuously while dragging and commits only a legal model level on release.
- Includes keyboard-native range behavior and respects reduced-motion preferences.
- Ships quiet, cellular, and flow renderers with separate light/dark colors.
- Lets applications register a completely custom rendering algorithm without forking the controller.
- Provides a zero-dependency Web Component and a factory adapter for React. Vue and Svelte can use the Web Component directly.

## Install

```sh
npm install @wsl043/reasoning-effort-control
```

To install the latest source directly from GitHub instead, use `npm install github:WSL043/reasoning-effort-control`.

```js
import '@wsl043/reasoning-effort-control/web-component'
```

```html
<reasoning-effort-control
  levels='[{"id":"off","label":"Off"},{"id":"low","label":"Low"},{"id":"high","label":"High"},{"id":"max","label":"Max"}]'
  value="high"
  renderer="cellular"
  theme="dark">
</reasoning-effort-control>
```

## Custom levels and algorithms

`createScale()` accepts a `positionForLevel` function for non-linear level placement. `defineRenderer()` accepts a rendering function that receives a Canvas 2D context plus normalized ratio, intensity, timing, theme color, and user-tunable options.

```js
import { createScale, defineRenderer } from '@wsl043/reasoning-effort-control'

const scale = createScale(['off', 'low', 'high', 'max'], {
  positionForLevel: (_level, index) => [0, 18, 56, 100][index],
})

defineRenderer('brand-pulse', (context, frame) => {
  context.clearRect(0, 0, frame.width, frame.height)
  // Draw any effect from frame.ratio and frame.intensity.
})
```

The built-in cellular renderer is an original implementation based on observable interaction principles. No proprietary source code or assets are included.

## License

Apache-2.0. See [LICENSE](LICENSE).
