'use strict';

const {
	isEmpty, contains, prop, pathOr, append, isNil, type, not, pipe, intersection,
} = require('ramda');

const isNotNil = pipe(isNil, not);
const isNotEmpty = pipe(isEmpty, not);

module.exports = (doc, userRoles, filteredUserTenants, atrixACL) => {
	if (isNil(doc) || type(doc) !== 'Object') return true;

	const hasTenantIdProperty = isNotNil(pathOr(null, [atrixACL.config.acl.tenantIdProperty], doc));
	const hasTenantAclProperty = isNotNil(pathOr(null, [atrixACL.config.acl.aclProperty], doc));
	const aclTenantIds = pathOr([], [atrixACL.config.acl.aclProperty, 'tenantIds'], doc);
	const getTenantId = prop(atrixACL.config.acl.tenantIdProperty);

	if (hasTenantAclProperty) {
		// macth based on acl roles definition
		return isNotEmpty(intersection(filteredUserTenants, aclTenantIds));
	}

	if (hasTenantIdProperty) {
		// return tenant match based on header field filterd tenant list from user
		return contains(getTenantId(doc), append(atrixACL.config.acl.matchAllTenantId, filteredUserTenants));
	}

	return true;
};
