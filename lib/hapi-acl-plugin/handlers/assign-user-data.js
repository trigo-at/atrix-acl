'use strict';

const getUserData = require('../lib/get-user-data');
const {
	uniq, pipe, concat,
} = require('ramda');
const lookupEntityACLs = require('../lib/lookup-entity-acls');
const parseEntityACLs = require('../lib/parse-entity-acls');


module.exports = atrixACL => async (req, next) => {
	const { roles, userId, tenantIds } = await getUserData(req, atrixACL);

	const entityACLs = lookupEntityACLs(req, atrixACL);
	const parsedACLs = parseEntityACLs(atrixACL, entityACLs);

	const allTenantIds = pipe(
		concat(parsedACLs.tenantIds),
		uniq,
	)(tenantIds);

	const allRoles = pipe(
		concat(parsedACLs.roles),
		uniq,
	)(roles);

	req.auth = Object.assign(req.auth, {
		effectiveRoles: uniq(allRoles.map(r => r.role)), userId, tenantIds: allTenantIds, roles: allRoles, entityACLs,
	});
	req.log.debug('Attached ACL auth', req.auth);
	return next.continue();
};
