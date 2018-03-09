'use strict';

const Boom = require('boom');

module.exports = () => (req, tenantId) => {
	if (!req.hasAccess(req, tenantId)) {
		throw Boom.forbidden('AtrixACL denied');
	}
};
