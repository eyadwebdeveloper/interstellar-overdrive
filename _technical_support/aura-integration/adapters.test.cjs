// Run: see run_adapter_test.sh. Checks the Tier 0 vs Tier 1/2 separation invariant.
const assert = require('node:assert/strict')
const { snapshotToAlerts, isSnapshot } = require('/tmp/aura-out/api/adapters.js')
const snap = {
  astro_id: 'cmdr', day: 96, generated_at: new Date().toISOString(), simulated: true,
  tier0: { alerts: [{ scope: 'body', astro_id: 'cmdr', station_id: 'S1', signal: 'resting_hr', rule: 'R2', level: 'urgent_review', alert_day: 95, end_day: 96, explanation: 'x' }] },
  tier1: { notices: [{ day: 96, source: 'tier1a_isolation_forest', strangeness: 0.9, explanation: 'y' }] },
  tier2: { risk: { band: 'established', confidence: 0.8, drivers: ['d'] }, forecast: null },
}
const out = snapshotToAlerts(snap, [])
const rules = out.filter((a) => a.kind === 'rule')
assert.equal(rules.length, 1); assert.ok(rules[0].id.startsWith('t0:')); assert.equal(rules[0].level, 'emergency')
const adv = out.filter((a) => a.kind === 'advisory')
assert.equal(adv.length, 2); assert.ok(adv.every((a) => !a.id.startsWith('t0:') && a.ruleId === undefined))
// no tier0 alerts -> no official alerts, even with strong Tier 1/2 output
snap.tier0.alerts = []
assert.equal(snapshotToAlerts(snap, []).filter((a) => a.kind === 'rule').length, 0)
// risk band none -> no advisory card
snap.tier2.risk.band = 'none'
assert.equal(snapshotToAlerts(snap, []).filter((a) => a.id.startsWith('t2a')).length, 0)
assert.equal(isSnapshot(null), false); assert.equal(isSnapshot({ astro_id: 1 }), false); assert.equal(isSnapshot(snap), true)
console.log('adapter tests passed')
