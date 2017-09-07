'use strict';

const getUserData = require('../lib/get-user-data');

module.exports = atrix => (req, next) => {
	const { roles, userId, tenantIds } = getUserData(req, atrix);
	req.auth = Object.assign(req.auth, { effectiveRoles: roles.map(r => r.role), userId, tenantIds });
	return next.continue();
};
