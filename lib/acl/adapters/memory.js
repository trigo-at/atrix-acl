'use strict';

const RouteParser = require('route-parser');

let aclRules = [];


const roleFilter = (rule, role) => rule.role && role && rule.role === role;
const userIdFilter = (rule, userId) => rule.userId && userId && rule.userId === userId;

module.exports = {

	access: ({ role, path, method, userId }) => aclRules
		.filter(r => roleFilter(r, role) || userIdFilter(r, userId))
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
