'use strict';

const bypassACLs = require('../lib/bypass-acls');
const RouteParser = require('route-parser');
const { filterResource } = require('../lib/filter-properties');
const {
	clone, dissocPath, forEach, reduce,
} = require('ramda');


module.exports = atrixACL => (req, next) => {
	if ((typeof req.payload) !== 'object') {
		return next.continue();
	}

	if (atrixACL.ACL.filterPayloadRules.length === 0) {
		return next.continue();
	}

	const { method } = req;
	let { path } = req;


	if (atrixACL.getPrefix()) {
		path = path.replace(new RegExp(`^${atrixACL.getPrefix()}`), '');
	}

	console.log(atrixACL.ACL.filterPayloadRules);
	const matchingRules = atrixACL.ACL.filterPayloadRules
		.filter(rule => rule.role === '*' ||
			req.auth.effectiveRoles.indexOf(rule.role) >= 0 ||
			(rule.notRole && req.auth.effectiveRoles.indexOf(rule.notRole) === -1))
		.filter(rule => RouteParser(rule.path).match(path));

	console.log(matchingRules);

	const newPayload = reduce((payload, rule) => reduce((p, omit) => {
		console.log(omit, p);
		const om = Array.isArray(omit) ? omit : [omit];
		return dissocPath(om, p);
	}, payload, rule.omit), req.payload, matchingRules);

	req.payload = newPayload;
	return next.continue();
};
