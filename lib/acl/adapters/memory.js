'use strict';

const RouteParser = require('route-parser');

let aclRules = [];


const roleFilter = (rule, role) => rule.role && role && rule.role === role;
const userIdFilter = (rule, userId) => rule.userId && userId && rule.userId === userId;
const transitionFilter = (rule, transition) => rule.transition &&
	transition &&
	RouteParser(rule.transition.replace(/:/g, '/')).match(transition.replace(/:/g, '/'));

const pathFilter = (rule, path) => rule.path && path && RouteParser(rule.path).match(path);

module.exports = {
	access: ({ role, path, method, userId, transition }) => aclRules
		.filter(r => roleFilter(r, role) || userIdFilter(r, userId))
		.filter(r => pathFilter(r, path) || transitionFilter(r, transition))
		.filter(r => r.method === '*' || r.method === method)
		.length,

	setRules: (rules) => {
		aclRules = rules;
	},

	getRules: () => aclRules,

	addRule: rule => aclRules.push(rule),

};
