'use strict';

const fs = require('fs');
const ACL = require('./acl');
const hapiACLPlugin = require('./hapi-acl-plugin');

class AtrixACL {
	constructor(atrix, service) {
		this.atrix = atrix;
		this.service = service;
		this.config = service.config.config;
		this.log = this.service.log.child({ plugin: 'AtrixACL' });

		if (!this.config.acl) {
			this.log.warn(`No "acl" section found config of service "${this.service.name}"`);
			return;
		}

		this.adapter = this.config.acl.adapter || 'memory';
		this.allowInject = this.config.acl.allowInject;
		this.endpoints = this.config.acl.endpoints || [];
		this.tokenResourceAccessRoleKey = this.config.acl.tokenResourceAccessRoleKey;
		this.tenantIdsHeaderField = this.config.acl.tenantIdsHeaderField || 'x-pathfinder-tenant-ids';

		const httpEndpoint = this.service.endpoints.get('http');
		if (!httpEndpoint) {
			throw new Error('No httpEndpoint found');
		}

		if (!fs.existsSync(this.config.acl.aclDefinition)) {
			throw new Error(`No aclDefinition found at "${this.config.acl.aclDefinition}"`);
		}

		this.loadACLDefintion();

		httpEndpoint.instance.server.register(hapiACLPlugin(this), (err) => {   //eslint-disable-line
			if (err) {
				throw new Error('Error registering Hapi ACL Plugin', err);
			}
		});
	}

	setRules(rules) {
		if (this.ACL) {
			this.ACL.rules = rules;
		}
	}

	async loadACLDefintion() {
		const rules = require(this.config.acl.aclDefinition)(); //eslint-disable-line
		this.ACL = new ACL({ rules, adapter: this.adapter });
	}

	getPrefix() {
		if (this.config.endpoints && this.config.endpoints.http && this.config.endpoints.http.prefix) {
			return this.config.endpoints.http.prefix;
		}
		return '';
	}
}

module.exports = AtrixACL;
