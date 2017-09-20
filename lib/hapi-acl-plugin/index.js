'use strict';

const Boom = require('boom');

const getUserData = require('./get-user-data');
const Shot = require('shot');  //eslint-disable-line
const pkg = require('../../package.json');

module.exports = (_atrix) => {
	const atrix = _atrix;

	const assignUserData = (req, next) => {
		const { roles, userId, tenantIds } = getUserData(req, atrix);
		req.auth = Object.assign(req.auth, { effectiveRoles: roles, userId, tenantIds });
		return next.continue();
	};

	const onRequest = (req, next) => {
		req.plugins.atrixACL = {};
		if (req.headers['x-atrix-acl-no-inejct-bypass']) {
			delete req.headers['x-atrix-acl-no-inejct-bypass'];
			req.plugins.atrixACL.noInjectBypass = true;
		}

		next.continue();
	};

	const bypassACLs = req => !req.plugins.atrixACL.noInjectBypass && atrix.allowInject && Shot.isInjection(req.raw.res);

	const onPreResponse = (req, next) => {
		if (!req.response.source) {
			return next.continue();
		}

		if (bypassACLs(req)) {
			return next.continue();
		}

		const { roles, userId } = getUserData(req, atrix);

		const resources = Array.isArray(req.response.source) ? req.response.source : [req.response.source];

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
		if (bypassACLs(req)) {
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
			server.ext('onRequest', onRequest);
			server.ext('onPreHandler', onPreHandler);
			server.ext('onPreHandler', assignUserData);
			server.ext('onPreResponse', onPreResponse);

			next();
		},
	};

	aclPlugin.register.attributes = {
		name: 'AtrixACL',
		version: pkg.version,
	};

	return aclPlugin;
};
