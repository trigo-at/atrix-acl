'use strict';

const { find, defaultTo, and } = require('ramda');
const RouteParser = require('./route-parser');

const methodFilter = (r, method) => (r.method === '*' || r.method === method || r.method.indexOf(method) >= 0);
const pathFilter = (r, matchPath) => RouteParser(r.path).match(matchPath);

const fixPath = (prefix, path) => {
	if (!prefix) return path;
	const regExpStr = `^${prefix}`;
	const regExp = new RegExp(regExpStr);
	return path.replace(regExp, '');
};

module.exports = ({
	path, method, log, atrixACL,
}) => {
	const matchPath = fixPath(atrixACL.getPrefix(), path);

	const matchingCfg = find(r => and(methodFilter(r, method), pathFilter(r, matchPath)), atrixACL.ACL.rules.filter(r => r.path));
	if (!matchingCfg) return null;
	if (!matchingCfg.entity) {
		log.warn('No entity configured', matchPath);
		return null;
	}
	const params = RouteParser(matchingCfg.path).match(matchPath);

	const effectiveEntityAcl = defaultTo(null, find(a => a.entity === matchingCfg.entity && a.id === params[matchingCfg.idParam], atrixACL.ACL.entityACLs));
	if (effectiveEntityAcl) {
		log.debug('Resolved entity ACLs', effectiveEntityAcl);
	}
	return effectiveEntityAcl;
};
