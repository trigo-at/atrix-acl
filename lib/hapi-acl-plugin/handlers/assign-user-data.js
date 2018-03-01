'use strict';

const getUserData = require('../lib/get-user-data');
const { uniq } = require('ramda');

module.exports = atrixACL => (req, next) => {
	const { roles, userId, tenantIds } = getUserData(req, atrixACL);
	req.auth = Object.assign(req.auth, {
		effectiveRoles: uniq(roles.map(r => r.role)), userId, tenantIds, roles,
	});
	return next.continue();
};
