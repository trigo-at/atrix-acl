'use strict';

const jwt = require('jsonwebtoken');

const config = {
	jwtDevTokenSecret: 'jwt-token-secret',
};

module.exports = (tenantIds = ['pathfinder-app'], username = 'john.doe@test.com', userId) => {
	let resourceAccess = tenantIds || {
		'pathfinder-app': {
			roles: ['admin'],
		},
	};
	if (Array.isArray(tenantIds)) {
		resourceAccess = {
			'pathfinder-app': {
				roles: tenantIds.map(tid => (tid === 'pathfinder-app' ? 'admin' : `${tid}:admin`)),
			},
		};
	}

	const credentials = {
		preferred_username: username,
		email: username,
		name: username,
		resource_access: resourceAccess,
	};
	if (userId) {
		credentials.userId = userId;
	}
	return jwt.sign(credentials, config.jwtDevTokenSecret, { expiresIn: '10 y', algorithm: 'HS256' });
};
