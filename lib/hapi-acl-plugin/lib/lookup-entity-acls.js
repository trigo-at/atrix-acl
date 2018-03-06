'use strict';

const { find, defaultTo } = require('ramda');
const RouteParser = require('route-parser');

module.exports = (req, atrixACL) => {
	const matchPath = atrixACL.getPrefix()
		? req.path.replace(atrixACL.getPrefix(), '')
		: req.path;


	const matchingCfg = find(r => RouteParser(r.route).match(matchPath), atrixACL.ACL.entityACLsDefinition);
	if (!matchingCfg) return null;
	const params = RouteParser(matchingCfg.route).match(matchPath);

	const effectiveEntityAcl = defaultTo(null, find(a => a.entity === matchingCfg.entity && a.id === params[matchingCfg.idParam], atrixACL.ACL.entityACLs));
	if (effectiveEntityAcl) {
		req.log.debug('Resolved entity ACLs', effectiveEntityAcl);
	}
	return effectiveEntityAcl;
};
