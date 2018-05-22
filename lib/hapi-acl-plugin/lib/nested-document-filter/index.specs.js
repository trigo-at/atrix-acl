'use strict';

const nestedDocumentFilter = require('./');
const { expect } = require('chai');

describe('tenant-response-filter', () => {
	const fakeReq = {
		auth: {
			tenantIds: ['a'],
			roles: [
				{ tenant: 't1', role: 'viewer', global: false },
				{ tenant: 'pathfinder-app', role: 'admin', global: true },
			],
		},
	};
	const fakeAtrixACL = {
		config: {
			acl: {
				tenantIdProperty: 'tenantId', aclProperty: '_acl', matchAllTenantId: '_all', enableNestedDocumentAcls: true,
			},
		},
	};
	it('filters top level array', () => {
		expect(nestedDocumentFilter(
			[{ tenantId: 'x' }, { tenantId: 'a' }, { tenantId: 'b' }],
			fakeReq, fakeAtrixACL,
		)).to.eql([{
			tenantId: 'a',
		}]);
	});
	it('filters plain properies', () => {
		expect(nestedDocumentFilter({
			prop: {
				tenantId: 'a',
			},
			prop2: {
				tenantId: 'b',
			},
			t: 't',
			n: 1,
			b: true,
		}, fakeReq, fakeAtrixACL)).to.eql({
			prop: {
				tenantId: 'a',
			},
			t: 't',
			n: 1,
			b: true,
		});
	});
	it('filters arrays properies', () => {
		expect(nestedDocumentFilter({
			prop: [{ tenantId: 'x' }, { tenantId: 'a' }, { tenantId: 'b' }],
		}, fakeReq, fakeAtrixACL)).to.eql({
			prop: [{
				tenantId: 'a',
			}],
		});
	});
	it('filters nested properies', () => {
		expect(nestedDocumentFilter({
			prop: {
				prop: { tenantId: 'x' },
				prop2: {
					prop: { tenantId: 'x' },
					prop2: { tenantId: 'a' },
				},
			},
			prop2: [{
				prop: {
					prop: { tenantId: 'x' },
					prop2: {
						prop: { tenantId: 'x' },
						prop2: { tenantId: 'a' },
					},
				},
			}, { tenantId: 'a' }, { tenantId: 'b' }],
		}, fakeReq, fakeAtrixACL)).to.eql({
			prop: {
				prop2: {
					prop2: { tenantId: 'a' },
				},
			},
			prop2: [{
				prop: {
					prop2: {
						prop2: { tenantId: 'a' },
					},
				},
			}, { tenantId: 'a' }],
		});
	});

	it('can use per document ._acl property', () => {
		expect(nestedDocumentFilter({
			prop: {
				tenantId: 'a',
				pNested: [{
					_acl: {
						// match t1:viewer
						roles: ['*:viewer'],
					},
				}, {
					_acl: {
						// match globale admin
						roles: ['*:admin'],
					},
				}],
			},
			prop2: {
				tenantId: 'a',
				_acl: {
					// kicked by _acl
					roles: ['t2:viewer'],
				},
			},
			prop3: {
				tenantId: 'b',
				_acl: {
					// match global admin
					roles: ['t2:admin'],
				},
			},
		}, fakeReq, fakeAtrixACL)).to.eql({
			prop: {
				tenantId: 'a',
				pNested: [{
					_acl: {
						roles: ['*:viewer'],
					},
				}, {
					_acl: {
						roles: ['*:admin'],
					},
				}],
			},
			prop3: {
				tenantId: 'b',
				_acl: {
					// match global admin
					roles: ['t2:admin'],
				},
			},
		});
	});

	it('detects "_all" magic tenant value', () => {
		expect(nestedDocumentFilter(
			[{ tenantId: 'x' }, { tenantId: 'a' }, { tenantId: '_all' }],
			fakeReq, fakeAtrixACL,
		)).to.eql([{
			tenantId: 'a',
		}, {
			tenantId: '_all',
		}]);
	});
});
