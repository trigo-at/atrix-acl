'use strict';

const {
	concat, uniq, pipe, isNil, not, filter, isEmpty, contains, map, assoc, and,
} = require('ramda');
const buildTenantIdsFromRoles = require('./build-tenant-ids-from-roles');
const buildRolesDefinitionArrayFromRoles = require('./build-roles-definition-array-from-roles');

const isNotNil = pipe(
	isNil,
	not,
);
const isNotEmpty = pipe(
	isEmpty,
	not,
);

const allRoleForTenant = (tenantId, roles) => filter(r => r.indexOf(`${tenantId}:`) === 0, roles);
const changeTenantsOfRoles = (fromTenant, toTenant, roles) => map((r) => {
	if (r.tenant !== fromTenant) return r;
	return assoc('tenant', toTenant, r);
}, roles);

module.exports = (atrixACL, acls, rawRoles) => {
	const tenantIds = [];
	let roles = [];

	if (isEmpty(acls)) return { tenantIds: [], roles: [] };


	const allUserTenants = buildTenantIdsFromRoles(rawRoles);
	acls.forEach((acl) => {
		if (contains(acl.acl.tenantId, allUserTenants)) {
			tenantIds.push(acl.entityTenantId);
		}

		const rawRolesToMap = allRoleForTenant(acl.acl.tenantId, rawRoles);
		const roleDefinitions = buildRolesDefinitionArrayFromRoles({ atrixACL, roles: rawRolesToMap, source: `acl:${acl.resId}` });
		let newRoles = concat(changeTenantsOfRoles(acl.acl.tenantId, acl.entityTenantId, roleDefinitions), roles);
		if (and(isNotNil(acl.acl.roles), isNotEmpty(acl.acl.roles))) {
			if (!Array.isArray(acl.acl.roles)) throw new Error('alc.alc.roles not of type Array!');
			newRoles = newRoles.filter(r => contains(r.role, acl.acl.roles));
		}
		roles = concat(newRoles, roles);
	});

	return { roles: uniq(roles), tenantIds: uniq(tenantIds) };
};
