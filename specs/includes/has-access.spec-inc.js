'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0, one-var: 0, one-var-declaration-per-line: 0 */

const { expect } = require('chai');
const svc = require('../service');
const testHeaders = require('../helper/test-headers');
const generateToken = require('../helper/generate-token');
const { merge } = require('ramda');

describe('req.hasAccess', () => {
	let atrixACL, headers;
	const roles = {
		'pathfinder-app': {
			roles: ['ak:admin', 'voegb:editor', 'voegb:event-viewer'],
		},
	};
	before(async () => {
		atrixACL = svc.service.plugins.acl;
	});
	beforeEach(async () => {
		atrixACL.setRules([{ role: 'admin', path: '/pets/242', method: '*' }]);
		headers = merge(testHeaders, { 'x-pathfinder-tenant-ids': 'ak,voegb', authorization: `Bearer ${generateToken(roles)}` });
	});

	it('grants access to resource when matching rule found', async () => {
		atrixACL.setRules([
			{ role: 'admin', path: '(/*_)', method: '*' },
		]);
		const res = await svc.test
			.get('/prefix/has-access?tenantId=ak')
			.set(headers);
		expect(res.statusCode).to.equal(204);
	});

	it('denies access to resource when no matching rule found', async () => {
		atrixACL.setRules([
			{ role: 'admin', path: '(/*_)', method: '*' },
		]);
		const res = await svc.test
			.get('/prefix/has-access?tenantId=voegb')
			.set(headers);
		expect(res.statusCode).to.equal(403);
	});
});
