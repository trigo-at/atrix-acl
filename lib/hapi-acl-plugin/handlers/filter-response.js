'use strict';

const bypassACLs = require('../lib/bypass-acls');
const RouteParser = require('route-parser');
const { filterResource } = require('../lib/filter-properties');


module.exports = atrixACL => (req, next) => {
	if ((typeof req.response) !== 'object' || !req.response.source) {
		return next.continue();
	}

	if (bypassACLs(atrixACL, req)) {
		return next.continue();
	}

	if (atrixACL.ACL.filterRules.length === 0) {
		return next.continue();
	}

	const method = req.method;
	let path = req.path;

	if (atrixACL.getPrefix()) {
		path = path.replace(new RegExp(`^${atrixACL.getPrefix()}`), '');
	}

	const filtered = atrixACL.ACL.filterRules
		.filter(rule => rule.role === '*' ||
			req.auth.effectiveRoles.indexOf(rule.role) >= 0 ||
			(rule.notRole && req.auth.effectiveRoles.indexOf(rule.notRole) === -1))
		.filter(rule => rule.path === '*' || (rule.path && RouteParser(rule.path).match(path)))
		.filter(rule => rule.method === '*' || (rule.method && rule.method === method))
		.reduce((ret, filter) => filterResource(filter, ret, req), req.response.source);

	if (Array.isArray(req.response.source)) {
		req.response.source = filtered;
	} else if (Array.isArray(req.response.source.items)) {
		req.response.source.items = filtered;
	} else {
		req.response.source = Array.isArray(filtered) ? filtered[0] : filtered;
	}

	return next.continue();
};
