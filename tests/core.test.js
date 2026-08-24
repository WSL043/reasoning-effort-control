import assert from 'node:assert/strict'
import test from 'node:test'
import { createEffortController, createScale, levelsFromModel } from '../src/core.js'
import { RendererRegistry } from '../src/effects.js'

test('arbitrary model levels stay authoritative', () => {
  assert.deepEqual(levelsFromModel({ reasoning: { efforts: [{ id: 'minimal', name: 'Minimal' }, { id: 'xhigh', name: 'XHigh' }] } }).map(level => level.id), ['minimal', 'xhigh'])
})

test('continuous preview snaps only on commit', () => {
  const commits = []; const control = createEffortController({ levels: ['Off', 'Low', 'High', 'Max'], value: 'Off', onCommit: level => commits.push(level.id) })
  control.preview(55); assert.equal(control.state.preview, 55); assert.equal(control.state.committed.id, 'Off'); control.commit(); assert.equal(control.state.committed.id, 'High'); assert.deepEqual(commits, ['High'])
})

test('custom monotonic level positioning is supported', () => {
  const scale = createScale(['A', 'B', 'C'], { positionForLevel: (_level, index) => [0, 25, 100][index] }); assert.equal(scale.nearest(30).id, 'B')
  assert.throws(() => createScale(['A', 'B'], { positionForLevel: () => 50 }), /strictly increasing/)
})

test('applications can register their own visual algorithm', () => {
  const registry = new RendererRegistry().define('brand-pulse', (_context, frame) => frame.ratio); assert.equal(registry.list()[0], 'brand-pulse'); assert.equal(registry.render('brand-pulse', {}, { ratio: .75 }), .75)
})
