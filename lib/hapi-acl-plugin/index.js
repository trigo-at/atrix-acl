'use strict';

const pkg = require('../../package.json');
const assignUserData = require('./handlers/assign-user-data');
const assignHasAccess = require('./handlers/assign-has-access');
const assignAssertAccess = require('./handlers/assign-assert-access');
const filterHatrLinks = require('./handlers/filter-hatr-links');
const filterResponseBody = require('./handlers/filter-response');
const filterPayload = require('./handlers/filter-payload');
const guardRequests = require('./handlers/guard-requests');
const paresAclNoInjectBypassHeader = require('./handlers/parse-acl-no-inject-bypass-header');

module.exports = _atrix => {
	const atrix = _atrix;

	const aclPlugin = {
		register: (server, options, next) => {
			server.ext('onRequest', paresAclNoInjectBypassHeader(atrix));
			server.ext('onPreHandler', assignUserData(atrix));
			server.ext('onPreHandler', guardRequests(atrix));
			server.ext('onPreHandler', filterPayload(atrix));
			server.ext('onPreResponse', filterHatrLinks(atrix));
			server.ext('onPreResponse', filterResponseBody(atrix));
			server.decorate('request', 'hasAccess', assignHasAccess(atrix));
			server.decorate(
				'request',
				'assertAccess',
				assignAssertAccess(atrix)
			);
			next();
		},
	};

	aclPlugin.register.attributes = {
		name: 'AtrixACL',
		version: pkg.version,
	};

	return aclPlugin;
};
