'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0, one-var-declaration-per-line: 0, one-var: 0 */

const { expect } = require('chai');
const { clone } = require('ramda');
const filterResource = require('./filter-resource');

describe('filter-resource', () => {
	const request = { payload: '42', log: { debug: () => {} } };

	describe('value setting and when method', () => {
		it('calls filter when path matches', () => {
			let aPath, aRoot, aValue, aFilter, aReq;

			const when = ({
				path, root, value, filter, req,
			}) => {
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

		it('without when function is directly resets the value', () => {
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
			expect(ret).to.eql({});
		});

		it('does not reevaluate already replaced paths', () => {
			const obj = { a: { b: 21 } };
			const f = { keys: '*', value: { b: 'desdo' }, when: () => true };
			const ret = filterResource(obj, f, request);
			expect(ret).to.eql({ a: { b: 'desdo' } });
		});

		it('removes all undefineds, even deeply nested', () => {
			const obj = { a: { b: 21 }, b: 42, c: { d: { b: 63, dd: 84 } } };
			const f = { keys: '*.b', value: undefined, when: () => true };
			const ret = filterResource(obj, f, request);
			expect(ret).to.eql({ a: { }, c: { d: { dd: 84 } } });
		});

		it('should be able to handle empty arrays', () => {
			const obj = { a: [] };
			const f = { keys: '*.b', value: undefined, when: () => true };
			const ret = filterResource(obj, f, request);
			expect(ret).to.eql({ a: [] });
		});

		it('provides full property path to the when method', () => {
			const obj = { a: { foo: 21 }, b: { foo: { bar: 42 } } };
			const f = {
				keys: '*',
				value: undefined,
				when: ({ path }) => {
					if (path.match(/(a.foo)/)) return true;
					return false;
				},
			};
			const ret = filterResource(obj, f, request);
			expect(ret).to.eql({ a: {}, b: { foo: { bar: 42 } } });
		});
	});

	describe('deep property filtering', () => {
		const obj = {
			a: {
				b: {
					c: 21,
					d: 42,
				},
			},
			b: {
				c: 63,
			},
		};

		it('can handle deep keys', () => {
			const f = { keys: 'a.b', value: undefined };
			const ret = filterResource(clone(obj), f, request);
			expect(ret).to.eql({ a: {}, b: { c: 63 } });
		});

		it('can handle deep keys in subtree', () => {
			const f = { keys: 'b.c', value: undefined };
			const ret = filterResource(clone(obj), f, request);
			expect(ret).to.eql({ a: { b: { c: 21, d: 42 } }, b: {} });
		});

		it('can handle deep keys with wildcard prefix', () => {
			const f = { keys: '*.b.c', value: undefined };
			const ret = filterResource(clone(obj), f, request);
			expect(ret).to.eql({ a: { b: { d: 42 } }, b: { } });
		});

		it('can handle keys with wildcard prefix and suffix', () => {
			const f = { keys: '*.b.*', value: undefined };
			const ret = filterResource(clone(obj), f, request);
			expect(ret).to.eql({ a: { b: {} }, b: {} });
		});

		it('can handle keys with wildcard suffix', () => {
			const f = { keys: 'b.*', value: undefined };
			const ret = filterResource(clone(obj), f, request);
			expect(ret).to.eql({ a: { b: { c: 21, d: 42 } }, b: {} });
		});

		it('can handle keys with wildcard prefix and suffix with non-nested objects', () => {
			const o = { b: 'foo' };
			const f = { keys: '*.b.*', value: undefined };
			const ret = filterResource(o, f, request);
			expect(ret).to.eql({ b: 'foo' });
		});

		it('can handle objects inside arrays', () => {
			const o = { a: { b: [1, 2, 3, { c: { d: 42 } }, 4] } };
			const f = { keys: '*.c.d', value: undefined, when: v => v.value === 42 };
			const ret = filterResource(o, f, request);
			expect(ret).to.eql({ a: { b: [1, 2, 3, { c: {} }, 4] } });
		});
	});


	describe('array filtering', () => {
		it('removes filtered array values when set to "undefined"', () => {
			const obj = {
				a: [11, 21, 42, 12],
				gg: {
					h: [11, 31, 42, 23, 42],
				},
			};
			const f = { keys: '*', value: undefined, when: ({ value }) => typeof value === 'number' && value !== 42 };
			const ret = filterResource(obj, f, request);
			expect(ret).to.eql({
				a: [42],
				gg: {
					h: [42, 42],
				},
			});
		});

		it('removes filtered array values in nested arrays hen set to undfined', () => {
			const obj = {
				a: [11, 21, 42, 12],
				gg: {
					h: [11, 31, 42, {
						ii: [42, 12, 32, 42, 12],
					}, 42],
				},
			};
			const f = { keys: '*', value: undefined, when: ({ value }) => typeof value === 'number' && value !== 42 };
			const ret = filterResource(obj, f, request);
			expect(ret).to.eql({
				a: [42],
				gg: {
					h: [42, {
						ii: [42, 42],
					}, 42],
				},
			});
		});

		it('does not remove filtered array values when set to anything but "undefined"', () => {
			const obj = { a: [11, 21, 42] };
			const f = { keys: '*', value: 42, when: ({ value }) => value === 21 };
			const ret = filterResource(obj, f, request);
			expect(ret.a).to.eql([11, 42, 42]);
		});
	});

	it.skip('should perform', () => {
		const o = require('../../../specs/testdata/data-huge.json');
		const f = { keys: ['meta.view.name', 'meta.view.columns.*'] };
		filterResource(o, f, request);
	});
});
