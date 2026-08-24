export function createReactEffortControl(React) {
  return function ReasoningEffortControl({ levels, value, renderer = 'cellular', onChange, ...attributes }) {
    const ref = React.useRef(null)
    React.useEffect(() => { const element = ref.current; const change = event => onChange?.(event.detail); element?.addEventListener('effort-change', change); return () => element?.removeEventListener('effort-change', change) }, [onChange])
    return React.createElement('reasoning-effort-control', { ...attributes, ref, levels: JSON.stringify(levels), value, renderer })
  }
}
