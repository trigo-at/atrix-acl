'use strict';

const { expect } = require('chai');
const buildTenantIdsFromRoles = require('./build-tenant-ids-from-roles');

describe('buildTenantIdsFromRoles', () => {
	it('parses tenantIds', () => {
		expect(buildTenantIdsFromRoles(['ak:editor', 'voegb:admin']))
			.to.eql(['ak', 'voegb']);
	});
	it('filters doubles tenantIds', () => {
		expect(buildTenantIdsFromRoles(['ak:editor', 'ak:viewer', 'voegb:admin']))
			.to.eql(['ak', 'voegb']);
	});
	it('handles global roles', () => {
		expect(buildTenantIdsFromRoles(['ak:editor', 'super-admin', 'voegb:admin']))
			.to.eql(['ak', 'voegb']);
	});
});
