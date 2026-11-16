'use strict';

// Runs the Zapier app against a real TenantSpark API.
// TENANTSPARK_BASE=http://localhost:3100 TENANTSPARK_API_KEY=ts_live_... node --test test/
const { test } = require('node:test');
const assert = require('node:assert');
const zapier = require('zapier-platform-core');
const App = require('../index');
const samples = require('../samples');

const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

const key = process.env.TENANTSPARK_API_KEY;
const bundle = (extra = {}) => ({ authData: { api_key: key }, ...extra });
const skip = key ? false : 'set TENANTSPARK_API_KEY to run';

test('auth test returns the account', { skip }, async () => {
  const me = await appTester(App.authentication.test, bundle());
  assert.ok(me.name);
});

test('bad key is a RefreshAuthError', { skip }, async () => {
  await assert.rejects(appTester(App.authentication.test, { authData: { api_key: 'ts_live_' + '0'.repeat(48) } }), /not valid/);
});

test('hook trigger: perform, list, subscribe, unsubscribe', { skip }, async () => {
  const t = App.triggers.rent_paid;
  const [rec] = await appTester(t.operation.perform, bundle({ cleanedRequest: samples.charge }));
  assert.strictEqual(rec.tenant_name, 'Dana Ortiz');
  assert.strictEqual(rec.amount, 1200);
  assert.strictEqual(rec.id, samples.charge.id);

  const list = await appTester(t.operation.performList, bundle());
  assert.ok(Array.isArray(list));
  if (list.length) assert.ok(list[0].property_name);

  const sub = await appTester(t.operation.performSubscribe, bundle({ targetUrl: 'https://hooks.zapier.com/hooks/standard/test' }));
  assert.ok(sub.id);
  assert.ok(sub.secret.startsWith('whsec_'));
  const un = await appTester(t.operation.performUnsubscribe, bundle({ subscribeData: sub }));
  assert.strictEqual(un.active, false);
});

test('every trigger has a sample with flat fields', () => {
  for (const [k, t] of Object.entries(App.triggers)) {
    if (t.display.hidden) continue;
    assert.ok(t.operation.sample.id, k);
    assert.ok(t.operation.sample.event_type, k);
  }
});

test('dropdown lists return id/name', { skip }, async () => {
  const units = await appTester(App.triggers.list_units.operation.perform, bundle());
  assert.ok(units.length);
  assert.ok(units[0].id && units[0].name);
  const leases = await appTester(App.triggers.list_leases.operation.perform, bundle());
  assert.ok(leases.length);
});

test('create tenant, create repair, record payment', { skip }, async () => {
  const email = `zap-${Date.now()}@tenantspark.com`;
  const t = await appTester(App.creates.create_tenant.operation.perform, bundle({ inputData: { name: 'Zap Tenant', email } }));
  assert.strictEqual(t.email, email);

  const units = await appTester(App.triggers.list_units.operation.perform, bundle());
  const r = await appTester(App.creates.create_repair.operation.perform, bundle({ inputData: { title: 'Zap made this', unit_id: units[0].id, urgency: 'urgent' } }));
  assert.strictEqual(r.urgency, 'urgent');
  assert.ok(r.property_name);

  const leases = await appTester(App.triggers.list_leases.operation.perform, bundle());
  // Oldest open charge may already be paid in the test account; either a payment or a clear error is fine.
  try {
    const p = await appTester(App.creates.record_payment.operation.perform, bundle({ inputData: { lease_id: leases[0].id, amount: 25, method: 'cash', paid_on: '2026-11-16T00:00:00Z' } }));
    assert.strictEqual(p.amount, 25);
  } catch (e) {
    assert.match(e.message, /No open charge/);
  }

  const found = await appTester(App.searches.find_tenant.operation.perform, bundle({ inputData: { query: email } }));
  assert.strictEqual(found[0].name, 'Zap Tenant');
});
