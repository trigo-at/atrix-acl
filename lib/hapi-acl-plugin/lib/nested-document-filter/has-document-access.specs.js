
'use strict';

const { expect } = require('chai');
const hasDocumentAccess = require('./has-document-access');

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

describe('has-docuemt-access', () => {
	describe('checks for object', () => {
		const testData = [
			{
				doc: 'asdf',
				userRoles: [
				],
				filteredUserTenants: ['ak', 'voegb'],
				result: true,
			},
			{
				doc: null,
				userRoles: [
				],
				filteredUserTenants: ['ak', 'voegb'],
				result: true,
			},
			{
				doc: 'undefined',
				userRoles: [
				],
				filteredUserTenants: ['ak', 'voegb'],
				result: true,
			},
			{
				doc: 42,
				userRoles: [
				],
				filteredUserTenants: ['ak', 'voegb'],
				result: true,
			},
			{
				doc: ['42', 12],
				userRoles: [
				],
				filteredUserTenants: ['ak', 'voegb'],
				result: true,
			},
			{
				doc: 2.3,
				userRoles: [
				],
				filteredUserTenants: ['ak', 'voegb'],
				result: true,
			},
		];

		testData.forEach((test) => {
			// eslint-disable-next-line
			it(`user: ${JSON.stringify(test.userRoles)} with filtered tenants: "${test.filteredUserTenants.join()}" docuemt: ${JSON.stringify(test.doc)} has access: ${test.result}`, () => {
				expect(hasDocumentAccess(test.doc, test.userRoles, test.filteredUserTenants, fakeAtrixACL)).to.equal(test.result);
			});
		});
	});
	describe('without "_acl" defined', () => {
		const testData = [
			{
				doc: {
					tenantId: 'ak',
				},
				userRoles: [
					{ role: 'admin', tenant: 'ak', global: false },
					{ role: 'viewer', tenant: 'voegb', global: false },
				],
				filteredUserTenants: ['ak', 'voegb'],
				result: true,
			},
			{
				doc: {
					tenantId: '_all',
				},
				userRoles: [
					{ role: 'admin', tenant: 'ak', global: false },
					{ role: 'viewer', tenant: 'voegb', global: false },
				],
				filteredUserTenants: ['ak', 'voegb'],
				result: true,
			},
			{
				doc: {
					tenantId: 'ak',
				},
				userRoles: [
					{ role: 'admin', tenant: 'ak', global: false },
					{ role: 'viewer', tenant: 'voegb', global: false },
				],
				filteredUserTenants: ['voegb'],
				result: false,
			},
			{
				doc: {},
				userRoles: [
					{ role: 'admin', tenant: 'ak', global: false },
					{ role: 'viewer', tenant: 'voegb', global: false },
				],
				filteredUserTenants: ['voegb'],
				result: true,
			},
		];

		testData.forEach((test) => {
			// eslint-disable-next-line
			it(`user: ${JSON.stringify(test.userRoles)} with filtered tenants: "${test.filteredUserTenants.join()}" docuemt: ${JSON.stringify(test.doc)} has access: ${test.result}`, () => {
				expect(hasDocumentAccess(test.doc, test.userRoles, test.filteredUserTenants, fakeAtrixACL)).to.equal(test.result);
			});
		});
	});
	describe('with "_acl" defined', () => {
		const testData = [
			{
				doc: {
					tenantId: 'gpa',
					_acl: {
						tenantIds: [],
					},
				},
				userRoles: [
					{ role: 'admin', tenant: 'ak', global: false },
					{ role: 'viewer', tenant: 'voegb', global: false },
				],
				filteredUserTenants: ['ak', 'voegb'],
				result: false,
			},
			{
				doc: {
					tenantId: 'gpa',
					_acl: {},
				},
				userRoles: [
					{ role: 'admin', tenant: 'ak', global: false },
					{ role: 'viewer', tenant: 'voegb', global: false },
				],
				filteredUserTenants: ['ak', 'voegb'],
				result: false,
			},
			{
				doc: {
					tenantId: 'gpa',
					_acl: {
						tenantIds: ['ak'],
					},
				},
				userRoles: [
					{ role: 'admin', tenant: 'ak', global: false },
					{ role: 'viewer', tenant: 'voegb', global: false },
				],
				filteredUserTenants: ['ak', 'voegb'],
				result: true,
			},
			{
				doc: {
					tenantId: 'gpa',
					_acl: {
						tenantIds: ['ak'],
					},
				},
				userRoles: [
					{ role: 'admin', tenant: 'ak', global: false },
					{ role: 'viewer', tenant: 'voegb', global: false },
				],
				filteredUserTenants: ['voegb'],
				result: false,
			},
		];

		testData.forEach((test) => {
			// eslint-disable-next-line
			it(`user: ${JSON.stringify(test.userRoles)} with filtered tenants: "${test.filteredUserTenants.join()}" docuemt: ${JSON.stringify(test.doc)} has access: ${test.result}`, () => {
				expect(hasDocumentAccess(test.doc, test.userRoles, test.filteredUserTenants, fakeAtrixACL)).to.equal(test.result);
			});
		});
	});
});
