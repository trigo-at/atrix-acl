
/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0, one-var-declaration-per-line: 0, one-var: 0 */

const { expect } = require('chai');
const { merge, contains } = require('ramda');
const svc = require('../service');
const testHeaders = require('../helper/test-headers');
const generateToken = require('../helper/generate-token');

describe('Entity ACLs', () => {
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
		headers = merge(testHeaders, { 'x-pathfinder-tenant-ids': 'ak,voegb', authorization: `Bearer ${generateToken(roles)}` });
		atrixACL.setRules([{
			role: 'admin',
			method: '*',
			entity: 'event',
			path: '/events/:id(/*_)',
			idParam: 'id',
		}, {
			role: 'admin',
			method: '*',
			entity: 'budget',
			path: '/events/:id/budget/:bid(/*_)',
			idParam: 'bid',
		}, {
			role: 'admin',
			method: '*',
			entity: 'budget',
			path: '/persons/:id/budget/:bid(/*_)',
			idParam: 'bid',
		}, {
			role: 'admin',
			method: '*',
			entity: 'person',
			path: '/persons/:resId(/*_)',
			idParam: 'resId',
		}]);

		atrixACL.setEntityACLs([{
			entity: 'event',
			id: '42',
			acl: {
				tenantIds: ['gpa'],
				roles: ['special', 'goed:viewer', 'goed:admin', 'goed:viewer', 'goed:admin'],
			},
		}, {
			entity: 'budget',
			id: '22',
			acl: {
				tenantIds: ['vida'],
				roles: ['voegb:uper-event-viewer', 'goed:admin'],
			},
		}, {
			entity: 'person',
			id: '21',
			acl: {
				tenantIds: ['goed'],
				roles: [],
			},
		}]);
	});

	it('attaches the acl object as entityACLs to "req.auth"', async () => {
		const res = await svc.test
			.get('/prefix/events/42')
			.set(headers);
		expect(res.statusCode).to.equal(200);
		expect(res.body.entityACL).to.eql({
			entity: 'event',
			id: '42',
			acl: {
				tenantIds: ['gpa'],
				roles: ['special', 'goed:viewer', 'goed:admin', 'goed:viewer', 'goed:admin'],
			},
		});
	});

	it('does not fail with empty acls', async () => {
		atrixACL.setEntityACLs([]);
		const res = await svc.test
			.get('/prefix/events/42')
			.set(headers);
		expect(res.statusCode).to.equal(200);
		expect(res.body.entityACL).to.be.null;
	});

	it('parses ACLs and adds tenantIds', async () => {
		const res = await svc.test
			.get('/prefix/events/42')
			.set(headers);
		expect(res.statusCode).to.equal(200);
		expect(res.body.tenantIds).to.contain('gpa');
		expect(res.body.tenantIds).to.contain('goed');
		expect(res.body.tenantIds).not.to.contain('special');
		expect(res.body.tenantIds.length).to.equal(4);
	});

	it('parses ACLs and populates roles', async () => {
		const res = await svc.test
			.get('/prefix/events/42')
			.set(headers);
		expect(res.statusCode).to.equal(200);
		expect(contains({ role: 'viewer', tenant: 'goed', global: false }, res.body.roles)).to.be.true;
		expect(contains({ role: 'admin', tenant: 'goed', global: false }, res.body.roles)).to.be.true;
		expect(contains({ role: 'special', tenant: 'pathfinder-app', global: true }, res.body.roles)).to.be.true;
	});

	it('provides access to the route', async () => {
		headers = merge(testHeaders, {
			'x-pathfinder-tenant-ids': 'ak,voegb',
			authorization: `Bearer ${generateToken({
				'pathfinder-app': {
					roles: ['voegb:editor'],
				},
			})}`,
		});
		const res = await svc.test
			.get('/prefix/events/42')
			.set(headers);
		expect(res.statusCode).to.equal(200);
	});

	describe('config route matching', () => {
		it('uses first matching config route', async () => {
			const res = await svc.test
				.get('/prefix/events/42/budget/22')
				.set(headers);
			expect(res.statusCode).to.equal(200);
			expect(res.body.entityACL).to.eql({
				entity: 'event',
				id: '42',
				acl: {
					tenantIds: ['gpa'],
					roles: ['special', 'goed:viewer', 'goed:admin', 'goed:viewer', 'goed:admin'],
				},
			});
		});

		it('"/prefix/events/42/attendees" matches entity "events"', async () => {
			const res = await svc.test
				.get('/prefix/events/42/attendees')
				.set(headers);
			expect(res.statusCode).to.equal(200);
			expect(res.body.entityACL).to.eql({
				entity: 'event',
				id: '42',
				acl: {
					tenantIds: ['gpa'],
					roles: ['special', 'goed:viewer', 'goed:admin', 'goed:viewer', 'goed:admin'],
				},
			});
		});
		it('"/prefix/persons/42/budget/22" matches entity "budget"', async () => {
			const res = await svc.test
				.get('/prefix/persons/42/budget/22')
				.set(headers);
			expect(res.statusCode).to.equal(200);
			expect(res.body.entityACL).to.eql({
				entity: 'budget',
				id: '22',
				acl: {
					tenantIds: ['vida'],
					roles: ['voegb:uper-event-viewer', 'goed:admin'],
				},
			});
		});
		it('"/prefix/persons/21" matches entity "person"', async () => {
			const res = await svc.test
				.get('/prefix/persons/21')
				.set(headers);
			expect(res.statusCode).to.equal(200);
			expect(res.body.entityACL).to.eql({
				entity: 'person',
				id: '21',
				acl: {
					tenantIds: ['goed'],
					roles: [],
				},
			});
		});
	});
});
