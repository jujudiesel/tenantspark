'use strict';

// TENANTSPARK_BASE lets the test suite point at a local server.
const BASE = process.env.TENANTSPARK_BASE || 'https://tenantspark.com';

// Zapier works best with flat fields. We keep the nested object too, but lift the useful bits.
const flatten = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const out = { ...obj };
  if (obj.property) {
    out.property_id = obj.property.id;
    out.property_name = obj.property.name;
    if (obj.property.address) out.property_address = obj.property.address;
  }
  if (obj.unit) {
    out.unit_id = obj.unit.id;
    out.unit_label = obj.unit.label;
  }
  if (obj.tenant) {
    out.tenant_id = obj.tenant.id;
    out.tenant_name = obj.tenant.name;
    out.tenant_email = obj.tenant.email;
    out.tenant_phone = obj.tenant.phone;
  }
  if (Array.isArray(obj.tenants) && obj.tenants.length) {
    const primary = obj.tenants.find((t) => t.primary) || obj.tenants[0];
    out.tenant_id = primary.id;
    out.tenant_name = primary.name;
    out.tenant_email = primary.email;
    out.tenant_phone = primary.phone;
    out.tenant_names = obj.tenants.map((t) => t.name).join(', ');
  }
  return out;
};

// Webhook payload { id, type, created_at, charge: {...} } -> one flat record Zapier can map.
const unwrap = (event, objectKey) => {
  const obj = event[objectKey] || {};
  return {
    ...flatten(obj),
    event_id: event.id,
    event_type: event.type,
    event_at: event.created_at,
    // Zapier dedupes on id; one event = one record.
    id: event.id,
    [`${objectKey}_id`]: obj.id,
  };
};

// A REST hook trigger for one event type.
const hookTrigger = ({ key, event, object, noun, label, description, sample }) => ({
  key,
  noun,
  display: { label, description },
  operation: {
    type: 'hook',
    perform: (z, bundle) => [unwrap(bundle.cleanedRequest, object)],
    performSubscribe: async (z, bundle) => {
      const res = await z.request({
        method: 'POST',
        url: `${BASE}/api/v1/hooks`,
        body: { url: bundle.targetUrl, event },
      });
      return res.data.data;
    },
    performUnsubscribe: async (z, bundle) => {
      const res = await z.request({ method: 'DELETE', url: `${BASE}/api/v1/hooks/${bundle.subscribeData.id}` });
      return res.data.data;
    },
    // Real recent data for the "test trigger" step while building a zap.
    performList: async (z, bundle) => {
      const res = await z.request({ url: `${BASE}/api/v1/hooks/sample`, params: { event } });
      return (res.data.data || []).map((e) => unwrap(e, object));
    },
    sample,
  },
});

module.exports = { BASE, flatten, unwrap, hookTrigger };
