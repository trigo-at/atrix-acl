'use strict';

const { find, defaultTo, and } = require('ramda');
const RouteParser = require('route-parser');

const methodFilter = (r, method) => (r.method === '*' || r.method === method || r.method.indexOf(method) >= 0);
const pathFilter = (r, matchPath) => RouteParser(r.path).match(matchPath);

module.exports = (req, atrixACL) => {
	const matchPath = atrixACL.getPrefix()
		? req.path.replace(atrixACL.getPrefix(), '')
		: req.path;

	const matchingCfg = find(r => and(methodFilter(r, req.method), pathFilter(r, matchPath)), atrixACL.ACL.rules);
	if (!matchingCfg) return null;
	if (!matchingCfg.entity) {
		req.log.warn('No entity configured', matchPath);
		return null;
	}
	const params = RouteParser(matchingCfg.path).match(matchPath);

	const effectiveEntityAcl = defaultTo(null, find(a => a.entity === matchingCfg.entity && a.id === params[matchingCfg.idParam], atrixACL.ACL.entityACLs));
	if (effectiveEntityAcl) {
		req.log.debug('Resolved entity ACLs', effectiveEntityAcl);
	}
	return effectiveEntityAcl;
};
