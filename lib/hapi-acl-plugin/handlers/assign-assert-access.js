'use strict';

const { performance } = require('perf_hooks');
const Boom = require('boom');

module.exports = () => (req, tenantId) => {
	const start = performance.now();
	if (!req.hasAccess(req, tenantId)) {
		throw Boom.forbidden('AtrixACL denied');
	}
	const execTime = performance.now() - start;
	req.log.debug({ execTimeMsec: execTime, handler: 'atrix-acl:assign-assert-access' });
};
