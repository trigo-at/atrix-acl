'use strict';

const Boom = require('boom');

module.exports = async (req, reply, service) => {
	if (!req.hasAccess(req, req.query.tenantId)) {
		throw Boom.forbidden('AtrixACL denied');
	}

	reply().code(204);
};
