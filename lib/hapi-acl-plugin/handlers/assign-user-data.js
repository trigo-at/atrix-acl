'use strict';

const getUserData = require('../lib/get-user-data');
const {
	uniq, pick,
} = require('ramda');


module.exports = atrixACL => async (req, next) => {
	const {
		roles, userId, tenantIds, entityACLs,
	} = await getUserData(req, atrixACL);

	req.auth = Object.assign(req.auth, {
		effectiveRoles: uniq(roles.map(r => r.role)), userId, tenantIds, roles, entityACLs,
	});
	req.log.debug('Attached ACL auth', pick(['roles', 'effectiveRoles', 'tenantIds', 'userId', 'entityACL'], req.auth));
	return next.continue();
};
