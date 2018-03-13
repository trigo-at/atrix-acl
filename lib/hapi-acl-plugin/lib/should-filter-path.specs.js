'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const {expect} = require('chai');
const shouldFilterPath = require('./should-filter-path');

describe('should-filter-path', () => {
	it('should check key as string', () => {
		expect(shouldFilterPath('a', 'a')).to.be.true;
	});

	it('should check key as array', () => {
		expect(shouldFilterPath('a', ['c', 'a'])).to.be.true;
	});

	it('should match full path', () => {
		expect(shouldFilterPath('a.b.c', 'a.b.c')).to.be.true;
		expect(shouldFilterPath('a.a.b.c', 'a.b.c')).to.be.false;
		expect(shouldFilterPath('a.b.c.c', 'a.b.c')).to.be.false;
	});

	it('"*" should match any path', () => {
		expect(shouldFilterPath('a.b.c', '*')).to.be.true;
		expect(shouldFilterPath('c', '*')).to.be.true;
	});

	it('should allow starts with search: "a.b.*"', () => {
		expect(shouldFilterPath('a.b.c', 'a.b.*')).to.be.true;
		expect(shouldFilterPath('a.b.c.d.e.f', 'a.b.*')).to.be.true;
		expect(shouldFilterPath('b.b.c.d.e.f', 'a.b.*')).to.be.false;
	});

	it('should allow ends with search: "*.b.c"', () => {
		expect(shouldFilterPath('id', '*.id')).to.be.true;
		expect(shouldFilterPath('a.b.c', '*.b.c')).to.be.true;
		expect(shouldFilterPath('x.y.1.a.b.c', '*.b.c')).to.be.true;
		expect(shouldFilterPath('x.y.1.a.b.c.d', '*.b.c')).to.be.false;
	});

	it('should allow contains serach: "*.b.*"', () => {
		expect(shouldFilterPath('a.b.c', '*.b.*')).to.be.true;
		expect(shouldFilterPath('b', '*.b.*')).to.be.true;
		expect(shouldFilterPath('b.a.s', '*.b.*')).to.be.true;
		expect(shouldFilterPath('a.as.b', '*.b.*')).to.be.true;
		expect(shouldFilterPath('c', '*.b.*')).to.be.false;
	});

	it('should throw when path is null', () => {
		expect(() => shouldFilterPath(null, 'asd')).to.throw(
			/mandatory argument/
		);
	});
	it('should throw when path is undefined', () => {
		expect(() => shouldFilterPath(undefined, 'asd')).to.throw(
			/mandatory argument/
		);
	});
	it('should throw when keys is null', () => {
		expect(() => shouldFilterPath('a', null)).to.throw(
			/mandatory argument/
		);
	});
	it('should throw when keys is undefined', () => {
		expect(() => shouldFilterPath('a', undefined)).to.throw(
			/mandatory argument/
		);
	});
});
