'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const R = require('ramda');
const svc = require('./service');
const testHeaders = require('./helper/test-headers');
const generateToken = require('./helper/generate-token');

describe('Filter endpoints', () => {
	let atrixACL;
	before(async () => {
		atrixACL = svc.service.plugins.acl;
	});
	it('denies GET to / route if no ACLs are defined', async () => {
		const res = await svc.test
			.get('/prefix/')
			.set(testHeaders);

		expect(res.statusCode).to.equal(401);
	});

	it('allows GET to / route with admin-role', async () => {
		atrixACL.setRules([{ role: 'admin', path: '/*_', method: '*' }]);

		const res = await svc.test
			.get('/prefix/')
			.set(testHeaders);
		expect(res.statusCode).to.equal(200);
	});
	it('should ignore routes defined in config.endpoints', async () => {
		atrixACL.setRules([{ role: 'admin', path: '/*_', method: '*' }]);

		const res = await svc.test
			.post('/prefix/reset');
		expect(res.statusCode).to.equal(200);
	});

	it('can use role="*" rule', async () => {
		const roles = {
			'pathfinder-app': { roles: [] },
		};
		const headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken(roles)}` });

		atrixACL.allowInject = true;
		atrixACL.setRules([
			{ role: '*', path: '/*_', method: '*' },
		]);
		const res = await svc.test
			.post('/prefix/pets/242')
			.set(headers);
		expect(res.statusCode).to.equal(200);
	});
	describe('method:*, id:*', () => {
		beforeEach(async () => {
			atrixACL.setRules([{ role: 'admin', path: '/pets/:petId', method: '*' }]);
		});

		it('allow GET', async () => {
			const res = await svc.test
				.get('/prefix/pets/242')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
		});

		it('allows POST', async () => {
			const res = await svc.test
				.post('/prefix/pets/242')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
		});

		it('allow random ID', async () => {
			const res = await svc.test
				.post('/prefix/pets/1234234')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
		});
	});
	describe('method:PUT, id:242', () => {
		beforeEach(async () => {
			atrixACL.setRules([{ role: 'admin', path: '/pets/242', method: 'put' }]);
		});

		it('allows PUT with correct ID', async () => {
			const res = await svc.test
				.put('/prefix/pets/242')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
		});


		it('denies PUT to route with wrong ID', async () => {
			const res = await svc.test
				.put('/prefix/pets/123')
				.set(testHeaders);
			expect(res.statusCode).to.equal(401);
		});


		it('denies GET to route with wrong ID', async () => {
			const res = await svc.test
				.get('/prefix/pets/123')
				.set(testHeaders);
			expect(res.statusCode).to.equal(401);
		});

		it('denies PUT to route with wrong role', async () => {
			const res = await svc.test
				.get('/prefix/pets/123')
				.set(testHeaders)
				.set('x-pathfinder-role', 'editor');
			expect(res.statusCode).to.equal(401);
		});
	});

	describe('method:PUT ID:242 subResource:*', () => {
		beforeEach(async () => {
			atrixACL.setRules([{ role: 'admin', path: '/pets/242/toys(/*_)', method: 'put' }]);
		});

		it('allows PUT to wildcard sub-resources & action', async () => {
			const res = await svc.test
				.put('/prefix/pets/242/toys/bla/buy')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
		});

		it('allows PUT to wildcard sub-resources', async () => {
			const res = await svc.test
				.put('/prefix/pets/242/toys/bla')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
		});

		it('allows PUT to wildcard sub-resource', async () => {
			const res = await svc.test
				.put('/prefix/pets/242/toys')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
		});

		it('denies PUT to wildcard sub-resource with wrong ID', async () => {
			const res = await svc.test
				.put('/prefix/pets/123/toys')
				.set(testHeaders);
			expect(res.statusCode).to.equal(401);
		});

		it('denies GET to wildcard sub-resource with wrong method', async () => {
			const res = await svc.test
				.get('/prefix/pets/123/toys')
				.set(testHeaders);
			expect(res.statusCode).to.equal(401);
		});
	});
	describe('wildcard param in accessed path', () => {
		beforeEach(async () => {
			atrixACL.setRules([{ role: 'admin', path: '/pets/242/toys/*bla', method: 'put' }]);
		});

		it('allows PUT to wildcard path (used in HATR links)', async () => {
			const res = await svc.test
				.put('/prefix/pets/242/toys/{toyId}')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
		});
	});
	describe('method:PUT ID:* subId:242', () => {
		beforeEach(async () => {
			atrixACL.setRules([{ role: 'admin', path: '/pets/*a/toys/242', method: 'put' }]);
		});

		it('allows PUT to specific sub-resources with wildcard main-resource', async () => {
			const res = await svc.test
				.put('/prefix/pets/242/toys/242')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
		});

		it('allows PUT to specific sub-resources with wildcard main-resource', async () => {
			const res = await svc.test
				.put('/prefix/pets/123/toys/242')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
		});

		it('denies PUT to wrong sub-resources with wildcard main-resource', async () => {
			const res = await svc.test
				.put('/prefix/pets/123/toys/123')
				.set(testHeaders);
			expect(res.statusCode).to.equal(401);
		});

		it('denies PUT to specific sub-resources action with wildcard main-resource', async () => {
			const res = await svc.test
				.put('/prefix/pets/123/toys/242/buy')
				.set(testHeaders);
			expect(res.statusCode).to.equal(401);
		});
	});
	describe('method:[GET, PUT] ID:* subId:242', () => {
		beforeEach(async () => {
			atrixACL.setRules([{ role: 'admin', path: '/pets/*a/toys/242', method: ['put', 'get'] }]);
		});

		it('allows PUT to specific sub-resources with wildcard main-resource', async () => {
			const res = await svc.test
				.put('/prefix/pets/242/toys/242')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
		});

		it('allows PUT to specific sub-resources with wildcard main-resource', async () => {
			const res = await svc.test
				.put('/prefix/pets/123/toys/242')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
		});

		it('allows PUT to specific sub-resources with wildcard main-resource', async () => {
			const res = await svc.test
				.get('/prefix/pets/242/toys/242')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
		});

		it('allows PUT to specific sub-resources with wildcard main-resource', async () => {
			const res = await svc.test
				.get('/prefix/pets/123/toys/242')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
		});


		it('denies PUT to wrong sub-resources with wildcard main-resource', async () => {
			const res = await svc.test
				.post('/prefix/pets/123/toys/242')
				.set(testHeaders);
			expect(res.statusCode).to.equal(401);
		});

		it('denies PUT to specific sub-resources action with wildcard main-resource', async () => {
			const res = await svc.test
				.post('/prefix/pets/242/toys/242')
				.set(testHeaders);
			expect(res.statusCode).to.equal(401);
		});

		it('denies PUT to wrong sub-resources with wildcard main-resource', async () => {
			const res = await svc.test
				.put('/prefix/pets/123/toys/123')
				.set(testHeaders);
			expect(res.statusCode).to.equal(401);
		});

		it('denies PUT to specific sub-resources action with wildcard main-resource', async () => {
			const res = await svc.test
				.put('/prefix/pets/123/toys/242/buy')
				.set(testHeaders);
			expect(res.statusCode).to.equal(401);
		});
	});
});