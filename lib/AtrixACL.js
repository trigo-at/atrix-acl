'use strict';

const fs = require('fs');
const ACL = require('./acl');
const hapiACLPlugin = require('./hapi-acl-plugin');
const { clone, merge } = require('ramda');
const fetch = require('node-fetch');
const Joi = require('joi');

const configSchema = Joi.object({
	aclDefinition: Joi.string().description('path to the acl definitions file'),
	filterPropertiesDefinition: Joi.string().description('path to the filter properties definition file'),
	filterPayloadDefinition: Joi.string().description('path to filter payload definitions file'),
	allowInject: Joi.boolean().default(true).description('wheter to allow inject calls'),
	tokenResourceAccessRoleKey: Joi.string().default('pathfinder-app').description('name of the default token ressource_access.<key> to get list of user roles'),
	tenantIdsHeaderField: Joi.string().default('x-pathfinder-tenant-ids').description('name of the tenant ids header field'),
	tenantIdProperty: Joi.string().default('tenantId').description('name of the tenantId field for object filtering'),
	matchAllTenantId: Joi.string().default('_all').description('The magic tenant id value that matches all tenants'),
	aclProperty: Joi.string().default('_acl').description('name of the ACL property for object filtering'),
	endpoints: Joi.array().items(Joi.string()).default([]).description('List of endpoint to apply ACLs on'),
	entityACLServiceUrl: Joi.string().allow(null, '').description('the URL to ftech the entityACLs from. must provide the endpoint GET /acls/{serviceName}'),
	aclFetchInterval: Joi.number().integer().default(3000).description('Number of miliseconds to wait between entityACL refresh calls'),
});


const stringOrStringArray = Joi.alternatives().try(
	Joi.string(),
	Joi.array().items(Joi.string()),
);

const ruleSchema = Joi.object({
	tenant: Joi.string().description('the tenant to match'),
	role: Joi.string().description('the role to match'),
	method: stringOrStringArray.description('the mathod to match'),
	path: Joi.string().description('the path to match'),
	transition: Joi.string().description('the transition to match'),
	entity: Joi.string().description('the entity this path is associated with'),
	idParam: Joi.string().description('the param name of the entities\'s id value in the path'),
});

const rulesSchema = Joi.array().items(ruleSchema);

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

		this.loadACLDefintion();
		this.loadFilterPropertiesDefinition();
		this.loadFilterPayloadDefinition();
		this.setupEntityACLFetcher();

		if (!httpEndpoint.instance.server.registrations.AtrixACL) {
			httpEndpoint.instance.server.register(hapiACLPlugin(this), (err) => {   //eslint-disable-line
				if (err) {
					throw new Error('Error registering Hapi ACL Plugin', err);
				}
			});
		}
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

	setEntityACLs(acls) {
		if (this.ACL) {
			this.ACL.entityACLs = acls;
		}
	}

	loadACLDefintion() {
		if (!fs.existsSync(this.config.acl.aclDefinition)) {
			throw new Error(`No aclDefinition found at "${this.config.acl.aclDefinition}"`);
		}
		const rules = require(this.config.acl.aclDefinition)(); //eslint-disable-line
		Joi.assert(rules, rulesSchema);
		this.ACL = new ACL({ rules, adapter: this.adapter });
	}

	loadFilterPropertiesDefinition() {
		if (this.config.acl.filterPropertiesDefinition && !fs.existsSync(this.config.acl.filterPropertiesDefinition)) {
			throw new Error(`No filterPropertiesDefinition found at "${this.config.acl.filterPropertiesDefinition}"`);
		}
		if (fs.existsSync(this.config.acl.filterPropertiesDefinition)) {
			const filterRules = require(this.config.acl.filterPropertiesDefinition)(); //eslint-disable-line
			this.log.info('Loading filterPropertiesDefinition:', filterRules);
			this.ACL.filterRules = filterRules;
		} else {
			this.log.info('No filterPropertiesDefinition configured.');
			this.ACL.filterRules = [];
		}
	}

	loadFilterPayloadDefinition() {
		if (this.config.acl.filterPayloadDefinition && !fs.existsSync(this.config.acl.filterPayloadDefinition)) {
			throw new Error(`No filterPayloadDefinition found at "${this.config.acl.filterPayloadDefinition}"`);
		}
		if (fs.existsSync(this.config.acl.filterPayloadDefinition)) {
			const filterRules = require(this.config.acl.filterPayloadDefinition)(); //eslint-disable-line
			this.log.info('Loading filterPayloadDefinition:', filterRules);
			this.ACL.filterPayloadRules = filterRules;
		} else {
			this.log.info('No filterPayloadDefinition configured.');
			this.ACL.filterPayloadRules = [];
		}
	}

	setupEntityACLFetcher() {
		if (!this.config.acl.entityACLServiceUrl) return;
		const fetchAndLoadACLs = async () => {
			this.log.debug(`Fetching ACLs from: ${this.config.acl.entityACLServiceUrl}/acls/${this.service.name}...`);
			const res = await fetch(`${this.config.acl.entityACLServiceUrl}/acls/${this.service.name}`);
			if (res.status !== 200) {
				const body = await res.text();
				this.log.error(`Could not fetch ACLs from: ${this.config.acl.entityACLServiceUrl}/acls/${this.service.name}`, res.statusText, res.status, body);
				return;
			}
			const json = await res.json();
			this.log.debug('Loading ACLs', json);
			try {
				this.setEntityACLs(json.acls);
				this.log.info('Entity ACLs updated sucessfully.');
			} catch (e) {
				this.log.error(e);
			}
		};

		const doIt = async () => {
			try {
				await fetchAndLoadACLs();
			} catch (e) {
				this.log.error(e);
			} finally {
				setTimeout(doIt.bind(this), this.config.acl.aclFetchInterval);
			}
		};

		doIt();
	}

	getPrefix() {
		if (this.config.endpoints && this.config.endpoints.http && this.config.endpoints.http.prefix) {
			return this.config.endpoints.http.prefix;
		}
		return '';
	}

	fixPath(path) {
		if (!this.getPrefix()) return path;
		const regExpStr = `^${this.getPrefix()}`;
		const regExp = new RegExp(regExpStr);
		return path.replace(regExp, '');
	}
}

module.exports = AtrixACL;
