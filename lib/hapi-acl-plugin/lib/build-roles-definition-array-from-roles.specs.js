'use strict';

const { expect } = require('chai');
const buildRolesDefinnitionArrayFromRoles = require('./build-roles-definition-array-from-roles');

describe('buildRolesDefinitionsArrayfromRoles', () => {
	const atrixACL = { config: { acl: { tokenResourceAccessRoleKey: 'test-app' } } };

	it('parses roles', () => {
		expect(buildRolesDefinnitionArrayFromRoles({ atrixACL, roles: ['ak:editor', 'voegb:admin'], source: 'token' }))
			.to.eql([
				{ tenant: 'ak', role: 'editor', global: false, source: 'token' },
				{ tenant: 'voegb', role: 'admin', global: false, source: 'token' },
			]);
	});
	it('filters doubles', () => {
		expect(buildRolesDefinnitionArrayFromRoles({ atrixACL, roles: ['ak:editor', 'ak:editor', 'voegb:admin'], source: 'token' }))
			.to.eql([
				{ tenant: 'ak', role: 'editor', global: false, source: 'token' },
				{ tenant: 'voegb', role: 'admin', global: false, source: 'token' },
			]);
	});
	it('handles global roles', () => {
		expect(buildRolesDefinnitionArrayFromRoles({ atrixACL, roles: ['ak:editor', 'super-admin', 'voegb:admin'], source: 'token' }))
			.to.eql([
				{ tenant: 'ak', role: 'editor', global: false, source: 'token' },
				{ tenant: 'test-app', role: 'super-admin', global: true, source: 'token' },
				{ tenant: 'voegb', role: 'admin', global: false, source: 'token' },
			]);
	});
});
