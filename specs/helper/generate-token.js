'use strict';

const jwt = require('jsonwebtoken');
const R = require('ramda');

const config = {
	jwtDevTokenSecret: 'jwt-token-secret',
};

module.exports = (tenantIds = ['pathfinder-app'], username = 'john.doe@test.com') => {
	let resourceAccess = tenantIds;
	if (Array.isArray(tenantIds)) {
		resourceAccess = tenantIds.reduce((ret, tenant) => R.merge({ [tenant]: { roles: ['admin'] } }, ret), {});
	}

	const credentials = {
		preferred_username: username,
		email: username,
		name: username,
		resource_access: resourceAccess,
	};
	return jwt.sign(credentials, config.jwtDevTokenSecret, { expiresIn: '10 y', algorithm: 'HS256' });
};
