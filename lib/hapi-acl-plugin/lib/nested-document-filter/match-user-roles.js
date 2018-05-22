'use strict';

const {
	intersection, isEmpty, not, pipe, map, uniq, concat, append,
} = require('ramda');

const isNotEmpty = pipe(isEmpty, not);

const concatRoles = map(r => (r.global ? `__GLOBAL__:${r.role}` : `${r.tenant}:${r.role}`));
const extractUserTenants = pipe(map(r => r.tenant), uniq);
const extractUserRoles = pipe(map(r => r.role), uniq);
const extractAclGlobalRoles = pipe(map((r) => {
	const sp = r.split(':');
	return sp.length === 2 ? `__GLOBAL__:${sp[1]}` : `__GLOBAL__:${sp[0]}`;
}), uniq);

module.exports = (userRoles, aclRoles) => {
	if (!userRoles || !Array.isArray(userRoles)) throw new Error('mandatory argument "userRoles" missing or not an array');
	if (!aclRoles || !Array.isArray(aclRoles)) throw new Error('mandatory argument "aclRoles" missing or not an array');

	const matchRoles = pipe(
		// teanant roles "<tenant>:<role>"
		concatRoles,
		// role wildcards "<tenant>:*"
		concat(pipe(
			extractUserTenants,
			map(tenant => `${tenant}:*`),
		)(userRoles)),
		// tenant wildcards "*:<role>"
		concat(pipe(
			extractUserRoles,
			map(role => `*:${role}`),
		)(userRoles)),
		// match all wildcard
		append('*:*'),
		append('__GLOBAL__:*'),
	)(userRoles);

	const matchAclRoles = pipe(
		extractAclGlobalRoles,
		concat(aclRoles),
	)(aclRoles);

	// console.log(matchAclRoles, matchRoles);

	return isNotEmpty(intersection(matchRoles, matchAclRoles));
};
