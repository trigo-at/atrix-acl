'use strict';

const Boom = require('boom');

module.exports = (_atrix) => {
	const atrix = _atrix;

	const handler = (req, next) => {
		const role = req.headers['x-pathfinder-role'];

		const method = req.method;
		const match = req.server.match(method, req.path);
		let path = req.path;
		let route = match.path || req.path;

		if (atrix.getPrefix()) {
			route = route.replace(new RegExp(`^${atrix.getPrefix()}`), '');
			path = path.replace(new RegExp(`^${atrix.getPrefix()}`), '');
		}

		if (atrix.ACL.access({ role, method, route, path })) {
			return next();
		}

		return next(Boom.unauthorized('AtrixACL denied'));
	};

	const aclPlugin = {
		register: (server, options, next) => {
			server.ext('onPreHandler', handler);
			next();
		},
	};

	aclPlugin.register.attributes = {
		name: 'AtrixACL',
		version: '0.0.1',
	};

	return aclPlugin;
};
