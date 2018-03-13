'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0, max-len: 0 */

const {expect} = require('chai');
const {Atrix} = require('@trigo/atrix');
const path = require('path');
const AtrixACL = require('./AtrixACL');
const testRules = require('../specs/acls')();
const ACL = require('./acl');
const {map, merge} = require('ramda');

const endpoints = {
	http: {
		port: 3027,
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
			const serivce = new atrix.Service('s', {
				endpoints,
				acl: {aclDefinition: 'gibts ned'},
			});
			serivce.endpoints.add('http');
			expect(() => new AtrixACL(atrix, serivce)).to.throw(Error);
			expect(() => new AtrixACL(atrix, serivce)).to.throw(
				'No aclDefinition found at "gibts ned"'
			);
		});

		it('checks if configured "filterPropertiesDefinition" exists & returns an array', () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', {
				endpoints,
				acl: {
					aclDefinition: path.join(__dirname, '../specs/acls'),
					filterPropertiesDefinition: 'foo-bar',
				},
			});
			serivce.endpoints.add('http');
			expect(() => new AtrixACL(atrix, serivce)).to.throw(Error);
			expect(() => new AtrixACL(atrix, serivce)).to.throw(
				'No filterPropertiesDefinition found at "foo-bar"'
			);
		});

		it('checks if configured "filterPayloadDefinition" exists & returns an array', () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', {
				endpoints,
				acl: {
					aclDefinition: path.join(__dirname, '../specs/acls'),
					filterPayloadDefinition: 'foo-bar',
				},
			});
			serivce.endpoints.add('http');
			expect(() => new AtrixACL(atrix, serivce)).to.throw(Error);
			expect(() => new AtrixACL(atrix, serivce)).to.throw(
				'No filterPayloadDefinition found at "foo-bar"'
			);
		});

		it('checks if http endpoint is registered', () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', {
				acl: {aclDefinition: 'gibts ned'},
			});
			expect(() => new AtrixACL(atrix, serivce)).to.throw(Error);
			expect(() => new AtrixACL(atrix, serivce)).to.throw(
				'No httpEndpoint found'
			);
		});

		it('checks if allowInject config exists', () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', {
				endpoints,
				acl: {
					allowInject: false,
					aclDefinition: path.join(__dirname, '../specs/acls'),
				},
			});
			serivce.endpoints.add('http');
			const as = new AtrixACL(atrix, serivce);
			expect(as.allowInject).to.equal(false);
		});

		it('checks if tokenRoleKey exists', () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', {
				endpoints,
				acl: {
					allowInject: false,
					aclDefinition: path.join(__dirname, '../specs/acls'),
					tokenResourceAccessRoleKey: 'pathfinder-app',
				},
			});
			serivce.endpoints.add('http');
			const as = new AtrixACL(atrix, serivce);
			expect(as.allowInject).to.equal(false);
			expect(as.tokenResourceAccessRoleKey).to.equal('pathfinder-app');
		});
	});

	describe('congiuration file loading', () => {
		it('loads and parses the "rules" definition into "ACL" instance', async () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', {
				endpoints,
				acl: {
					aclDefinition: path.join(__dirname, '../specs/acls'),
				},
			});
			serivce.endpoints.add('http');
			const as = new AtrixACL(atrix, serivce);
			expect(as.ACL).to.exist;
			expect(as.ACL.rules).to.eql(
				map(t => merge({idParam: 'id'}, t), testRules)
			);
		});
		it('loads and parses the "filterRules" definition into "ACL" instance', async () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', {
				endpoints,
				acl: {
					aclDefinition: path.join(__dirname, '../specs/acls'),
					filterPropertiesDefinition: path.join(
						__dirname,
						'../specs/filter-properties-rules.js'
					),
				},
			});
			serivce.endpoints.add('http');
			const as = new AtrixACL(atrix, serivce);
			expect(as.ACL).to.exist;
			expect(as.ACL.filterRules).not.to.be.empty;
		});
		it('loads and parses the "filterPayloadRules" definition into "ACL" instance', async () => {
			const atrix = new Atrix();
			const serivce = new atrix.Service('s', {
				endpoints,
				acl: {
					aclDefinition: path.join(__dirname, '../specs/acls'),
					filterPayloadDefinition: path.join(
						__dirname,
						'../specs/filter-properties-rules.js'
					),
				},
			});
			serivce.endpoints.add('http');
			const as = new AtrixACL(atrix, serivce);
			expect(as.ACL).to.exist;
			expect(as.ACL.filterPayloadRules).not.to.be.empty;
		});
	});

	describe('FSM transitions', () => {
		let acl;
		beforeEach(() => {
			acl = new ACL({rules: []});
		});

		it('should allow specific transition', async () => {
			acl.rules = [
				{role: 'admin', transition: 'cancel:registration', method: '*'},
			];
			const access = acl.access({
				role: 'admin',
				transition: 'cancel:registration',
				method: '*',
			});
			expect(!!access).to.be.true;
		});

		it('show deny incorrect transition', async () => {
			acl.rules = [
				{role: 'admin', transition: 'cancel:registration', method: '*'},
			];
			const access = acl.access({
				role: 'admin',
				transition: 'cancel:blabla',
				method: '*',
			});
			expect(!!access).to.be.false;
		});

		it('show allow wildcard transition', async () => {
			acl.rules = [{role: 'admin', transition: 'cancel:*_', method: '*'}];
			const access = acl.access({
				role: 'admin',
				transition: 'cancel:blabla',
				method: '*',
			});
			expect(!!access).to.be.true;
		});

		it('show deny incorrect wildcard transition', async () => {
			acl.rules = [{role: 'admin', transition: 'cancel:*_', method: '*'}];
			const access = acl.access({
				role: 'admin',
				transition: 'cancels:blabla',
				method: '*',
			});
			expect(!!access).to.be.false;
		});

		it('show allow wildcard transition', async () => {
			acl.rules = [
				{role: 'admin', transition: 'cancel:*_:foo', method: '*'},
			];
			const access = acl.access({
				role: 'admin',
				transition: 'cancel:blabla:foo',
				method: '*',
			});
			expect(!!access).to.be.true;
		});
	});
});
