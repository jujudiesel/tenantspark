'use strict';

const { BASE, flatten } = require('./lib');

module.exports = [
  {
    key: 'find_tenant',
    noun: 'Tenant',
    display: { label: 'Find Tenant', description: 'Finds a tenant by email or name.' },
    operation: {
      inputFields: [{ key: 'query', label: 'Email or name', required: true }],
      perform: async (z, bundle) => {
        const res = await z.request({ url: `${BASE}/api/v1/tenants`, params: { limit: 200 } });
        const q = String(bundle.inputData.query || '').trim().toLowerCase();
        const hit = (res.data.data || []).find((t) => (t.email && t.email.toLowerCase() === q) || (t.name && t.name.toLowerCase() === q))
          || (res.data.data || []).find((t) => t.name && t.name.toLowerCase().includes(q));
        return hit ? [flatten(hit)] : [];
      },
      sample: flatten(require('./samples').tenant.tenant),
    },
  },
];
