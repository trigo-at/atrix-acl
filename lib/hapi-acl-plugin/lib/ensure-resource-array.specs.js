'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const ensureResourceArray = require('./ensure-resource-array');

describe('ensure-resource-array', () => {
	it('returns "obj.itmes" when it exists', () => {
		expect(ensureResourceArray({ items: ['1', 2] })).to.eql(['1', 2]);
	});

	it('check if "obj.items" is array', () => {
		expect(ensureResourceArray({ items: { a: 42 } })).to.eql([{ items: { a: 42 } }]);

	});

	it('returns value as array', () => {
		expect(ensureResourceArray(1)).to.eql([1]);
	});

	it('keeps array as it is', () => {
		const arr = [1];
		expect(ensureResourceArray(arr)).to.equal(arr);
	});

	it('throws on undefined', () => {
		expect(() => ensureResourceArray()).to.throw(/mandatory argument/);
	});

	it('throws on null', () => {
		expect(() => ensureResourceArray(null)).to.throw(/mandatory argument/);
	});
});


