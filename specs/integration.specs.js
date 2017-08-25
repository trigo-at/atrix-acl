'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const R = require('ramda');
const svc = require('./service');
const testHeaders = require('./helper/test-headers');
const generateToken = require('./helper/generate-token');

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
				const res = await server.inject({ method: 'get', url: '/prefix/', headers: testHeaders });
				expect(res.statusCode).to.equal(200);
			});

			it('should deny inject routes with config allowInject:false', async () => {
				atrixACL.allowInject = false;
				const res = await server.inject({ method: 'get', url: '/prefix/', headers: testHeaders });
				expect(res.statusCode).to.equal(401);
			});
		});

		describe('Filter endpoints', () => {
			it('should ignore routes defined in config.endpoints', async () => {
				atrixACL.setRules([{ role: 'admin', path: '/*_', method: '*' }]);

				const res = await svc.test
					.post('/prefix/reset')
					.set(testHeaders)
					.set('x-pathfinder-role', 'bla');
				expect(res.statusCode).to.equal(200);
			});
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
				.set(testHeaders)
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
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
				expect(res.body.id).to.equal('242');
			});

			it('allows POST with correct userId', async () => {
				const headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken([])}` });
				const res = await svc.test
					.post('/prefix/pets/242')
					.set(headers)
					.set('x-pathfinder-userid', '42');
				expect(res.statusCode).to.equal(200);
			});

			it('denies with wrong userid', async () => {
				const headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken([])}` });
				const res = await svc.test
					.post('/prefix/pets/242')
					.set(headers)
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
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('allows POST', async () => {
				const res = await svc.test
					.post('/prefix/pets/242')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('allow random ID', async () => {
				const res = await svc.test
					.post('/prefix/pets/1234234')
					.set(testHeaders)
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
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});


			it('denies PUT to route with wrong ID', async () => {
				const res = await svc.test
					.put('/prefix/pets/123')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(401);
			});


			it('denies GET to route with wrong ID', async () => {
				const res = await svc.test
					.get('/prefix/pets/123')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
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
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('allows PUT to wildcard sub-resources', async () => {
				const res = await svc.test
					.put('/prefix/pets/242/toys/bla')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('allows PUT to wildcard sub-resource', async () => {
				const res = await svc.test
					.put('/prefix/pets/242/toys')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('denies PUT to wildcard sub-resource with wrong ID', async () => {
				const res = await svc.test
					.put('/prefix/pets/123/toys')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(401);
			});

			it('denies GET to wildcard sub-resource with wrong method', async () => {
				const res = await svc.test
					.get('/prefix/pets/123/toys')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
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
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
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
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('allows PUT to specific sub-resources with wildcard main-resource', async () => {
				const res = await svc.test
					.put('/prefix/pets/123/toys/242')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('denies PUT to wrong sub-resources with wildcard main-resource', async () => {
				const res = await svc.test
					.put('/prefix/pets/123/toys/123')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(401);
			});

			it('denies PUT to specific sub-resources action with wildcard main-resource', async () => {
				const res = await svc.test
					.put('/prefix/pets/123/toys/242/buy')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
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
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('allows PUT to specific sub-resources with wildcard main-resource', async () => {
				const res = await svc.test
					.put('/prefix/pets/123/toys/242')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('allows PUT to specific sub-resources with wildcard main-resource', async () => {
				const res = await svc.test
					.get('/prefix/pets/242/toys/242')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});

			it('allows PUT to specific sub-resources with wildcard main-resource', async () => {
				const res = await svc.test
					.get('/prefix/pets/123/toys/242')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(200);
			});


			it('denies PUT to wrong sub-resources with wildcard main-resource', async () => {
				const res = await svc.test
					.post('/prefix/pets/123/toys/242')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(401);
			});

			it('denies PUT to specific sub-resources action with wildcard main-resource', async () => {
				const res = await svc.test
					.post('/prefix/pets/242/toys/242')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(401);
			});

			it('denies PUT to wrong sub-resources with wildcard main-resource', async () => {
				const res = await svc.test
					.put('/prefix/pets/123/toys/123')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(401);
			});

			it('denies PUT to specific sub-resources action with wildcard main-resource', async () => {
				const res = await svc.test
					.put('/prefix/pets/123/toys/242/buy')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');
				expect(res.statusCode).to.equal(401);
			});
		});


		describe('onPreResponse', () => {
			beforeEach(async () => {
				atrixACL.setRules([{ role: 'admin', path: '/pets/242', method: '*' }]);
			});

			it('filters _links (hrefs) from response body which are not allowed due to ACLs', async () => {
				const res = await svc.test
					.get('/prefix/pets/242')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');

				const allowedLinks = {
					self: {
						href: '/pets/242',
						method: 'get',
					},
					update:	{
						href: '/pets/242',
						method: 'patch',
					},
					cancel:	false,
					'assign:venue:request': false,
					'cancel:speaker': false,
				};
				expect(res.body._links).to.eql(allowedLinks); //eslint-disable-line
				expect(res.statusCode).to.equal(200);
			});

			it('filters _links (hrefs + transitions) from response body which are not allowed due to ACLs', async () => {
				atrixACL.setRules([
					{ role: 'admin', path: '/pets/242', method: '*' },
					{ role: 'admin', transition: 'cancel:speaker', method: '*' },
				]);
				const res = await svc.test
					.get('/prefix/pets/242')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');

				const allowedLinks = {
					self: {
						href: '/pets/242',
						method: 'get',
					},
					update:	{
						href: '/pets/242',
						method: 'patch',
					},
					cancel:	false,
					'assign:venue:request': false,
					'cancel:speaker': {
						href: '/pets/242/speaker-requests/{requestId}/cancellation',
						method: 'delete',
					},
				};
				expect(res.body._links).to.eql(allowedLinks); //eslint-disable-line
				expect(res.statusCode).to.equal(200);
			});

			it('filters _links (hrefs + wildcard transitions) from response body which are not allowed due to ACLs', async () => {
				atrixACL.setRules([
					{ role: 'admin', path: '/pets/242', method: '*' },
					{ role: 'admin', transition: 'cancel(:*_)', method: '*' },
				]);
				const res = await svc.test
					.get('/prefix/pets/242')
					.set(testHeaders)
					.set('x-pathfinder-role', 'admin');

				const allowedLinks = {
					self: {
						href: '/pets/242',
						method: 'get',
					},
					update:	{
						href: '/pets/242',
						method: 'patch',
					},
					cancel:	{
						href: '/pets/242/cancellation',
						method: 'put',
					},
					'assign:venue:request': false,
					'cancel:speaker': {
						href: '/pets/242/speaker-requests/{requestId}/cancellation',
						method: 'delete',
					},
				};
				expect(res.body._links).to.eql(allowedLinks); //eslint-disable-line
				expect(res.statusCode).to.equal(200);
			});
		});
	});
});
