'use strict';

const Boom = require('boom');
const Joi = require('joi');
const {
	pipe, omit, map, flatten, defaultTo,
} = require('ramda');

const entityACLsDefinitionSchema = Joi.array().items(Joi.object({
	entity: Joi.string().required().description('Name of the entity'),
	route: Joi.string().required().description('The route pattern to match. The first matching route is used for evaluation'),
	idParam: Joi.string().default('id').required().description('Name of the "id" property in the parsed route to identify the entity'),
}));
const allowedAdapter = ['memory'];

const parseFilterRules = pipe(
	// assign default values to filter-rule
	map(v => Object.assign({ role: '*', path: '*', method: '*' }, v)),
	// check if key is an array, and add rule for every key-element
	map((rule) => {
		if (Array.isArray(rule.key)) {
			return rule.key.map(key => Object.assign({ key }, omit('key', rule)));
		}
		return rule;
	}),
	flatten,
	// check if roles is an array (,) and add rule for every role
	map(rule => rule.role.split(',').map(role => Object.assign({ role }, omit('role', rule)))),
	flatten,
	// check if role starts with '!' and negate the role
	map((v) => {
		const rule = v;
		if (rule.role[0] === '!') {
			rule.notRole = rule.role;
			delete rule.role;
		}
		return rule;
	}),
);
/**
 * Class representing the AccessControlList
 * @class
 */
class ACL {
	constructor({ rules, adapter = 'memory' }) {
		if (allowedAdapter.indexOf[adapter] <= 0) {
			throw Boom.error();
		}

		this._adapter = require(`./adapters/${adapter}`);  //eslint-disable-line
		this.rules = rules;
	}

	/**
	 * Set the rules of the ACLs
	 * @param {value} array of rule objects:
	 * ```
	 * [
	 * 	{ role: 'editor', path: '/events/*resId/registrations/', method: '*' }
   * ]
	 * ```
	 */
	set rules(value) {
		const rules = value.map(rule => Object.assign({ tenant: '*' }, rule));
		this._adapter.setRules(rules);
	}

	/**
	 * Return the rules array
	 * @return rules array
	 */
	get rules() {
		return this._adapter.getRules();
	}

	set filterRules(value) {
		this._filterRules = parseFilterRules(value);
	}

	get filterRules() {
		return this._filterRules;
	}


	get filterPayloadRules() {
		return this._filterPayloadRules;
	}

	set filterPayloadRules(value) {
		this._filterPayloadRules = parseFilterRules(value);
	}

	add(rule) {
		this._adapter.addRule(rule);
	}

	/**
	 * Check if access to specific resource is allowedAdapter
	 * @param {args} object:
	 * ```
	 * { role: 'editor', path: '/events/242', method: 'post' }
	 * { userId: '123', path: '/events/242', method: 'get' }
	 * ```
	 *
	 * @return boolean
	 */
	access(args) {
		return this._adapter.access(args);
	}

	set entityACLsDefinition(value) {
		this._entityACLsDefinitions = Joi.attempt(value, entityACLsDefinitionSchema);
	}

	get entityACLsDefinition() {
		return defaultTo([], this._entityACLsDefinitions);
	}

	set entityACLs(value) {
		this._entityACLs = value;
	}

	get entityACLs() {
		return defaultTo([], this._entityACLs);
	}
}

module.exports = ACL;
