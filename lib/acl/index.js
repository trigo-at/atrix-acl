'use strict';

const Boom = require('boom');

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
	 *
	 */
	set rules(value) {
		this._adapter.setRules(value);
	}

	/**
	 * Return the rules array
	 * @return rules array
	 */
	get rules() {
		return this._adapter.getRules();
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
