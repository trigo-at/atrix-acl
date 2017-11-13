'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const R = require('ramda');
const svc = require('./service');
const testHeaders = require('./helper/test-headers');
const generateToken = require('./helper/generate-token');

describe('AtrixACL', () => {
	let atrixACL;

	before(async () => {
		await svc.start();
		atrixACL = svc.service.plugins.acl;
	});

	beforeEach(async () => {
		atrixACL.setRules([]);
		atrixACL.setFilterRules([]);
	});

	describe('ACLs', () => {
		describe('User Data', () => {
			const server = svc.service.endpoints.get('http').instance.server;

			const roles = {
				'pathfinder-app': { roles: ['super-admin', 'ak:admin', 'ak:editor', 'voegb:super-event-viewer', 'ak:super-admin'] },
			};

			beforeEach(() => {
				atrixACL.setRules([{ role: 'super-admin', path: '/*_', method: '*' }]);
			});

			it('should assign user data (roles) to req.auth', async () => {
				const headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken(roles)}` });
				const res = await server.inject({ method: 'get', url: '/prefix/', headers });

				expect(res.request.auth).to.exist;
				expect(res.request.auth.effectiveRoles).to.eql(['super-admin']);
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

			it('should deny inject routes with config allowInject:true and x-atrix-acl-no-inject-bypass header set', async () => {
				atrixACL.allowInject = true;
				const res = await server.inject({ method: 'get', url: '/prefix/', headers: Object.assign({}, testHeaders, { 'x-atrix-acl-no-inject-bypass': '0' }) });
				expect(res.statusCode).to.equal(401);
			});

			it('should delete x-atrix-acl-no-inject-bypass form request headers for futher inject calls to work', async () => {
				const roles = {
					'pathfinder-app': { roles: ['editor1'] },
				};
				const headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken(roles)}` });

				atrixACL.allowInject = true;
				atrixACL.setRules([
					{ role: 'admin', path: '/admin-only(*_)', method: '*' },
					{ role: 'editor1', path: '/with-inject(*_)', method: '*' },
					{ role: 'editor1', path: '/editor1(*_)', method: '*' }]);
				const res = await svc.test
					.get('/prefix/with-inject')
					.set(headers);
				expect(res.statusCode).to.equal(200);
				expect(res.body.inject.inject).to.equal(42);
			});
		});

		describe('Filter endpoints', () => {
			it('should ignore routes defined in config.endpoints', async () => {
				atrixACL.setRules([{ role: 'admin', path: '/*_', method: '*' }]);

				const res = await svc.test
					.post('/prefix/reset');
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
				.set(testHeaders);
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
					.set(testHeaders);
				expect(res.statusCode).to.equal(200);
				expect(res.body.id).to.equal('242');
			});

			it('allows POST with correct userId set in token', async () => {
				const headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken([], 'test@test', '42')}` });
				const res = await svc.test
					.post('/prefix/pets/242')
					.set(headers);
				expect(res.statusCode).to.equal(200);
			});

			it('denies with wrong userid', async () => {
				const headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken([], 'test@test', '44')}` });
				const res = await svc.test
					.post('/prefix/pets/242')
					.set(headers);
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


		describe('onPreResponse', () => {
			beforeEach(async () => {
				atrixACL.setRules([{ role: 'admin', path: '/pets/242', method: '*' }]);
			});

			it('filters _links (hrefs) from response body which are not allowed due to ACLs', async () => {
				const res = await svc.test
					.get('/prefix/pets/242')
					.set(testHeaders);

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
					.set(testHeaders);

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
					.set(testHeaders);

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

			it('filters _links (hrefs + wildcard transitions) from response body array which are not allowed due to ACLs', async () => {
				atrixACL.setRules([
					{ role: 'admin', path: '/pets', method: '*' },
					{ role: 'admin', path: '/pets/242', method: '*' },
					{ role: 'admin', transition: 'cancel(:*_)', method: '*' },
				]);
				const res = await svc.test
					.get('/prefix/pets')
					.set(testHeaders);

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
				res.body.items.forEach((pet) => {
					expect(pet._links).to.eql(allowedLinks); //eslint-disable-line
				});

				expect(res.statusCode).to.equal(200);
			});
		});

		describe('use tenant-ids header context for roles', async () => {
			let headers;
			let roles = {
				'pathfinder-app': {
					roles: ['ak:admin', 'voegb:editor', 'voegb:event-viewer'],
				},
			};

			beforeEach(() => {
				headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken(roles)}` });
				atrixACL.setRules([
					{ role: 'admin', path: '/pets/242', method: '*' },
					{ role: 'editor', path: '/pets/242', method: '*' },
				]);
			});

			it('should use the correct ACLs/roles when multiple tenants are set', async () => {
				atrixACL.setRules([
					{ tenant: 'ak', role: 'admin', path: '/pets/123', method: 'get' },
					{ tenant: 'ak', role: 'event-viewer', path: '/pets/42', method: 'get' },
					{ tenant: 'voegb', role: 'editor', path: '/pets/242', method: 'get' },
				]);

				headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken(roles)}` });

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
				headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken(roles)}` });

				const res = await svc.test
					.get('/prefix/pets/242')
					.set(headers)
					.set('x-pathfinder-tenant-ids', 'ak,voegb');

				expect(res.statusCode).to.equal(401);
			});

			it('should allow routes based on default app ("pathfinder-app") found in token', async () => {
				headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken()}` });

				const res = await svc.test
					.get('/prefix/pets/242')
					.set(headers)
					.set('x-pathfinder-tenant-ids', 'ak,voegb');

				expect(res.statusCode).to.equal(200);
			});

			it('should allow routes based on default app ("pathfinder-app") found in token, with no tenantIds set in header', async () => {
				headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken()}` });

				const res = await svc.test
					.get('/prefix/pets/242')
					.set(headers);

				expect(res.statusCode).to.equal(200);
			});

			it('should deny routes when no default app or tenantIds are set, thus no role is found', async () => {
				headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken([])}` });

				const res = await svc.test
					.get('/prefix/pets/242')
					.set(headers);

				expect(res.statusCode).to.equal(401);
			});
		});
	});

	describe('Filter properties', () => {
		beforeEach(() => {
			atrixACL.setRules([{ role: 'admin', path: '/*_', method: '*' }]);
		});

		it('apply filter if no "when" callback is set', async () => {
			atrixACL.setFilterRules([
				{ key: '*.id', value: 'buh' },
			]);

			const res = await svc.test
				.get('/prefix/pets/242')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
			expect(res.body.id).to.equal('buh');
			expect(res.body._embedded.food.id).to.equal('buh');
		});

		it('filter wildcard properties (recursively)', async () => {
			atrixACL.setFilterRules([
				{ key: '*.id', when: () => true, value: 'buh' },
			]);

			const res = await svc.test
				.get('/prefix/pets/242')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
			expect(res.body.id).to.equal('buh');
			expect(res.body._embedded.food.id).to.equal('buh');
			res.body._embedded.toys.forEach((toy) => {
				expect(toy.id).to.equal('buh');
			});
		});

		it('filter wildcard properties in deeply nested objects (recursively)', async () => {
			atrixACL.setFilterRules([
				{ key: ['*.legacy', '*.legacy_courseId'], when: () => true, value: undefined },
			]);

			const res = await svc.test
				.get('/prefix/attendee/43443209-7408-4df9-ba56-a3ff7509b699')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
			expect(res.body._embedded.event.legacy).to.equal(undefined);
			expect(res.body._embedded.event.legacy_courseId).to.equal(undefined);
		});

		it('NOT filter wildcard properties in deeply nested objects (recursively)', async () => {
			atrixACL.setFilterRules([
				{ key: ['*.legacy', '*.legacy_courseId'], when: () => false, value: undefined },
			]);

			const res = await svc.test
				.get('/prefix/attendee/43443209-7408-4df9-ba56-a3ff7509b699')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
			expect(res.body._embedded.event).to.be.an('object');
			expect(res.body._embedded.event.legacy_courseId).to.equal(123);
			expect(res.body._embedded.event.legacy).to.be.an('object');
			expect(res.body._embedded.event.legacy.courseRemark).to.equal('legacy comment');
		});

		it('should filter sub-objects', async () => {
			atrixACL.setFilterRules([
				{ key: '_embedded.*', when: ({ root, value }) => value.tenantId && value.tenantId !== root.tenantId, value: undefined },
			]);

			const res = await svc.test.get('/prefix/pets/242').set(testHeaders);
			expect(res.statusCode).to.equal(200);
			res.body._embedded.toys.forEach((toy) => {
				if (toy) {
					expect(toy.tenantId).to.equal(res.body.tenantId);
				}
			});

			if (res.body._embedded.food && res.body._embedded.food.tenantId) {
				expect(res.body._embedded.food.tenantId).to.equal(res.body.tenantId);
			}
		});

		it('should filter multiple keys', async () => {
			atrixACL.setFilterRules([
				{ key: ['name', 'id'], when: () => true, value: 'buh' },
			]);

			const res = await svc.test
				.get('/prefix/pets/242')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
			expect(res.body.name).to.equal('buh');
			expect(res.body.id).to.equal('buh');
		});

		it('should ignore properties not present in object', async () => {
			atrixACL.setFilterRules([
				{ key: ['name', 'bla', 'bla.*.foo'], when: () => true, value: 'buh' },
			]);

			const res = await svc.test
				.get('/prefix/pets/242')
				.set(testHeaders);
			expect(res.statusCode).to.equal(200);
			expect(res.body.name).to.equal('buh');
		});


		describe('consider paths', () => {
			it('should only apply filter for specific paths', async () => {
				atrixACL.setFilterRules([
					{ path: '/pets/*_', key: 'name', value: 'buh' },
					{ path: '/pets/123/toys', key: 'id', value: 'buh' },
				]);

				const res = await svc.test
					.get('/prefix/pets/242')
					.set(testHeaders);
				expect(res.statusCode).to.equal(200);
				expect(res.body.name).to.equal('buh');
				expect(res.body.id).to.not.equal('buh');
			});
		});

		describe('consider methods', () => {
			it('should only apply filter for specific methods', async () => {
				atrixACL.setFilterRules([
					{ key: 'name', value: 'buh', method: 'get' },
					{ key: 'id', value: 'buh', method: 'post' },
				]);

				let res = await svc.test
					.get('/prefix/pets/242')
					.set(testHeaders);
				expect(res.statusCode).to.equal(200);
				expect(res.body.name).to.equal('buh');
				expect(res.body.id).to.not.equal('buh');

				res = await svc.test
					.post('/prefix/pets/242')
					.set(testHeaders);
				expect(res.statusCode).to.equal(200);
				expect(res.body.name).to.not.equal('buh');
				expect(res.body.id).to.equal('buh');
			});
		});


		describe('consider roles', () => {
			let headers;
			let roles = {
				'pathfinder-app': {
					roles: ['ak:admin', 'voegb:editor', 'voegb:event-viewer'],
				},
			};

			beforeEach(() => {
				atrixACL.setRules([
					{ role: 'admin', path: '/*_', method: '*' },
					{ role: 'event-viewer', path: '/*_', method: '*' },
					{ role: 'editor', path: '/*_', method: '*' },
				]);
			});

			it('role: should consider the effective roles of the current user (through token & tenant-id header)', async () => {
				headers = R.merge(testHeaders, { 'x-pathfinder-tenant-ids': 'ak,voegb', authorization: `Bearer ${generateToken(roles)}` });
				atrixACL.setFilterRules([
					{ role: 'event-viewer', key: 'name', when: () => true, value: 'buh' },
				]);

				let res = await svc.test
					.get('/prefix/pets/242')
					.set(headers);
				expect(res.statusCode).to.equal(200);
				expect(res.body.name).to.equal('buh');

				// change role -> filter should not be applied
				headers = R.merge(testHeaders, { 'x-pathfinder-tenant-ids': 'ak', authorization: `Bearer ${generateToken(roles)}` });
				res = await svc.test
					.get('/prefix/pets/242')
					.set(headers);
				expect(res.statusCode).to.equal(200);
				expect(res.body.name).to.equal('Pet 42');
			});

			it('notRole: should consider the effective roles of the current user (through token & tenant-id header)', async () => {
				headers = R.merge(testHeaders, { 'x-pathfinder-tenant-ids': 'ak', authorization: `Bearer ${generateToken(roles)}` });
				atrixACL.setFilterRules([
					{ notRole: 'event-viewer', key: 'name', when: () => true, value: 'buh' },
				]);

				const res = await svc.test
					.get('/prefix/pets/242')
					.set(headers);
				expect(res.statusCode).to.equal(200);
				expect(res.body.name).to.equal('buh');
			});

			it('notRole: should consider the effective roles of the current user (through token & tenant-id header)', async () => {
				headers = R.merge(testHeaders, { 'x-pathfinder-tenant-ids': 'ak', authorization: `Bearer ${generateToken(roles)}` });
				atrixACL.setFilterRules([
					{ role: '!event-viewer', key: 'name', when: () => true, value: 'buh' },
				]);

				const res = await svc.test
					.get('/prefix/pets/242')
					.set(headers);
				expect(res.statusCode).to.equal(200);
				expect(res.body.name).to.equal('buh');
			});

			it('comma-separated roles + notRole: should consider the effective roles of the current user (through token & tenant-id header)', async () => {
				headers = R.merge(testHeaders, { 'x-pathfinder-tenant-ids': 'ak', authorization: `Bearer ${generateToken(roles)}` });
				atrixACL.setFilterRules([
					{ role: 'blabla,!event-viewer', key: 'name', when: () => true, value: 'buh' },
				]);

				const res = await svc.test
					.get('/prefix/pets/242')
					.set(headers);
				expect(res.statusCode).to.equal(200);
				expect(res.body.name).to.equal('buh');
			});


			it('request-object should be available in when-callback', async () => {
				headers = R.merge(testHeaders, { 'x-pathfinder-tenant-ids': 'ak', authorization: `Bearer ${generateToken(roles)}` });
				atrixACL.setFilterRules([
					{ key: '*.id',
						when: ({ req }) => {
							return req.auth.tenantIds.indexOf('ak') >= 0;
						},
						value: 'buh' },
				]);

				let res = await svc.test
					.get('/prefix/pets/242')
					.set(headers);
				expect(res.statusCode).to.equal(200);
				expect(res.body.id).to.equal('buh');
				expect(res.body._embedded.food.id).to.equal('buh');
				res.body._embedded.toys.forEach((toy) => {
					expect(toy.id).to.equal('buh');
				});

				headers = R.merge(testHeaders, { 'x-pathfinder-tenant-ids': 'voegb', authorization: `Bearer ${generateToken(roles)}` });
				res = await svc.test
					.get('/prefix/pets/242')
					.set(headers);
				expect(res.statusCode).to.equal(200);
				expect(res.body.id).to.not.equal('buh');
				expect(res.body._embedded.food.id).to.not.equal('buh');
				res.body._embedded.toys.forEach((toy) => {
					expect(toy.id).to.not.equal('buh');
				});
			});
		});
	});
});
