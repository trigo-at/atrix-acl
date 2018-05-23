'use strict';

const {
	uniq, pathOr, pipe, concat, filter, intersection, contains,
} = require('ramda');

const lookupEntityACLs = require('./lookup-entity-acls');
const parseEntityACLs = require('./parse-entity-acls');
const buildRolesDefinitionArrayFromRoles = require('./build-roles-definition-array-from-roles');
const buildTenantIdsFromRoles = require('./build-tenant-ids-from-roles');

module.exports = (req, atrixACL) => {
	const path = ['auth', 'credentials', 'resource_access', atrixACL.tokenResourceAccessRoleKey, 'roles'];

	const rawRoles = pathOr([''], path, req);
	const headerDefinedTenants = (req.headers[atrixACL.tenantIdsHeaderField] || '').split(',');
	const tokenDefinedTenants = buildTenantIdsFromRoles(rawRoles);
	const effectiveTenants = intersection(tokenDefinedTenants, headerDefinedTenants);

	let roles = buildRolesDefinitionArrayFromRoles({ atrixACL, roles: rawRoles });
	roles = filter(r => r.global || contains(r.tenant, effectiveTenants), roles);
	roles = roles.length === 0 ? [{ app: '', role: '' }] : roles;

	const entityACLs = lookupEntityACLs({
		path: req.path, method: req.method, log: req.log, atrixACL,
	});
	const parsedACLs = parseEntityACLs(atrixACL, entityACLs, rawRoles);
	console.log(entityACLs, rawRoles, parsedACLs);

	const allRoles = pipe(
		concat(parsedACLs.roles),
		uniq,
	)(roles);

	const allTenantIds = pipe(
		// append tenantIds that are applied by entity ACL definition
		concat(parsedACLs.tenantIds),
		uniq,
	)(effectiveTenants);

	return {
		userId: pathOr(null, ['auth', 'credentials', 'userId'], req),
		tenantIds: allTenantIds,
		roles: allRoles,
		entityACLs,
	};
};
