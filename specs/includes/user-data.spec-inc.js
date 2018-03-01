'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const R = require('ramda');
const svc = require('../service');
const testHeaders = require('../helper/test-headers');
const generateToken = require('../helper/generate-token');

describe('User Data', () => {
	let atrixACL;
	before(async () => {
		atrixACL = svc.service.plugins.acl;
	});
	const { server } = svc.service.endpoints.get('http').instance;

	const roles = {
		'pathfinder-app': { roles: ['super-admin', 'ak:admin', 'ak:editor', 'voegb:super-event-viewer', 'ak:super-admin'] },
	};

	beforeEach(() => {
		atrixACL.setRules([{ role: 'super-admin', path: '/*_', method: '*' }]);
	});

	it('should assign user data "effectiveRoles" to req.auth', async () => {
		const headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken(roles)}` });
		const res = await server.inject({ method: 'get', url: '/prefix/', headers });

		expect(res.request.auth).to.exist;
		expect(res.request.auth.effectiveRoles).to.eql(['super-admin']);
	});
	it('should assign user data "roles" to req.auth', async () => {
		const headers = R.merge(testHeaders, { 'x-pathfinder-tenant-ids': 'ak,voegb', authorization: `Bearer ${generateToken(roles)}` });
		const res = await server.inject({ method: 'get', url: '/prefix/', headers });

		expect(res.request.auth).to.exist;
		expect(res.request.auth.roles).to.eql([
			{ tenant: 'pathfinder-app', role: 'super-admin', global: true },
			{ tenant: 'ak', role: 'admin', global: false },
			{ tenant: 'ak', role: 'editor', global: false },
			{ tenant: 'voegb', role: 'super-event-viewer', global: false },
			{ tenant: 'ak', role: 'super-admin', global: false },
		]);
	});

	it('should assign user data (roles) to req.auth based on tenantIds set in header', async () => {
		let headers = R.merge(testHeaders, { 'x-pathfinder-tenant-ids': 'ak', authorization: `Bearer ${generateToken(roles)}` });
		let res = await server.inject({ method: 'get', url: '/prefix/', headers });

		expect(res.request.auth).to.exist;
		expect(res.request.auth.effectiveRoles).to.have.all.members(['super-admin', 'admin', 'editor']);

		headers = R.merge(testHeaders, { 'x-pathfinder-tenant-ids': 'ak,voegb', authorization: `Bearer ${generateToken(roles)}` });
		res = await server.inject({ method: 'get', url: '/prefix/', headers });

		expect(res.request.auth).to.exist;
		expect(res.request.auth.effectiveRoles).to.have.all.members(['super-event-viewer', 'super-admin', 'admin', 'editor']);
	});
});
