'use strict';

const {
	isNil, not, pipe, pick, concat, uniq, contains, clone,
} = require('ramda');
const parseEntityACLs = require('./parse-entity-acls');

const isNotNil = pipe(isNil, not);

module.exports = (atrixACL, req, links, providedRoles, acl, userId, tenantId) => {
	// console.log('=== LINKS BEFORE ===', JSON.stringify(links, null, 2));
	let roles = clone(providedRoles);
	let effectiveTenantIds = [tenantId];
	if (acl) {
		const parsedACLs = parseEntityACLs(atrixACL, { acl });
		// console.log('=== Found entity _acl:', parsedACLs);
		// console.log('=== Roles:', roles);
		roles = pipe(
			concat(parsedACLs.roles),
			uniq,
		)(roles);
		// console.log('=== new roles:', roles);
		// console.log('=== TenantIds:', effectiveTenantIds);
		effectiveTenantIds = pipe(
			concat(parsedACLs.tenantIds),
			uniq,
		)(effectiveTenantIds);
		// console.log('=== new TenantIds:', effectiveTenantIds);
		atrixACL.log.debug('Found item._acl:', acl, 'effective roles:', roles, 'effectiveTenantIds:', effectiveTenantIds);
	}


	const filteredRoles = tenantId
		? roles.filter(r => contains(r.tenant, effectiveTenantIds) || r.global)
		: roles;

	const filtered = Object.keys(links).reduce((ret, transition) => {
		const link = links[transition];
		const linkPath = link.href || link.url;
		const allowed = filteredRoles.find(({ tenant, role }) => atrixACL.ACL.access({
			role,
			userId,
			tenant,
			transition,
			path: linkPath,
			method: link.method || 'get',
		}));

		if (isNotNil(allowed)) {
			atrixACL.log.debug(
				'Grant transition:', transition,
				'link:', link,
				'of resource:', linkPath,
				'with tenantId:', tenantId,
				'acl:', (acl || 'n/a'),
				'in context:', pick(['roles', 'tenantIds'], req.auth),
				'due to rule:', allowed,
			);
		}
			ret[transition] = isNotNil(allowed) ? link : false; //eslint-disable-line
		return ret;
	}, {});

	// console.log('=== LINKS AFTER ===', JSON.stringify(filtered, null, 2));
	return filtered;
};
