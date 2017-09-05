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
		const newFilterRulesValue = value.map((v) => {
			if (Array.isArray(v.key)) {
				return v.key.map(key => Object.assign({ key, when: v.when, value: v.value }));
			}
			return v;
		});

		this._filterRules = R.flatten(newFilterRulesValue);
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
