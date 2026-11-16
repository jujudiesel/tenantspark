'use strict';

const { version } = require('./package.json');
const platformVersion = require('zapier-platform-core').version;
const authentication = require('./authentication');
const triggers = require('./triggers');
const lists = require('./triggers/lists');
const creates = require('./creates');
const searches = require('./searches');

const byKey = (arr) => Object.fromEntries(arr.map((x) => [x.key, x]));

module.exports = {
  version,
  platformVersion,
  flags: { cleanInputData: false },
  authentication: authentication.config,
  beforeRequest: [authentication.includeApiKey],
  afterResponse: [authentication.handleErrors],
  triggers: byKey([...triggers, ...lists]),
  creates: byKey(creates),
  searches: byKey(searches),
};
