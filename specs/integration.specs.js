'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const svc = require('./service');
const tmpObj = require('./tmp-obj');

describe('AtrixACL', () => {
	let atrixACL;

	before(async () => {
		await svc.start();
		atrixACL = svc.service.plugins.acl;
	});
	after(async () => {
		await svc.stop();
	});

	beforeEach(async () => {
		atrixACL.setRules([]);
		atrixACL.setFilterRules([]);
		atrixACL.setPayloadFilterRules([]);
		tmpObj.obj = undefined;
	});

	describe('ACLs', () => {
		require('./payload-filters.spec-inc'); //eslint-disable-line
		require('./user-data.spec-inc'); //eslint-disable-line
		require('./inject.spec-inc'); //eslint-disable-line
		require('./filter-endpoints.spec-inc'); //eslint-disable-line
		require('./filter-fsm-transition-links.spec-inc'); //eslint-disable-line
		require('./user-id-based-rules'); //eslint-disable-line
		require('./tenantId-aware-role-evaluation.spec-inc'); //eslint-disable-line
	});

	require('./response-filters.spec-inc'); //eslint-disable-line
});
