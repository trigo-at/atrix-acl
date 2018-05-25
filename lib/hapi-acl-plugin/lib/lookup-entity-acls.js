'use strict';

const {
	find, defaultTo, and, filter,
} = require('ramda');
const RouteParser = require('./route-parser');

const methodFilter = (r, method) => (r.method === '*' || r.method === method || r.method.indexOf(method) >= 0);
const pathFilter = (r, matchPath) => RouteParser(r.path).match(matchPath);

module.exports = ({
	path, method, log, atrixACL,
}) => {
	const matchPath = atrixACL.fixPath(path);

	const matchingCfg = find(r => and(methodFilter(r, method), pathFilter(r, matchPath)), atrixACL.ACL.rules.filter(r => r.path));
	if (!matchingCfg) return [];
	if (!matchingCfg.entity) {
		log.warn('No entity configured', matchPath);
		return [];
	}
	const params = RouteParser(matchingCfg.path).match(matchPath);

	const effectiveEntityAcl = defaultTo([], filter(a => a.entity === matchingCfg.entity && a.id === params[matchingCfg.idParam], atrixACL.ACL.entityACLs));
	if (effectiveEntityAcl) {
		log.debug('Resolved entity ACLs', effectiveEntityAcl);
	}
	return effectiveEntityAcl;
};
