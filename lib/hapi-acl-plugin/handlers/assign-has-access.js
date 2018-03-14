'use strict';

const getUserData = require('../lib/get-user-data');
const {
	pick, merge,
} = require('ramda');

module.exports = atrixACL => (req, tenantId) => {
	if (!req.auth) throw Error('No req.auth context found!');
	const { roles, userId } = getUserData(req, atrixACL);

	const { method } = req;
	const match = req.server.match(method, req.path);
	let { path } = req;
	let route = match.path || req.path;

	path = atrixACL.fixPath(path);
	route = atrixACL.fixPath(route);

	if (atrixACL.endpoints.filter(endpoint => !path.match(new RegExp(endpoint))).length) {
		return true;
	}

	if (!tenantId) {
		atrixACL.log.warn('Calling request.hasAccess() without tenantId!', path);
	}

	const filterTenantId = tenantId === '_all' ? null : tenantId;
	atrixACL.log.warn('No Tenant Id Context', path);

	const filteredRoles = filterTenantId
		? roles.filter(r => r.tenant === filterTenantId || r.global)
		: roles;

	const allowed = filteredRoles.find(({ tenant, role }) => {
		const matching = atrixACL.ACL.access({
			userId, tenant, role, method, route, path,
		});
		if (matching) {
			atrixACL.log.debug(`Grant access to: "${path}" in auth context: ${JSON.stringify(merge(pick(['effectiveRoles', 'tenantIds', 'userId', 'entityACL'], req.auth), { roles: filteredRoles }), null, 2)} due to rule: ${JSON.stringify(matching, null, 2)}`); //eslint-disable-line
		}
		return !!matching;
	});

	return !!allowed;
};
