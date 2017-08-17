'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const Atrix = require('@trigo/atrix').Atrix;
const path = require('path');
const AtrixACL = require('./AtrixACL');
const testRules = require('../specs/acls')();

const endpoints = {
	http: {
		port: 3007,
		handlerDir: path.join(__dirname, '../specs/handler'),
		prefix: '/prefix',
	},
};

describe('AtrixACL', () => {
	describe('constructor', () => {
		it('ignores if "acl" config missing', () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', {});
			expect(() => new AtrixACL(atrix, serivce)).not.to.throw(Error);
		});

		it('checks if configure "acl -> aclDefinition" exist', () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', { endpoints, acl: { aclDefinition: 'gibts ned' } });
			serivce.endpoints.add('http');
			expect(() => new AtrixACL(atrix, serivce)).to.throw(Error);
			expect(() => new AtrixACL(atrix, serivce)).to.throw('No aclDefinition found at "gibts ned"');
		});

		it('checks if http endpoint is registered', () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', { acl: { aclDefinition: 'gibts ned' } });
			expect(() => new AtrixACL(atrix, serivce)).to.throw(Error);
			expect(() => new AtrixACL(atrix, serivce)).to.throw('No httpEndpoint found');
		});

		it('checks if allowInject config exists', () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', { endpoints, acl: { allowInject: false, aclDefinition: path.join(__dirname, '../specs/acls') } });
			serivce.endpoints.add('http');
			const as = new AtrixACL(atrix, serivce);
			expect(as.allowInject).to.equal(false);
		});
	});

	describe('loadServiceDefinition', () => {
		it('loads and parses the definition into "ACL" instance', async () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', { endpoints, acl: { aclDefinition: path.join(__dirname, '../specs/acls') } });
			serivce.endpoints.add('http');
			const as = new AtrixACL(atrix, serivce);
			await as.loadACLDefintion();
			expect(as.ACL).to.exist;
			expect(as.ACL.rules).to.eql(testRules);
		});
	});
});
