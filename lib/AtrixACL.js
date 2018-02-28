'use strict';

const fs = require('fs');
const ACL = require('./acl');
const hapiACLPlugin = require('./hapi-acl-plugin');
const { clone, merge } = require('ramda');

const Joi = require('joi');

const configSchema = Joi.object({
	aclDefinition: Joi.string().description('path to the acl definitions file'),
	filterPropertiesDefinition: Joi.string().description('path to the filter properties definition file'),
	allowInject: Joi.boolean().default(true).description('wheter to allow inject calls'),
	tokenResourceAccessRoleKey: Joi.string().default('pathfinder-app').description('name of the default token ressource_access.<key> to get list of user roles'),
	tenantIdsHeaderField: Joi.string().default('x-pathfinder-tenant-ids').description('name of the tenant ids header field'),
	endpoints: Joi.array().items(Joi.string()).default([]).description('List of endpoint to apply ACLs on'),
});

class AtrixACL {
	constructor(atrix, service) {
		Joi.attempt(service.config.config.acl, configSchema);
		this.atrix = atrix;
		this.service = service;
		this.log = this.service.log.child({ plugin: 'AtrixACL' });
		this.config = merge(clone(service.config.config), {
			acl: Joi.attempt(service.config.config.acl, configSchema),
		});

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
		this.loadFilterPropertiesDefinition();
		this.loadFilterPayloadDefinition();

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

	setFilterRules(rules) {
		if (this.ACL) {
			this.ACL.filterRules = rules;
		}
	}

	setPayloadFilterRules(rules) {
		if (this.ACL) {
			this.ACL.filterPayloadRules = rules;
		}
	}

	async loadACLDefintion() {
		const rules = require(this.config.acl.aclDefinition)(); //eslint-disable-line
		this.ACL = new ACL({ rules, adapter: this.adapter });
	}

	async loadFilterPropertiesDefinition() {
		if (fs.existsSync(this.config.acl.filterPropertiesDefinition)) {
			const filterRules = require(this.config.acl.filterPropertiesDefinition)(); //eslint-disable-line
			this.ACL.filterRules = filterRules;
		} else {
			this.ACL.filterRules = [];
		}
	}
	async loadFilterPayloadDefinition() {
		if (fs.existsSync(this.config.acl.filterPayloadDefinition)) {
			const filterRules = require(this.config.acl.filterPayloadDefinition)(); //eslint-disable-line
			this.ACL.filterPayloadRules = filterRules;
		} else {
			this.ACL.filterPayloadRules = [];
		}
	}

	getPrefix() {
		if (this.config.endpoints && this.config.endpoints.http && this.config.endpoints.http.prefix) {
			return this.config.endpoints.http.prefix;
		}
		return '';
	}
}

module.exports = AtrixACL;
