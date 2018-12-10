'use strict';

const {performance} = require('perf_hooks');
const Boom = require('boom');
const {pick} = require('ramda');

const getUserData = require('../lib/get-user-data');
const bypassACLs = require('../lib/bypass-acls');

module.exports = atrixACL => (request, h) => {
    if (bypassACLs(atrixACL, request)) {
        return h.continue;
    }

    const start = performance.now();
    const {roles, userId} = getUserData(request, atrixACL);

    const {method} = request;
    const match = request.server.match(method, request.path);
    let {path} = request;
    let route = match.path || request.path;

    path = atrixACL.fixPath(path);
    route = atrixACL.fixPath(route);

    if (atrixACL.endpoints.filter(endpoint => !path.match(new RegExp(endpoint))).length) {
        const execTime = performance.now() - start;
        request.log.debug({execTimeMsec: execTime, handler: 'atrix-acl:guard-requests'});
        return h.continue;
    }

    const allowed = roles.find(({tenant, role}) => {
        const matching = atrixACL.ACL.access({
            userId,
            tenant,
            role,
            method,
            route,
            path,
        });
        if (matching) {
            atrixACL.log.debug(
                `Grant access to: "${path}" in auth context: ${JSON.stringify(
                    pick(['roles', 'effectiveRoles', 'tenantIds', 'userId', 'entityACL'], request.auth),
                    null,
                    2
                )} due to rule: ${JSON.stringify(matching, null, 2)}`
            ); //eslint-disable-line
        }
        return !!matching;
    });

    const execTime = performance.now() - start;
    request.log.debug({execTimeMsec: execTime, handler: 'atrix-acl:guard-requests'});

    if (allowed) {
        return h.continue;
    }

    throw Boom.unauthorized('AtrixACL denied');
};
