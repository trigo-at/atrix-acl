'use strict';

const getUserData = require('../lib/get-user-data');
const {
	uniq,
} = require('ramda');


module.exports = atrixACL => async (req, next) => {
	const {
		roles, userId, tenantIds, entityACL,
	} = await getUserData(req, atrixACL);

	req.auth = Object.assign(req.auth, {
		effectiveRoles: uniq(roles.map(r => r.role)), userId, tenantIds, roles, entityACL,
	});
	req.log.debug('Attached ACL auth', req.auth);
	return next.continue();
};
