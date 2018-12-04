'use strict';

const Boom = require('boom');

module.exports = async (req, reply, service) => {
    req.assertAccess(req, req.query.tenantId);
    reply().code(204);
};
