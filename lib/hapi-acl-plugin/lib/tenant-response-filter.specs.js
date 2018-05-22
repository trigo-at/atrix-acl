'use strict';

const tenantResponseFilter = require('./tenant-response-filter');
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
		expect(tenantResponseFilter(
			[{ tenantId: 'x' }, { tenantId: 'a' }, { tenantId: 'b' }],
			fakeReq, fakeAtrixACL,
		)).to.eql([{
			tenantId: 'a',
		}]);
	});
	it('filters plain properies', () => {
		expect(tenantResponseFilter({
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
		expect(tenantResponseFilter({
			prop: [{ tenantId: 'x' }, { tenantId: 'a' }, { tenantId: 'b' }],
		}, fakeReq, fakeAtrixACL)).to.eql({
			prop: [{
				tenantId: 'a',
			}],
		});
	});
	it('filters nested properies', () => {
		expect(tenantResponseFilter({
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

	it('can overrwrite with ._acl.tenantIds property', () => {
		expect(tenantResponseFilter({
			prop: {
				tenantId: 'a',
			},
			prop2: {
				tenantId: 'b',
				_acl: {
					tenantIds: ['a'],
				},
			},
		}, fakeReq, fakeAtrixACL)).to.eql({
			prop: {
				tenantId: 'a',
			},
			prop2: {
				tenantId: 'b',
				_acl: {
					tenantIds: ['a'],
				},
			},
		});
	});

	it('can overrwrite with ._acl.roles property', () => {
		expect(tenantResponseFilter({
			prop: {
				tenantId: 'a',
			},
			prop2: {
				tenantId: 'b',
				_acl: {
					roles: ['t1:viewer'],
				},
			},
			prop3: {
				tenantId: 'b',
				_acl: {
					tenantIds: ['a'],
				},
			},
		}, fakeReq, fakeAtrixACL)).to.eql({
			prop: {
				tenantId: 'a',
			},
			prop2: {
				tenantId: 'b',
				_acl: {
					roles: ['t1:viewer'],
				},
			},
			prop3: {
				tenantId: 'b',
				_acl: {
					tenantIds: ['a'],
				},
			},
		});
	});

	it('detects "_all" magic tenant value', () => {
		expect(tenantResponseFilter(
			[{ tenantId: 'x' }, { tenantId: 'a' }, { tenantId: '_all' }],
			fakeReq, fakeAtrixACL,
		)).to.eql([{
			tenantId: 'a',
		}, {
			tenantId: '_all',
		}]);
	});
});
