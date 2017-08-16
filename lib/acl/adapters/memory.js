'use strict';

const RouteParser = require('route-parser');

let aclRules = [];

module.exports = {

	access: ({ role, path, method }) => aclRules
		.filter(r => r.role === role)
		.filter((r) => {
			const template = RouteParser(r.path);
			const match = template.match(path);
			return match;
		})
		.filter(r => r.method === '*' || r.method === method)
		.length,

	setRules: (rules) => {
		aclRules = rules;
	},

	getRules: () => aclRules,

	addRule: rule => aclRules.push(rule),

};
