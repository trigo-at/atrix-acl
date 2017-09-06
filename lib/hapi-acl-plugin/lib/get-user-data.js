'use strict';

const R = require('ramda');

module.exports = (req, config) => {
	const path = ['auth', 'credentials', 'resource_access'];

	const tenantIds = (req.headers[config.tenantIdsHeaderField] || '').split(',');

	const apps = tenantIds.concat(config.tokenResourceAccessRoleKey);

	let roles = R.pipe(
		R.map(tenant => R.pathOr([''], path.concat([tenant, 'roles']), req).map(role => Object.assign({ tenant, role }))),
		R.flatten,
		R.filter(t => t.role),
		R.uniq)(apps);

	roles = roles.length === 0 ? [{ app: '', role: '' }] : roles;

	return {
		userId: req.headers['x-pathfinder-userid'],
		tenantIds,
		roles,
	};
};
