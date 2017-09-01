'use strict';

const Boom = require('boom');

const getUserData = require('./get-user-data');

let Shot;

// if (process.env.NODE_ENV === 'test') {
//  	Shot = require('hapi/node_modules/shot');  //eslint-disable-line
// } else {
	Shot = require('shot');  //eslint-disable-line
// }

module.exports = (_atrix) => {
	const atrix = _atrix;

	const assignUserData = (req, next) => {
		const { roles, userId, tenantIds } = getUserData(req, atrix);
		req.auth = Object.assign(req.auth, { effectiveRoles: roles, userId, tenantIds });
		return next.continue();
	};

	const onPreResponse = (req, next) => {
		if ((typeof req.response) !== 'object' || !req.response.source) {
			return next.continue();
		}

		if (atrix.allowInject && Shot.isInjection(req.raw.res)) {
			return next.continue();
		}

		const { roles, userId } = getUserData(req, atrix);

		const resources = (() => {
			if (req.response.source.items) {
				return req.response.source.items;
			}
			if (Array.isArray(req.response.source)) {
				return req.response.source;
			}

			return [req.response.source];
		})();

		resources.forEach((item) => {
			if (!item._links) return ; //eslint-disable-line

			const links = item._links; //eslint-disable-line

			const filteredLinks = Object.keys(links).reduce((ret, transition) => {
				const link = links[transition];
				const allowed = roles.some(role => atrix.ACL.access({ role,
					userId,
					transition,
					path: link.href || link.url,
					method: link.method }));

				ret[transition] = allowed ? link : false; //eslint-disable-line
				return ret;
			}, {});

			item._links = filteredLinks; //eslint-disable-line
		});

		return next.continue();
	};

	const onPreHandler = (req, next) => {
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

		const allowed = roles.some(role => atrix.ACL.access({ userId, role, method, route, path }));
		if (allowed) {
			return next.continue();
		}

		return next(Boom.unauthorized('AtrixACL denied'));
	};

	const aclPlugin = {
		register: (server, options, next) => {
			server.ext('onPreHandler', onPreHandler);
			server.ext('onPreHandler', assignUserData);
			server.ext('onPreResponse', onPreResponse);
			next();
		},
	};

	aclPlugin.register.attributes = {
		name: 'AtrixACL',
		version: '0.0.1',
	};

	return aclPlugin;
};
