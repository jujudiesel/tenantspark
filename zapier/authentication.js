'use strict';

// API key auth. The landlord makes a key under Settings, Integrations, and pastes it into Zapier.
const test = async (z, bundle) => {
  const res = await z.request({ url: `${bundle.authData.base_url || 'https://tenantspark.com'}/api/v1/me` });
  return res.data.data;
};

const config = {
  type: 'custom',
  fields: [
    {
      key: 'api_key',
      label: 'API key',
      required: true,
      type: 'password',
      helpText: 'In TenantSpark go to [Settings, Integrations](https://tenantspark.com/settings/integrations) and click "Make a key". It starts with ts_live_.',
    },
  ],
  test,
  connectionLabel: '{{name}}',
};

// Every request carries the key. Runs before each call.
const includeApiKey = (request, z, bundle) => {
  if (bundle.authData && bundle.authData.api_key) {
    request.headers = request.headers || {};
    request.headers.Authorization = `Bearer ${bundle.authData.api_key}`;
  }
  return request;
};

// Turn our { error: { message } } shape into a readable Zapier error.
const handleErrors = (response, z) => {
  if (response.status === 401) {
    throw new z.errors.RefreshAuthError('That API key is not valid. Make a new one in TenantSpark under Settings, Integrations.');
  }
  if (response.status >= 400) {
    let msg = `TenantSpark returned ${response.status}`;
    try {
      const body = typeof response.data === 'object' ? response.data : JSON.parse(response.content);
      if (body && body.error && body.error.message) msg = body.error.message;
    } catch (e) {
      // keep the generic message
    }
    throw new z.errors.Error(msg, 'TenantSparkError', response.status);
  }
  return response;
};

module.exports = { config, includeApiKey, handleErrors };
