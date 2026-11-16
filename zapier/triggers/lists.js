'use strict';

// Hidden list triggers that power dropdowns in the action forms (pick a unit, pick a lease).
const { BASE } = require('../lib');

const list = (key, path, noun, label, map) => ({
  key,
  noun,
  display: { label, description: `Lists ${noun.toLowerCase()}s for dropdowns.`, hidden: true },
  operation: {
    perform: async (z) => {
      const res = await z.request({ url: `${BASE}${path}`, params: { limit: 200 } });
      return (res.data.data || []).map(map);
    },
  },
});

module.exports = [
  list('list_units', '/api/v1/units', 'Unit', 'List Units', (u) => ({ id: u.id, name: `${u.property ? u.property.name + ', ' : ''}${u.label}` })),
  list('list_properties', '/api/v1/properties', 'Property', 'List Properties', (p) => ({ id: p.id, name: p.name })),
  list('list_leases', '/api/v1/leases?status=active', 'Lease', 'List Leases', (l) => ({
    id: l.id,
    name: `${l.property ? l.property.name + ', ' : ''}${l.unit ? l.unit.label : ''}${l.tenants && l.tenants.length ? ' (' + l.tenants.map((t) => t.name).join(', ') + ')' : ''}`,
  })),
];
