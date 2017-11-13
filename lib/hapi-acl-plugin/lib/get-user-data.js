'use strict';

const { uniq, pathOr } = require('ramda');

module.exports = (req, config) => {
	const path = ['auth', 'credentials', 'resource_access', config.tokenResourceAccessRoleKey, 'roles'];

	const tenantIds = (req.headers[config.tenantIdsHeaderField] || '').split(',');

	const rawRoles = pathOr([''], path, req);
	const apps = tenantIds.concat(config.tokenResourceAccessRoleKey);

	let roles = uniq(rawRoles.map((r) => {
		const parts = r.split(':');
		if (parts.length === 1) return 	{ tenant: config.tokenResourceAccessRoleKey, role: r };
		return apps.indexOf(parts[0]) !== -1 ? { tenant: parts[0], role: parts[1] } : undefined;
	}).filter(r => !!r));

	roles = roles.length === 0 ? [{ app: '', role: '' }] : roles;

	return {
		userId: pathOr(null, ['auth', 'credentials', 'userId'], req),
		tenantIds,
		roles,
	};
};
