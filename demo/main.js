import '../src/web-component.js'
const control = document.querySelector('reasoning-effort-control')
for (const id of ['theme', 'renderer', 'spread', 'density', 'motion']) document.getElementById(id).addEventListener('input', event => control.setAttribute(id, event.currentTarget.value))
