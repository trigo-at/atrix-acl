'use strict';

const R = require('ramda');

module.exports = (req, config) => {
	const path = ['auth', 'credentials', 'resource_access'];

	const tenantIds = (req.headers[config.tenantIdsHeaderField] || '').split(',');

	const apps = tenantIds.concat(config.tokenResourceAccessRoleKey);

	let roles = R.pipe(
		R.map(role => R.pathOr([''], path.concat([role, 'roles']), req)),
		R.flatten,
		R.filter(t => t))(apps);

	roles = roles.length === 0 ? [''] : roles;

	return {
		userId: req.headers['x-pathfinder-userid'],
		tenantIds,
		roles,
	};
};
