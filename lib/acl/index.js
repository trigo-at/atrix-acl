'use strict';

const Boom = require('boom');
const R = require('ramda');

const allowedAdapter = ['memory'];

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
		const rules = R.pipe(
			// assign default values to filter-rule
			R.map(v => Object.assign({ role: '*', path: '*', method: '*' }, v)),
			// check if key is an array, and add rule for every key-element
			R.map((rule) => {
				if (Array.isArray(rule.key)) {
					return rule.key.map(key => Object.assign({ key }, R.omit('key', rule)));
				}
				return rule;
			}),
			R.flatten,
			// check if roles is an array (,) and add rule for every role
			R.map(rule => rule.role.split(',').map(role => Object.assign({ role }, R.omit('role', rule)))),
			R.flatten,
			// check if role starts with '!' and negate the role
			R.map((v) => {
				const rule = v;
				if (rule.role[0] === '!') {
					rule.notRole = rule.role;
					delete rule.role;
				}
				return rule;
			}),
		)(value);
		this._filterRules = rules;
	}

	get filterRules() {
		return this._filterRules;
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
}

module.exports = ACL;
