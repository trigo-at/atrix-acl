'use strict';

const {
	isNil, not, pipe, pick, concat, uniq, contains, clone,
} = require('ramda');
const parseEntityACLs = require('./parse-entity-acls');
const lookupEntityACLs = require('./lookup-entity-acls');

const isNotNil = pipe(isNil, not);

module.exports = (atrixACL, req, links, providedRoles, userId, tenantId) => {
	const filtered = Object.keys(links).reduce((ret, transition) => {
		let roles = clone(providedRoles);
		let effectiveTenantIds = [tenantId];
		const link = links[transition];
		const linkPath = link.href || link.url;
		const linkMethod = link.method || 'get';
		let entityACL;
		if (linkPath && linkMethod) {
			entityACL = lookupEntityACLs({
				path: linkPath, method: linkMethod, log: req.log, atrixACL,
			});
			const parsedACLs = parseEntityACLs(atrixACL, entityACL);

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
			atrixACL.log.debug('Found entityACL:', entityACL, 'effective roles:', roles, 'effectiveTenantIds:', effectiveTenantIds);
		}

		const filteredRoles = tenantId
			? roles.filter(r => contains(r.tenant, effectiveTenantIds) || r.global)
			: roles;

		const allowed = filteredRoles.find(({ tenant, role }) => atrixACL.ACL.access({
			role,
			userId,
			tenant,
			transition,
			path: linkPath,
			method: linkMethod,
		}));

		if (isNotNil(allowed)) {
			atrixACL.log.debug(
				'Grant transition:', transition,
				'link:', link,
				'of resource:', linkPath,
				'with tenantId:', tenantId,
				'acl:', (entityACL || 'n/a'),
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
