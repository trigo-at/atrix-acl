'use strict';

const filterResponseBody = require('./handlers/filter-response');
const filterHatrLinks = require('./handlers/filter-hatr-links');
const assignUserData = require('./handlers/assign-user-data');
const guardRequests = require('./handlers/guard-requests');

module.exports = (_atrix) => {
	const atrix = _atrix;

	const aclPlugin = {
		register: (server, options, next) => {
			server.ext('onPreHandler', guardRequests(atrix));
			server.ext('onPreHandler', assignUserData(atrix));
			server.ext('onPreResponse', filterHatrLinks(atrix));
			server.ext('onPreResponse', filterResponseBody(atrix));
			next();
		},
	};

	aclPlugin.register.attributes = {
		name: 'AtrixACL',
		version: '0.0.1',
	};

	return aclPlugin;
};
