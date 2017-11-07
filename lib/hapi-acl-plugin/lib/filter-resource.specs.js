'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0, one-var-declaration-per-line: 0, one-var: 0 */

const { expect } = require('chai');
const filterResource = require('./filter-resource');

describe('filter-resource', () => {
	const request = { payload: '42' };
	it('calls filter when path matches', () => {
		let aPath, aRoot, aValue, aFilter, aReq;

		const when = ({ path, root, value, filter, req }) => {
			console.log({ path, root, value, filter, req });
			aPath = path;
			aRoot = root;
			aValue = value;
			aFilter = filter;
			aReq = req;
		};

		const obj = { a: 42 };
		const f = { keys: 'a', when };
		filterResource(obj, f, request);
		expect(aPath).to.equal('a');
		expect(aRoot).to.eql(obj);
		expect(aValue).to.equal(42);
		expect(aFilter).to.equal(f);
		expect(aReq).to.equal(request);
	});

	it('wihtout when function is directly resets the value', () => {
		const obj = { a: 42 };
		const f = { keys: 'a', value: 21 };
		const ret = filterResource(obj, f, request);
		expect(ret.a).to.eql(21);
	});

	it('when "filter.when" returnes "true" it replaces value with "filter.value"', () => {
		const obj = { a: 42 };
		const f = { keys: 'a', value: 21, when: () => true };
		const ret = filterResource(obj, f, request);
		expect(ret.a).to.eql(21);
	});

	it('can handle replaced properties', () => {
		const obj = { a: { b: 21 } };
		const f = { keys: 'a', value: 21, when: ({ path }) => path === 'a' };
		const ret = filterResource(obj, f, request);
		expect(ret).to.eql({ a: 21 });
	});

	it('can handle removed properties', () => {
		const obj = { a: { b: 21 } };
		const f = { keys: 'a', value: undefined, when: ({ path }) => path === 'a' };
		const ret = filterResource(obj, f, request);
		expect(ret).to.eql({ a: undefined });
	});

	it('does not reevaluate already replaced paths', () => {
		const obj = { a: { b: 21 } };
		const f = { keys: '*', value: { b: 'desdo' }, when: () => true };
		const ret = filterResource(obj, f, request);
		expect(ret).to.eql({ a: { b: 'desdo' } });
	});
});
