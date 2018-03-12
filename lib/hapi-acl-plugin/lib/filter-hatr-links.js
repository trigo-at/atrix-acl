'use strict';

const {
	isNil, not, pipe, pick,
} = require('ramda');

const isNotNil = pipe(isNil, not);

module.exports = (atrixACL, req, links, roles, userId, tenantId) => {
	const filteredRoles = tenantId
		? roles.filter(r => r.tenant === tenantId || r.global)
		: roles;

	return Object.keys(links).reduce((ret, transition) => {
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
				'in context:', pick(['roles', 'tenantIds'], req.auth),
				'due to rule:', allowed,
			);
		}
			ret[transition] = isNotNil(allowed) ? link : false; //eslint-disable-line
		return ret;
	}, {});
};
