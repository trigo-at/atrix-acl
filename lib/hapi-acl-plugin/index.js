'use strict';

const Boom = require('boom');

let Shot;

if (process.env.NODE_ENV === 'test') {
 	Shot = require('hapi/node_modules/shot');  //eslint-disable-line
} else {
	Shot = require('shot');  //eslint-disable-line
}

module.exports = (_atrix) => {
	const atrix = _atrix;

	const handler = (req, next) => {
		if (atrix.allowInject && Shot.isInjection(req.raw.res)) {
			return next.continue();
		}

		const role = req.headers['x-pathfinder-role'];
		const userId = req.headers['x-pathfinder-userid'];

		const method = req.method;
		const match = req.server.match(method, req.path);
		let path = req.path;
		let route = match.path || req.path;

		if (atrix.getPrefix()) {
			route = route.replace(new RegExp(`^${atrix.getPrefix()}`), '');
			path = path.replace(new RegExp(`^${atrix.getPrefix()}`), '');
		}

		if (atrix.ACL.access({ userId, role, method, route, path })) {
			return next.continue();
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
