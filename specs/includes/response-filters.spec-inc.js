'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const R = require('ramda');
const svc = require('../service');
const testHeaders = require('../helper/test-headers');
const generateToken = require('../helper/generate-token');

describe('Response Filters', () => {
	let atrixACL;
	before(async () => {
		atrixACL = svc.service.plugins.acl;
	});

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
		const roles = {
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
				{
					role: 'event-viewer', key: 'name', when: () => true, value: 'buh',
				},
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
				{
					notRole: 'event-viewer', key: 'name', when: () => true, value: 'buh',
				},
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
				{
					role: '!event-viewer', key: 'name', when: () => true, value: 'buh',
				},
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
				{
					role: 'blabla,!event-viewer', key: 'name', when: () => true, value: 'buh',
				},
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
				{
					key: '*.id',
					when: ({ req }) => req.auth.tenantIds.indexOf('ak') >= 0,
					value: 'buh',
				},
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
