'use strict';

const Boom = require('boom');

const allowedAdapter = ['memory'];

class ACL {
	constructor({ rules, adapter = 'memory' }) {
		if (allowedAdapter.indexOf[adapter] <= 0) {
			throw Boom.error();
		}

		this._adapter = require(`./adapters/${adapter}`);  //eslint-disable-line
		this.rules = rules;
	}

	set rules(value) {
		this._adapter.setRules(value);
	}

	get rules() {
		return this._adapter.getRules();
	}

	add(rule) {
		this._adapter.addRule(rule);
	}

	access(args) {
		return this._adapter.access(args);
	}
}

module.exports = ACL;
