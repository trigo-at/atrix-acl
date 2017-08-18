'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const svc = require('./service');


describe('Handlers registrations are intercepted and altered', () => {
	let atrixACL;
	before(async () => {
		await svc.start();
		atrixACL = svc.service.plugins.acl;
	});

	beforeEach(async () => {
		atrixACL.setRules([]);
	});

	describe('ACLs', () => {
		describe('Inject', () => {
			const server = svc.service.endpoints.get('http').instance.server;
			it('should allow inject routes with config allowInject:true', async () => {
				const res = await server.inject({ method: 'get', url: '/prefix/' });
				expect(res.statusCode).to.equal(200);
			});

			it('should deny inject routes with config allowInject:false', async () => {
				atrixACL.allowInject = false;
				const res = await server.inject({ method: 'get', url: '/prefix/' });
				expect(res.statusCode).to.equal(401);
			});
		});

		it('denies GET to / route if no ACLs are defined', async () => {
			const res = await svc.test.get('/prefix/');
			expect(res.statusCode).to.equal(401);
		});

		it('allows GET to / route with admin-role', async () => {
			atrixACL.setRules([{ role: 'admin', path: '/*_', method: '*' }]);

			const res = await svc.test
				.get('/prefix/')
				.set('x-pathfinder-role', 'admin');
			expect(res.statusCode).to.equal(200);
		});

		describe('UserId', () => {
			beforeEach(async () => {
				atrixACL.setRules([
					{ role: 'admin', path: '/pets/:petId', method: '*' },
					{ userId: '42', path: '/pets/:petId', method: '*' },
				]);
			});

			it('allow GET with correct role', async () => {
				const res = await svc.test
					.get('/prefix/pets/242')
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('allows POST with correct userId', async () => {
				const res = await svc.test
					.post('/prefix/pets/242')
					.set('x-pathfinder-userid', '42');
				expect(res.statusCode).to.equal(200);
			});

			it('denies with wrong userid', async () => {
				const res = await svc.test
					.post('/prefix/pets/242')
					.set('x-pathfinder-userid', '123');
				expect(res.statusCode).to.equal(401);
			});
		});
		describe('method:*, id:*', () => {
			beforeEach(async () => {
				atrixACL.setRules([{ role: 'admin', path: '/pets/:petId', method: '*' }]);
			});

			it('allow GET', async () => {
				const res = await svc.test
					.get('/prefix/pets/242')
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('allows POST', async () => {
				const res = await svc.test
					.post('/prefix/pets/242')
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('allow random ID', async () => {
				const res = await svc.test
					.post('/prefix/pets/1234234')
					.set('x-pathfinder-role', 'admin');
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
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});


			it('denies PUT to route with wrong ID', async () => {
				const res = await svc.test
					.put('/prefix/pets/123')
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(401);
			});


			it('denies GET to route with wrong ID', async () => {
				const res = await svc.test
					.get('/prefix/pets/123')
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(401);
			});

			it('denies PUT to route with wrong role', async () => {
				const res = await svc.test
					.get('/prefix/pets/123')
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
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('allows PUT to wildcard sub-resources', async () => {
				const res = await svc.test
					.put('/prefix/pets/242/toys/bla')
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('allows PUT to wildcard sub-resource', async () => {
				const res = await svc.test
					.put('/prefix/pets/242/toys')
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('denies PUT to wildcard sub-resource with wrong ID', async () => {
				const res = await svc.test
					.put('/prefix/pets/123/toys')
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(401);
			});

			it('denies GET to wildcard sub-resource with wrong method', async () => {
				const res = await svc.test
					.get('/prefix/pets/123/toys')
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(401);
			});
		});


		describe('method:PUT ID:* subId:242', () => {
			beforeEach(async () => {
				atrixACL.setRules([{ role: 'admin', path: '/pets/*a/toys/242', method: 'put' }]);
			});

			it('allows PUT to specific sub-resources with wildcard main-resource', async () => {
				const res = await svc.test
					.put('/prefix/pets/242/toys/242')
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('allows PUT to specific sub-resources with wildcard main-resource', async () => {
				const res = await svc.test
					.put('/prefix/pets/123/toys/242')
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('denies PUT to wrong sub-resources with wildcard main-resource', async () => {
				const res = await svc.test
					.put('/prefix/pets/123/toys/123')
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(401);
			});

			it('denies PUT to specific sub-resources action with wildcard main-resource', async () => {
				const res = await svc.test
					.put('/prefix/pets/123/toys/242/buy')
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(401);
			});
		});
	});
});
