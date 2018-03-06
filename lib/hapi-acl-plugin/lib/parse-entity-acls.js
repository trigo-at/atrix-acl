'use strict';

const {
	concat, uniq, pipe, map, defaultTo, split, head, ifElse, propEq, isNil, not, filter,
} = require('ramda');

const defaultToEmptyArray = defaultTo([]);
const splitColon = split(':');
const headSplitColon = pipe(
	splitColon,
	ifElse(
		propEq('length', 2),
		head,
		() => null,
	),
);
const isNotNil = pipe(
	isNil,
	not,
);

module.exports = (atrixACL, acl) => {
	const buildTenantRole = (arr) => {
		return { tenant: arr[0], role: arr[1], global: false };
	};

	const buildGlobalRole = (arr) => {
		return { tenant: atrixACL.config.acl.tokenResourceAccessRoleKey, role: arr[0], global: true };
	};
	const buildRole = ifElse(
		propEq('length', 2),
		buildTenantRole,
		buildGlobalRole,
	);
	if (!acl) return { tenantIds: [], roles: [] };

	const tenantIds = pipe(
		concat(map(headSplitColon, defaultToEmptyArray(acl.acl.roles))),
		uniq,
		filter(isNotNil),
	)(defaultToEmptyArray(acl.acl.tenantIds));

	const roles = pipe(
		map(splitColon),
		map(buildRole),
		uniq,
	)(defaultToEmptyArray(acl.acl.roles));

	// console.log({ roles, tenantIds });
	return { roles, tenantIds };
};
