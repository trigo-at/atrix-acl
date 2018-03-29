'use strict';

const { expect } = require('chai');
const buildRolesDefinnitionArrayFromRoles = require('./build-roles-definition-array-from-roles');

describe('buildRolesDefinitionsArrayfromRoles', () => {
	const atrixACL = { config: { acl: { tokenResourceAccessRoleKey: 'test-app' } } };

	it('parses roles', () => {
		expect(buildRolesDefinnitionArrayFromRoles({ atrixACL, roles: ['ak:editor', 'voegb:admin'] }))
			.to.eql([
				{ tenant: 'ak', role: 'editor', global: false },
				{ tenant: 'voegb', role: 'admin', global: false },
			]);
	});
	it('filters doubles', () => {
		expect(buildRolesDefinnitionArrayFromRoles({ atrixACL, roles: ['ak:editor', 'ak:editor', 'voegb:admin'] }))
			.to.eql([
				{ tenant: 'ak', role: 'editor', global: false },
				{ tenant: 'voegb', role: 'admin', global: false },
			]);
	});
	it('handles global roles', () => {
		expect(buildRolesDefinnitionArrayFromRoles({ atrixACL, roles: ['ak:editor', 'super-admin', 'voegb:admin'] }))
			.to.eql([
				{ tenant: 'ak', role: 'editor', global: false },
				{ tenant: 'test-app', role: 'super-admin', global: true },
				{ tenant: 'voegb', role: 'admin', global: false },
			]);
	});
});
