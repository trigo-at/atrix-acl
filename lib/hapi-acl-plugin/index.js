'use strict';

const Boom = require('boom');
const R = require('ramda');

const filterWithKeys = (pred, obj) => R.pipe(
	R.toPairs,
	R.filter(R.apply(pred)),
	R.fromPairs,
)(obj);

let Shot;

if (process.env.NODE_ENV === 'test') {
 	Shot = require('hapi/node_modules/shot');  //eslint-disable-line
} else {
	Shot = require('shot');  //eslint-disable-line
}

module.exports = (_atrix) => {
	const atrix = _atrix;


	const onPreResponse = (req, next) => {
		if (atrix.allowInject && Shot.isInjection(req.raw.res)) {
			return next.continue();
		}

		const role = req.headers['x-pathfinder-role'];
		const userId = req.headers['x-pathfinder-userid'];

		if (req.response.source && req.response.source._links) { //eslint-disable-line
			const filteredLinks = filterWithKeys((transition, link) => { //eslint-disable-line
				return atrix.ACL.access({ role, userId, transition, path: link.href, method: link.method });
			}, req.response.source._links); //eslint-disable-line
			req.response.source._links = filteredLinks; //eslint-disable-line
		}

		return next.continue();
	};

	const onPreHandler = (req, next) => {
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

		if (atrix.endpoints.filter(endpoint => !path.match(new RegExp(endpoint))).length) {
			return next.continue();
		}

		if (atrix.ACL.access({ userId, role, method, route, path })) {
			return next.continue();
		}

		return next(Boom.unauthorized('AtrixACL denied'));
	};

	const aclPlugin = {
		register: (server, options, next) => {
			server.ext('onPreHandler', onPreHandler);
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
