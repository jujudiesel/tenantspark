'use strict';

const { hookTrigger, unwrap } = require('../lib');
const S = require('../samples');

const t = (key, event, object, noun, label, description) =>
  hookTrigger({ key, event, object, noun, label, description, sample: unwrap(S[object], object) });

module.exports = [
  t('new_tenant', 'tenant.created', 'tenant', 'Tenant', 'New Tenant', 'Triggers when a tenant is added.'),
  t('tenant_signed_up', 'tenant.signed_up', 'tenant', 'Tenant', 'Tenant Joined Portal', 'Triggers when a tenant creates their portal login.'),
  t('new_lease', 'lease.created', 'lease', 'Lease', 'New Lease', 'Triggers when a lease is created.'),
  t('lease_ended', 'lease.ended', 'lease', 'Lease', 'Lease Ended', 'Triggers when a lease is ended.'),
  t('lease_signed', 'lease.signed', 'document', 'Document', 'Lease Signed', 'Triggers when every tenant has signed a lease document.'),
  t('rent_charged', 'rent.charged', 'charge', 'Rent charge', 'Rent Charged', 'Triggers when a rent charge is created, usually the 1st of the month.'),
  t('rent_paid', 'rent.paid', 'charge', 'Rent charge', 'Rent Paid', 'Triggers when a rent charge is paid in full.'),
  t('rent_late', 'rent.late', 'charge', 'Rent charge', 'Rent Late', 'Triggers when rent is past due after the grace period.'),
  t('payment_received', 'payment.received', 'payment', 'Payment', 'Payment Received', 'Triggers when a payment succeeds, online or recorded by hand.'),
  t('payment_failed', 'payment.failed', 'payment', 'Payment', 'Payment Failed', 'Triggers when an online payment fails.'),
  t('new_repair', 'repair.created', 'repair', 'Repair request', 'New Repair Request', 'Triggers when a tenant or landlord opens a repair request.'),
  t('repair_updated', 'repair.updated', 'repair', 'Repair request', 'Repair Status Changed', 'Triggers when a repair request moves to a new status.'),
  t('repair_done', 'repair.done', 'repair', 'Repair request', 'Repair Done', 'Triggers when a repair request is marked done or closed.'),
];
