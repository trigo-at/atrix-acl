'use strict';

const { find, filter } = require('ramda');
const RouteParser = require('route-parser');

const entityCfg = [{
	serivce: 's1.svc',
	entity: 'event',
	route: '/events/:id(/_*)',
	idParam: 'id',
}, {
	serivce: 's1.svc',
	entity: 'event',
	route: '/events/:id/budget/:bid(/_*)',
	idParam: 'id',
}];


const acls = [{
	entity: 'event',
	id: '42',
	acl: {
		tenantId: 'gpa',
	}
}, {
	entity: 'event',
	id: '43',
	acl: {
		tenantId: 'vida',
	}
}];


module.exports = (req, atrixACL) => {
	console.log(atrixACL.service.name);
	console.log(atrixACL.service.config.config.endpoints.http.prefix);
	const matchPath = atrixACL.service.config.config.endpoints.http.prefix
		? req.path.replace(atrixACL.service.config.config.endpoints.http.prefix, '')
		: req.path;

	console.log(matchPath);

	const matchingCfg = find(r => RouteParser(r.route).match(matchPath), entityCfg);
	if (!matchingCfg) return null;
	console.log(matchingCfg);
	const params = RouteParser(matchingCfg.route).match(matchPath);
	console.log(params);

	const effectiveEntityAcls = filter(a => a.entity === matchingCfg.entity && a.id === params[matchingCfg.idParam], acls);
	if (effectiveEntityAcls.length) {
		req.log.debug(`Resolved entity ACLs`, effectiveEntityAcls);
	}
	return effectiveEntityAcls;
}
