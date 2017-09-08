'use strict';

const getUserData = require('../lib/get-user-data');

module.exports = atrixACL => (req, next) => {
	const { roles, userId, tenantIds } = getUserData(req, atrixACL);
	req.auth = Object.assign(req.auth, { effectiveRoles: roles.map(r => r.role), userId, tenantIds });
	return next.continue();
};
