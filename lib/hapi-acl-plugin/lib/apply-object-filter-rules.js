'use strict';

const RouteParser = require('./route-parser');
const { filterResource } = require('./filter-properties');

module.exports = ({
	req,
	atrixACL,
	object,
	rules,
}) => {
	const { method } = req;
	let { path } = req;

	path = atrixACL.fixPath(path);
	return rules
		.filter(rule => rule.role === '*' ||
			req.auth.effectiveRoles.indexOf(rule.role) >= 0 ||
			(rule.notRole && req.auth.effectiveRoles.indexOf(rule.notRole) === -1))
		.filter(rule => rule.path === '*' || (rule.path && RouteParser(rule.path).match(path)))
		.filter(rule => rule.method === '*' || (rule.method && rule.method === method))
		.reduce((ret, filter) => filterResource(filter, ret, req), object);
};
