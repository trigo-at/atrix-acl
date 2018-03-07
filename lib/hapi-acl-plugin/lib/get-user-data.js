'use strict';

const { uniq, pathOr, pipe, concat } = require('ramda');
const lookupEntityACLs = require('./lookup-entity-acls');
const parseEntityACLs = require('./parse-entity-acls');

module.exports = (req, atrixACL) => {
	const path = ['auth', 'credentials', 'resource_access', atrixACL.tokenResourceAccessRoleKey, 'roles'];

	const tenantIds = (req.headers[atrixACL.tenantIdsHeaderField] || '').split(',');

	const rawRoles = pathOr([''], path, req);
	const apps = tenantIds.concat(atrixACL.tokenResourceAccessRoleKey);

	let roles = uniq(rawRoles.map((r) => {
		const parts = r.split(':');
		if (parts.length === 1) return 	{ tenant: atrixACL.tokenResourceAccessRoleKey, role: r, global: true };
		return apps.indexOf(parts[0]) !== -1 ? { tenant: parts[0], role: parts[1], global: false } : undefined;
	}).filter(r => !!r));

	roles = roles.length === 0 ? [{ app: '', role: '' }] : roles;

	const entityACL = lookupEntityACLs(req, atrixACL);
	const parsedACLs = parseEntityACLs(atrixACL, entityACL);

	const allTenantIds = pipe(
		concat(parsedACLs.tenantIds),
		uniq,
	)(tenantIds);

	const allRoles = pipe(
		concat(parsedACLs.roles),
		uniq,
	)(roles);

	return {
		userId: pathOr(null, ['auth', 'credentials', 'userId'], req),
		tenantIds: allTenantIds,
		roles: allRoles,
		entityACL,
	};
};
