'use strict';

// Sample records shown in Zapier's editor before a user has real data. Same shape as the live API.
const property = { id: 'f4d2b1c0-0000-4000-8000-000000000001', name: '14 Fix St', address: '14 Fix St, Detroit, MI 48202' };
const unit = { id: 'f4d2b1c0-0000-4000-8000-000000000002', label: 'Unit 2' };
const tenants = [{ id: 'f4d2b1c0-0000-4000-8000-000000000003', name: 'Dana Ortiz', email: 'dana@example.com', phone: '313-555-0142', primary: true }];
const ev = (type, objectKey, obj) => ({ id: 'f4d2b1c0-0000-4000-8000-00000000e001', type, created_at: '2026-11-16T17:03:11Z', [objectKey]: obj });

module.exports = {
  tenant: ev('tenant.created', 'tenant', {
    id: tenants[0].id, name: 'Dana Ortiz', email: 'dana@example.com', phone: '313-555-0142', portal: 'invited',
    lease_id: 'f4d2b1c0-0000-4000-8000-000000000004', unit, property, notes: null, created_at: '2026-11-16T17:03:11Z',
  }),
  lease: ev('lease.started', 'lease', {
    id: 'f4d2b1c0-0000-4000-8000-000000000004', status: 'active', start_date: '2026-12-01', end_date: '2027-11-30',
    rent: 1200, deposit: 1200, rent_due_day: 1, unit, property, tenants, notes: null, created_at: '2026-11-16T17:03:11Z',
  }),
  document: ev('lease.signed', 'document', {
    id: 'f4d2b1c0-0000-4000-8000-000000000005', title: 'Lease agreement', status: 'signed', sent_at: '2026-11-15T15:00:00Z', signed_at: '2026-11-16T17:03:11Z',
    lease_id: 'f4d2b1c0-0000-4000-8000-000000000004', unit, property, tenants, created_at: '2026-11-15T15:00:00Z',
  }),
  charge: ev('rent.paid', 'charge', {
    id: 'f4d2b1c0-0000-4000-8000-000000000006', description: 'December 2026 rent', period: '2026-12', due_date: '2026-12-01',
    amount: 1200, late_fee: 0, paid: 1200, balance: 0, status: 'paid', lease_id: 'f4d2b1c0-0000-4000-8000-000000000004',
    unit, property, tenants, created_at: '2026-12-01T11:00:00Z',
  }),
  payment: ev('payment.received', 'payment', {
    id: 'f4d2b1c0-0000-4000-8000-000000000007', amount: 1200, fee: 36, method: 'card', status: 'succeeded', paid_at: '2026-12-01T14:22:00Z',
    note: null, failure_message: null, charge_id: 'f4d2b1c0-0000-4000-8000-000000000006', lease_id: 'f4d2b1c0-0000-4000-8000-000000000004',
    tenant: { id: tenants[0].id, name: 'Dana Ortiz', email: 'dana@example.com' }, unit, property, created_at: '2026-12-01T14:22:00Z',
  }),
  repair: ev('repair.created', 'repair', {
    id: 'f4d2b1c0-0000-4000-8000-000000000008', title: 'Kitchen faucet is leaking', description: 'Drips under the sink all day.',
    location: 'Kitchen', urgency: 'urgent', status: 'new', permission_to_enter: true, assigned_to: null, scheduled_for: null, cost: null, done_at: null,
    tenant: { id: tenants[0].id, name: 'Dana Ortiz', email: 'dana@example.com', phone: '313-555-0142' }, unit, property,
    created_at: '2026-11-16T17:03:11Z', updated_at: '2026-11-16T17:03:11Z',
  }),
};
