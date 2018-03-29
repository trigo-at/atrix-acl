'use strict';

const {
	concat, uniq, pipe, defaultTo, isNil, not, filter,
} = require('ramda');
const buildTenantIdsFromRoles = require('./build-tenant-ids-from-roles');
const buildRolesDefinitionArrayFromRoles = require('./build-roles-definition-array-from-roles');

const defaultToEmptyArray = defaultTo([]);
const isNotNil = pipe(
	isNil,
	not,
);

module.exports = (atrixACL, acl) => {
	if (!acl) return { tenantIds: [], roles: [] };

	const tenantIds = pipe(
		concat(buildTenantIdsFromRoles(acl.acl.roles)),
		uniq,
		filter(isNotNil),
	)(defaultToEmptyArray(acl.acl.tenantIds));

	const roles = buildRolesDefinitionArrayFromRoles({ atrixACL, roles: defaultToEmptyArray(acl.acl.roles) });

	return { roles, tenantIds };
};
