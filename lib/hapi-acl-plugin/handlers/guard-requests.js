'use strict';

const Boom = require('boom');
const getUserData = require('../lib/get-user-data');
const bypassACLs = require('../lib/bypass-acls');


module.exports = atrixACL => (req, next) => {
	if (bypassACLs(atrixACL, req)) {
		return next.continue();
	}

	const { roles, userId } = getUserData(req, atrixACL);

	const { method } = req;
	const match = req.server.match(method, req.path);
	let { path } = req;
	let route = match.path || req.path;

	if (atrixACL.getPrefix()) {
		route = route.replace(new RegExp(`^${atrixACL.getPrefix()}`), '');
		path = path.replace(new RegExp(`^${atrixACL.getPrefix()}`), '');
	}

	if (atrixACL.endpoints.filter(endpoint => !path.match(new RegExp(endpoint))).length) {
		return next.continue();
	}

	const allowed = roles.some(({ tenant, role }) => atrixACL.ACL.access({
		userId, tenant, role, method, route, path,
	}));
	if (allowed) {
		return next.continue();
	}

	return next(Boom.unauthorized('AtrixACL denied'));
};
