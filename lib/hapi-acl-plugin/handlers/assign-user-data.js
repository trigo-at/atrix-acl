'use strict';

const getUserData = require('../lib/get-user-data');
const { uniq, find } = require('ramda');
const lookupEntittyACLConfig = require('../lib/lookup-entity-acl-config');


module.exports = atrixACL => async (req, next) => {
	const { roles, userId, tenantIds } = await getUserData(req, atrixACL);

	const acls = lookupEntittyACLConfig(req, atrixACL);

	req.auth = Object.assign(req.auth, {
		effectiveRoles: uniq(roles.map(r => r.role)), userId, tenantIds, roles,
	});
	return next.continue();
};
