'use strict';

const Shot = require('shot');
const Boom = require('boom');
const getUserData = require('../lib/get-user-data');

module.exports = atrixACL => (req, next) => {
	if (atrixACL.allowInject && Shot.isInjection(req.raw.res)) {
		return next.continue();
	}

	const { roles, userId } = getUserData(req, atrixACL);

	const method = req.method;
	const match = req.server.match(method, req.path);
	let path = req.path;
	let route = match.path || req.path;

	if (atrixACL.getPrefix()) {
		route = route.replace(new RegExp(`^${atrixACL.getPrefix()}`), '');
		path = path.replace(new RegExp(`^${atrixACL.getPrefix()}`), '');
	}

	if (atrixACL.endpoints.filter(endpoint => !path.match(new RegExp(endpoint))).length) {
		return next.continue();
	}

	const allowed = roles.some(({ tenant, role }) => atrixACL.ACL.access({ userId, tenant, role, method, route, path }));
	if (allowed) {
		return next.continue();
	}

	return next(Boom.unauthorized('AtrixACL denied'));
};
