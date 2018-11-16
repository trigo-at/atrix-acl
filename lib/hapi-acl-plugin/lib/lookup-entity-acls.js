'use strict';

const RouteParser = require('./route-parser');

const methodFilter = (r, method) => (r.method === '*' || r.method === method || r.method.indexOf(method) >= 0);
const pathFilter = (r, matchPath) => RouteParser(r.path).match(matchPath);

module.exports = ({
	path, method, log, atrixACL,
}) => {
	const matchPath = atrixACL.fixPath(path);

	const matchingCfg = atrixACL.ACL.rules.find(r =>
		(r.path) &&
		(methodFilter(r, method)) &&
		(pathFilter(r, matchPath)));
	if (!matchingCfg) return [];
	if (!matchingCfg.entity) {
		log.debug('No entity configured', matchPath);
		return [];
	}
	const params = RouteParser(matchingCfg.path).match(matchPath);

	const effectiveEntityAcls = atrixACL.ACL.entityACLs.filter(a =>
		a.entity === matchingCfg.entity && a.id === params[matchingCfg.idParam]);

	if (effectiveEntityAcls) {
		log.debug('Resolved entity ACLs', effectiveEntityAcls);
	}
	return effectiveEntityAcls;
};
