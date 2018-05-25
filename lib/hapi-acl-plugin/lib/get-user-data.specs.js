'use strict';

/* eslint no-console: 0, no-unused-expressions: 0, no-shadow: 0 */

const { Atrix } = require('@trigo/atrix');
const path = require('path');
const AtrixACL = require('../../AtrixACL');
const getUserData = require('./get-user-data');
const { expect } = require('chai');

const buildRequest = (
	path = '/',
	method = 'GET',
	roles = ['ak:admin'],
	tenantIds = ['ak'],
) => {
	return {
		auth: {
			credentials: {
				resource_access: {
					'pathfinder-app': {
						roles,
					},
				},
			},
		},
		headers: {
			'x-pathfinder-tenant-ids': tenantIds.join(','),
		},
		log: {
			debug: console.log,
			info: console.log,
			warn: console.log,
			error: console.log,
		},
		method,
		path,
	};
};

describe('get-user-data', () => {
	let atrixACL;
	beforeEach(async () => {
		const atrix = new Atrix();
		const serivce = new atrix.Service('s', {
			endpoints: {
				http: {
					port: 23027,
					handlerDir: path.join(__dirname, '../../../specs/handler'),
					prefix: '/prefix',
				},
			},
			acl: {
				aclDefinition: path.join(__dirname, '../../../specs/acls'),
				filterPayloadDefinition: path.join(__dirname, '../../../specs/filter-properties-rules.js'),
			},
		});
		serivce.endpoints.add('http');
		atrixACL = new AtrixACL(atrix, serivce);
	});

	it('parse tenantIds & roles from req.auth.credentials with dsinege role/tenant', () => {
		const result = getUserData(buildRequest(), atrixACL);
		expect(result).to.eql({
			userId: null,
			tenantIds: ['ak'],
			roles: [{ tenant: 'ak', role: 'admin', global: false }],
			entityACLs: [],
		});
	});

	it('parse tenantIds & roles from req.auth.credentials multiple roles tenants', () => {
		const result = getUserData(buildRequest('/', 'POST', ['ak:admin', 'voegb:viewer', 'super-admin'], ['ak', 'voegb']), atrixACL);
		expect(result).to.eql({
			userId: null,
			tenantIds: ['ak', 'voegb'],
			roles: [
				{ tenant: 'ak', role: 'admin', global: false },
				{ tenant: 'voegb', role: 'viewer', global: false },
				{ tenant: 'pathfinder-app', role: 'super-admin', global: true },
			],
			entityACLs: [],
		});
	});

	it('parse tenantIds & roles from req.auth.credentials multiple roles/tenants restricted by header', () => {
		const result = getUserData(buildRequest('/', 'POST', ['ak:admin', 'voegb:viewer', 'ak:viewer', 'super-admin'], ['ak']), atrixACL);
		expect(result).to.eql({
			userId: null,
			tenantIds: ['ak'],
			roles: [
				{ tenant: 'ak', role: 'admin', global: false },
				{ tenant: 'ak', role: 'viewer', global: false },
				{ tenant: 'pathfinder-app', role: 'super-admin', global: true },
			],
			entityACLs: [],
		});
	});

	describe('with entityACLs', () => {
		it('copies all roles the user has in the "tenantId:<roles>" to "entityTenantId:<roles>"', async () => {
			atrixACL.setRules([{
				role: 'admin',
				method: '*',
				entity: 'event',
				path: '/events/:id(/*_)',
				idParam: 'id',
			}]);

			atrixACL.setEntityACLs([{
				entity: 'event',
				id: '42',
				entityTenantId: 'ak',
				acl: {
					tenantId: 'voegb',
				},
			}]);

			const result = getUserData(buildRequest('/events/42', 'POST', ['voegb:viewer'], ['voegb']), atrixACL);
			expect(result.tenantIds.sort()).to.eql(['voegb', 'ak'].sort());
			// console.log(result.roles);
			expect(result.roles.sort()).to.eql([
				{ tenant: 'ak', role: 'viewer', global: false },
				{ tenant: 'voegb', role: 'viewer', global: false },
			].sort());
		});

		it('copies all roles the user has in the "tenantId:<roles>" to "entityTenantId:<roles>" with multiple matching acls', async () => {
			atrixACL.setRules([{
				role: 'admin',
				method: '*',
				entity: 'event',
				path: '/events/:id(/*_)',
				idParam: 'id',
			}]);

			atrixACL.setEntityACLs([{
				entity: 'event',
				id: '42',
				entityTenantId: 'ak',
				acl: {
					tenantId: 'voegb',
				},
			}, {
				entity: 'event',
				id: '42',
				entityTenantId: 'ak',
				acl: {
					tenantId: 'goed',
				},
			}]);

			const result = getUserData(buildRequest('/events/42', 'POST', ['voegb:viewer', 'goed:educator', 'goed:admin'], ['voegb', 'goed']), atrixACL);
			expect(result.tenantIds.sort()).to.eql(['voegb', 'ak', 'goed'].sort());
			console.log(result.roles);
			expect(result.roles.find(r => r.tenant === 'ak' && r.role === 'viewer')).to.exist;
			expect(result.roles.find(r => r.tenant === 'ak' && r.role === 'educator')).to.exist;
			expect(result.roles.find(r => r.tenant === 'ak' && r.role === 'admin')).to.exist;
			expect(result.roles.find(r => r.tenant === 'voegb' && r.role === 'viewer')).to.exist;
			expect(result.roles.find(r => r.tenant === 'goed' && r.role === 'educator')).to.exist;
			expect(result.roles.find(r => r.tenant === 'goed' && r.role === 'admin')).to.exist;
		});

		it('can restric access with "alc.roles" array', async () => {
			atrixACL.setRules([{
				role: 'admin',
				method: '*',
				entity: 'event',
				path: '/events/:id(/*_)',
				idParam: 'id',
			}]);

			atrixACL.setEntityACLs([{
				entity: 'event',
				id: '42',
				entityTenantId: 'ak',
				acl: {
					tenantId: 'voegb',
					roles: ['viewer'],
				},
			}]);

			const result = getUserData(buildRequest('/events/42', 'POST', ['voegb:viewer', 'voegb:admin'], ['voegb']), atrixACL);
			expect(result.tenantIds.sort()).to.eql(['voegb', 'ak'].sort());
			console.log(result.roles);

			expect(result.roles.find(r => r.tenant === 'ak' && r.role === 'viewer')).to.exist;
			expect(result.roles.find(r => r.tenant === 'ak' && r.role === 'admin')).not.to.exist;
			expect(result.roles.find(r => r.tenant === 'voegb' && r.role === 'admin')).to.exist;
			expect(result.roles.find(r => r.tenant === 'voegb' && r.role === 'viewer')).to.exist;
			expect(result.roles.length).to.eql(3);
		});

		it('"alc.roles" array can not add roles to user', async () => {
			atrixACL.setRules([{
				role: 'admin',
				method: '*',
				entity: 'event',
				path: '/events/:id(/*_)',
				idParam: 'id',
			}]);

			atrixACL.setEntityACLs([{
				entity: 'event',
				id: '42',
				entityTenantId: 'ak',
				acl: {
					tenantId: 'voegb',
					roles: ['viewer', 'educator'],
				},
			}]);

			const result = getUserData(buildRequest('/events/42', 'POST', ['voegb:viewer', 'voegb:admin'], ['voegb']), atrixACL);
			expect(result.tenantIds.sort()).to.eql(['voegb', 'ak'].sort());
			console.log(result.roles);

			expect(result.roles.find(r => r.tenant === 'ak' && r.role === 'viewer')).to.exist;
			expect(result.roles.find(r => r.tenant === 'ak' && r.role === 'admin')).not.to.exist;
			expect(result.roles.find(r => r.tenant === 'ak' && r.role === 'educator')).not.to.exist;
			expect(result.roles.find(r => r.tenant === 'voegb' && r.role === 'admin')).to.exist;
			expect(result.roles.find(r => r.tenant === 'voegb' && r.role === 'viewer')).to.exist;
			expect(result.roles.length).to.eql(3);
		});

		it('when "alc.roles === null" roles are ignored', async () => {
			atrixACL.setRules([{
				role: 'admin',
				method: '*',
				entity: 'event',
				path: '/events/:id(/*_)',
				idParam: 'id',
			}]);

			atrixACL.setEntityACLs([{
				entity: 'event',
				id: '42',
				entityTenantId: 'ak',
				acl: {
					tenantId: 'voegb',
					roles: null,
				},
			}]);

			const result = getUserData(buildRequest('/events/42', 'POST', ['voegb:viewer', 'voegb:admin'], ['voegb']), atrixACL);
			expect(result.tenantIds.sort()).to.eql(['voegb', 'ak'].sort());
			console.log(result.roles);

			expect(result.roles.find(r => r.tenant === 'ak' && r.role === 'viewer')).to.exist;
			expect(result.roles.find(r => r.tenant === 'ak' && r.role === 'admin')).to.exist;
			expect(result.roles.find(r => r.tenant === 'voegb' && r.role === 'admin')).to.exist;
			expect(result.roles.find(r => r.tenant === 'voegb' && r.role === 'viewer')).to.exist;
			expect(result.roles.length).to.eql(4);
		});

		it('when "alc.roles === []" roles are ignored', async () => {
			atrixACL.setRules([{
				role: 'admin',
				method: '*',
				entity: 'event',
				path: '/events/:id(/*_)',
				idParam: 'id',
			}]);

			atrixACL.setEntityACLs([{
				entity: 'event',
				id: '42',
				entityTenantId: 'ak',
				acl: {
					tenantId: 'voegb',
					roles: [],
				},
			}]);

			const result = getUserData(buildRequest('/events/42', 'POST', ['voegb:viewer', 'voegb:admin'], ['voegb']), atrixACL);
			expect(result.tenantIds.sort()).to.eql(['voegb', 'ak'].sort());
			console.log(result.roles);

			expect(result.roles.find(r => r.tenant === 'ak' && r.role === 'viewer')).to.exist;
			expect(result.roles.find(r => r.tenant === 'ak' && r.role === 'admin')).to.exist;
			expect(result.roles.find(r => r.tenant === 'voegb' && r.role === 'admin')).to.exist;
			expect(result.roles.find(r => r.tenant === 'voegb' && r.role === 'viewer')).to.exist;
			expect(result.roles.length).to.eql(4);
		});
	});
});
