# TenantSpark for Zapier

Built with the Zapier Platform CLI. Talks to the public API at https://tenantspark.com/api/v1 (docs: https://tenantspark.com/developers).

Triggers (instant, via REST hooks): new tenant, tenant joined portal, new lease, lease ended, lease signed, rent charged, rent paid, rent late, payment received, payment failed, new repair request, repair status changed, repair done.

Actions: create tenant, create repair request, record payment. Search: find tenant.

```
cd zapier && npm install
npx zapier-platform validate   # schema + publishing checks
npx zapier-platform login      # once, with a deploy key from developer.zapier.com
npx zapier-platform register "TenantSpark"   # first time only; writes .zapierapprc
npx zapier-platform push
```
