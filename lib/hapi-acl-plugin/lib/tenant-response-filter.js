'use strict';

const {
	isNil, type, map, pathOr, concat, intersection, or, pipe, isEmpty, not, filter,
} = require('ramda');
const stripUndefined = require('./strip-undefined');


const concatRoles = map(r => (r.global ? r.role : `${r.tenant}:${r.role}`));
const isNotEmpty = pipe(isEmpty, not);
const filterUndefinedArrayElements = filter(x => x !== undefined);

const hasAccess = (obj, tenantIds, roles, atrixACL) => {
	if (isNil(obj) || isNil(obj[atrixACL.config.tenantIdProperty])) return true;

	const userRoles = concatRoles(roles);
	const matchTenants = concat(pathOr([], [atrixACL.config.aclProperty, 'tenantIds'], obj), [obj[atrixACL.config.tenantIdProperty]]);
	const matchRoles = pathOr([], [atrixACL.config.aclProperty, 'roles'], obj);
	return or(
		isNotEmpty(intersection(matchTenants, tenantIds)),
		isNotEmpty(intersection(matchRoles, userRoles)),
	);
};

const tenantResponseFilter = (response, req, atrixACL) => {
	const { roles, tenantIds } = req.auth;

	const filtered = stripUndefined(map((prop) => {
		if (hasAccess(prop, tenantIds, roles, atrixACL)) {
			if (type(prop) === 'Array') {
				return tenantResponseFilter(prop, req, atrixACL);
			} else if (type(prop) === 'Object') {
				return tenantResponseFilter(prop, req, atrixACL);
			}
			return prop;
		}
		return undefined;
	}, response));

	return type(filtered) === 'Array' ?
		filterUndefinedArrayElements(filtered) :
		filtered;
};


module.exports = tenantResponseFilter;
