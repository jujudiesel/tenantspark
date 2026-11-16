'use strict';

const { BASE, flatten } = require('../lib');
const S = require('../samples');

const post = (path) => async (z, bundle) => {
  const res = await z.request({ method: 'POST', url: `${BASE}${path}`, body: bundle.inputData });
  return flatten(res.data.data);
};

module.exports = [
  {
    key: 'create_tenant',
    noun: 'Tenant',
    display: { label: 'Create Tenant', description: 'Adds a tenant to TenantSpark. Put them on a lease and invite them from the app.' },
    operation: {
      inputFields: [
        { key: 'name', label: 'Full name', required: true },
        { key: 'email', label: 'Email', type: 'string' },
        { key: 'phone', label: 'Phone', type: 'string' },
        { key: 'notes', label: 'Notes', type: 'text' },
      ],
      perform: post('/api/v1/tenants'),
      sample: flatten(S.tenant.tenant),
    },
  },
  {
    key: 'create_repair',
    noun: 'Repair request',
    display: { label: 'Create Repair Request', description: 'Opens a repair request on a unit. If a tenant lives there they see it in their portal.' },
    operation: {
      inputFields: [
        { key: 'title', label: "What's wrong", required: true, helpText: 'A few words, like "Water heater not heating".' },
        { key: 'unit_id', label: 'Unit', required: true, dynamic: 'list_units.id.name' },
        { key: 'description', label: 'Details', type: 'text' },
        { key: 'location', label: 'Where', choices: ['Kitchen', 'Bathroom', 'Bedroom', 'Living room', 'Basement', 'Outside', 'Shared area', 'Somewhere else'] },
        { key: 'urgency', label: 'Urgency', choices: { routine: 'Routine', urgent: 'Urgent', emergency: 'Emergency' }, default: 'routine' },
        { key: 'assigned_to', label: 'Who is handling it' },
        { key: 'permission_to_enter', label: 'Okay to enter when tenant is out', type: 'boolean' },
      ],
      perform: post('/api/v1/maintenance'),
      sample: flatten(S.repair.repair),
    },
  },
  {
    key: 'record_payment',
    noun: 'Payment',
    display: { label: 'Record Payment', description: 'Records a cash, check or other payment against the oldest open rent charge on a lease.' },
    operation: {
      inputFields: [
        { key: 'lease_id', label: 'Lease', required: true, dynamic: 'list_leases.id.name' },
        { key: 'amount', label: 'Amount (dollars)', required: true, type: 'number' },
        { key: 'method', label: 'How they paid', required: true, choices: { cash: 'Cash', check: 'Check', other: 'Other' }, default: 'check' },
        { key: 'paid_on', label: 'Date paid', type: 'datetime', helpText: 'Leave blank for today.' },
        { key: 'note', label: 'Note' },
      ],
      perform: async (z, bundle) => {
        const body = { ...bundle.inputData };
        if (body.paid_on) body.paid_on = String(body.paid_on).slice(0, 10);
        const res = await z.request({ method: 'POST', url: `${BASE}/api/v1/payments`, body });
        return flatten(res.data.data);
      },
      sample: flatten(S.payment.payment),
    },
  },
];
