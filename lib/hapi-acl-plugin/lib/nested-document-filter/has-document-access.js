'use strict';

const {
	has, contains, prop, pathOr, append, isNil, type, not, pipe
} = require('ramda');
const matchUserRoles = require('./match-user-roles');

const isNotNil = pipe(isNil, not)

module.exports = (doc, userRoles, filteredUserTenants, atrixACL) => {
	if (isNil(doc) || type(doc) !== 'Object') return true;

	const hasTenantIdProperty = isNotNil(pathOr(null, [atrixACL.config.acl.tenantIdProperty], doc));
	const hasTenantAclProperty = isNotNil(pathOr(null, [atrixACL.config.acl.aclProperty], doc));
	const aclRoles = pathOr([], [atrixACL.config.acl.aclProperty, 'roles'], doc);
	const getTenantId = prop(atrixACL.config.acl.tenantIdProperty);

	if (hasTenantAclProperty) {
		// macth based on acl roles definition
		return matchUserRoles(userRoles, aclRoles);
	}

	if (hasTenantIdProperty) {
		// return tenant match based on header field filterd tenant list from user
		return contains(getTenantId(doc), append(atrixACL.config.acl.matchAllTenantId, filteredUserTenants));
	}

	return true;
};
