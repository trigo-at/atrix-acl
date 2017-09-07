'use strict';

const Shot = require('shot');
const Boom = require('boom');
const getUserData = require('../lib/get-user-data');

module.exports = atrix => (req, next) => {
	if (atrix.allowInject && Shot.isInjection(req.raw.res)) {
		return next.continue();
	}

	const { roles, userId } = getUserData(req, atrix);

	const method = req.method;
	const match = req.server.match(method, req.path);
	let path = req.path;
	let route = match.path || req.path;

	if (atrix.getPrefix()) {
		route = route.replace(new RegExp(`^${atrix.getPrefix()}`), '');
		path = path.replace(new RegExp(`^${atrix.getPrefix()}`), '');
	}

	if (atrix.endpoints.filter(endpoint => !path.match(new RegExp(endpoint))).length) {
		return next.continue();
	}

	const allowed = roles.some(({ tenant, role }) => atrix.ACL.access({ userId, tenant, role, method, route, path }));
	if (allowed) {
		return next.continue();
	}

	return next(Boom.unauthorized('AtrixACL denied'));
};
