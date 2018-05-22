'use strict';

const { expect } = require('chai');
const machUserRoles = require('./match-user-roles');

const fakeAtrixACL = {
	config: {
		acl: {
			tenantIdProperty: 'tenantId', aclProperty: '_acl', matchAllTenantId: '_all', enableNestedDocumentAcls: true,
		},
	},
	log: {
		// eslint-disable-next-line
		debug: console.log,
	},
};

describe('match-user-roles', () => {
	const testData = [
		{
			aclRoles: ['ak:admin'],
			userRoles: [
				{ role: 'admin', tenant: 'ak', global: false },
			],
			result: true,
		},
		{
			aclRoles: ['voegb:admin', 'ak:viewer'],
			userRoles: [
				{ role: 'admin', tenant: 'ak', global: false },
				{ role: 'viewer', tenant: 'voegb', global: false },
			],
			result: false,
		},
		{
			aclRoles: ['voegb:*', 'voegb:admin'],
			userRoles: [
				{ role: 'admin', tenant: 'ak', global: false },
				{ role: 'viewer', tenant: 'voegb', global: false },
			],
			result: true,
		},
		{
			aclRoles: ['*:viewer', 'voegb:admin'],
			userRoles: [
				{ role: 'admin', tenant: 'ak', global: false },
				{ role: 'viewer', tenant: 'voegb', global: false },
			],
			result: true,
		},
		{
			aclRoles: ['*:*', 'voegb:admin'],
			userRoles: [
				{ role: 'admin', tenant: 'ak', global: false },
			],
			result: true,
		},
		{
			aclRoles: ['*:*', 'voegb:admin'],
			userRoles: [],
			result: true,
		},
		{
			aclRoles: [],
			userRoles: [{ role: 'admin', tenant: 'ak', global: false }],
			result: false,
		},
		{
			// global roles match tenant role
			aclRoles: ['ak:admin', 'ak:viewer', 'voegb:viewer'],
			userRoles: [{ role: 'admin', tenant: 'asdf', global: true }],
			result: true,
		},
		{
			// global roles match global role
			aclRoles: ['admin'],
			userRoles: [{ role: 'admin', tenant: 'asdf', global: true }],
			result: true,
		},
		{
			aclRoles: ['*:admin'],
			userRoles: [{ role: 'admin', tenant: 'asdf', global: true }],
			result: true,
		},
		{
			aclRoles: ['ak:*'],
			userRoles: [{ role: 'admin', tenant: 'asdf', global: true }],
			result: true,
		},
	];

	testData.forEach((test) => {
		it(`user: ${JSON.stringify(test.userRoles)} roles: ${JSON.stringify(test.aclRoles)} has access: ${test.result}`, () => {
			expect(machUserRoles(test.userRoles, test.aclRoles, fakeAtrixACL)).to.equal(test.result);
		});
	});
});
