'use strict';

const Shot = require('shot');
const { filterResource } = require('../lib/filter-properties');


module.exports = atrix => (req, next) => {
	if ((typeof req.response) !== 'object' || !req.response.source) {
		return next.continue();
	}

	if (atrix.allowInject && Shot.isInjection(req.raw.res)) {
		return next.continue();
	}

	const filtered = atrix.ACL.filterRules
		.filter(rule => rule.role === '*' ||
			req.auth.effectiveRoles.indexOf(rule.role) >= 0 ||
			(rule.notRole && req.auth.effectiveRoles.indexOf(rule.notRole) === -1))
		.reduce((ret, filter) => filterResource(filter, ret, req), req.response.source);

	if (req.response.source.items) {
		req.response.source = filtered;
	} else {
		req.response.source = Array.isArray(filtered) ? filtered[0] : filtered;
	}

	return next.continue();
};