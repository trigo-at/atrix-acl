'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const {expect} = require('chai');
const R = require('ramda');
const svc = require('../service');
const testHeaders = require('../helper/test-headers');
const generateToken = require('../helper/generate-token');

describe('tenantId aware role evaluation', () => {
	let atrixACL;
	before(async () => {
		atrixACL = svc.service.plugins.acl;
	});
	let headers;
	let roles = {
		'pathfinder-app': {
			roles: ['ak:admin', 'voegb:editor', 'voegb:event-viewer'],
		},
	};

	beforeEach(() => {
		headers = R.merge(testHeaders, {
			authorization: `Bearer ${generateToken(roles)}`,
		});
		atrixACL.setRules([
			{role: 'admin', path: '/pets/242', method: '*'},
			{role: 'editor', path: '/pets/242', method: '*'},
		]);
	});

	it('should use the correct ACLs/roles when multiple tenants are set', async () => {
		atrixACL.setRules([
			{
				tenant: 'ak',
				role: 'admin',
				path: '/pets/123',
				method: 'get',
			},
			{
				tenant: 'ak',
				role: 'event-viewer',
				path: '/pets/42',
				method: 'get',
			},
			{
				tenant: 'voegb',
				role: 'editor',
				path: '/pets/242',
				method: 'get',
			},
		]);

		headers = R.merge(testHeaders, {
			authorization: `Bearer ${generateToken(roles)}`,
		});

		let res = await svc.test
			.get('/prefix/pets/242')
			.set(headers)
			.set('x-pathfinder-tenant-ids', 'ak,voegb');

		expect(res.statusCode).to.equal(200);

		res = await svc.test
			.get('/prefix/pets/123')
			.set(headers)
			.set('x-pathfinder-tenant-ids', 'ak');

		expect(res.statusCode).to.equal(200);

		res = await svc.test
			.get('/prefix/pets/123')
			.set(headers)
			.set('x-pathfinder-tenant-ids', 'voegb');

		expect(res.statusCode).to.equal(401);

		res = await svc.test
			.get('/prefix/pets/42')
			.set(headers)
			.set('x-pathfinder-tenant-ids', 'ak,voegb');

		expect(res.statusCode).to.equal(401);
	});

	it('should allow routes based on roles & tenantIds set through header', async () => {
		const res = await svc.test
			.get('/prefix/pets/242')
			.set(headers)
			.set('x-pathfinder-tenant-ids', 'ak,voegb');

		expect(res.statusCode).to.equal(200);
	});

	it('should deny routes based on tenantIds found in header', async () => {
		roles = {
			ak: {
				roles: ['event-viewer'],
			},
		};
		headers = R.merge(testHeaders, {
			authorization: `Bearer ${generateToken(roles)}`,
		});

		const res = await svc.test
			.get('/prefix/pets/242')
			.set(headers)
			.set('x-pathfinder-tenant-ids', 'ak,voegb');

		expect(res.statusCode).to.equal(401);
	});

	it('should allow routes based on default app ("pathfinder-app") found in token', async () => {
		headers = R.merge(testHeaders, {
			authorization: `Bearer ${generateToken()}`,
		});

		const res = await svc.test
			.get('/prefix/pets/242')
			.set(headers)
			.set('x-pathfinder-tenant-ids', 'ak,voegb');

		expect(res.statusCode).to.equal(200);
	});

	it('should allow routes based on default app ("pathfinder-app") found in token, with no tenantIds set in header', async () => {
		headers = R.merge(testHeaders, {
			authorization: `Bearer ${generateToken()}`,
		});

		const res = await svc.test.get('/prefix/pets/242').set(headers);

		expect(res.statusCode).to.equal(200);
	});

	it('should deny routes when no default app or tenantIds are set, thus no role is found', async () => {
		headers = R.merge(testHeaders, {
			authorization: `Bearer ${generateToken([])}`,
		});

		const res = await svc.test.get('/prefix/pets/242').set(headers);

		expect(res.statusCode).to.equal(401);
	});
});
