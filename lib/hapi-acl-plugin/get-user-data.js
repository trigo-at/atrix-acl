'use strict';

const R = require('ramda');

module.exports = (req, config) => {
	const roles = R.pathOr([''],
		['auth', 'credentials', 'resource_access', config.tokenResourceAccessRoleKey, 'roles'],
		req);

	return {
		userId: req.headers['x-pathfinder-userid'],
		roles,
	};
};
