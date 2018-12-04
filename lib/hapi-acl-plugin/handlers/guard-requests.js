'use strict';

const {performance} = require('perf_hooks');
const Boom = require('boom');
const {pick} = require('ramda');

const getUserData = require('../lib/get-user-data');
const bypassACLs = require('../lib/bypass-acls');

module.exports = atrixACL => (req, next) => {
    if (bypassACLs(atrixACL, req)) {
        return next.continue();
    }

    const start = performance.now();
    const {roles, userId} = getUserData(req, atrixACL);

    const {method} = req;
    const match = req.server.match(method, req.path);
    let {path} = req;
    let route = match.path || req.path;

    path = atrixACL.fixPath(path);
    route = atrixACL.fixPath(route);

    if (atrixACL.endpoints.filter(endpoint => !path.match(new RegExp(endpoint))).length) {
        const execTime = performance.now() - start;
        req.log.debug({execTimeMsec: execTime, handler: 'atrix-acl:guard-requests'});
        return next.continue();
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
                    pick(['roles', 'effectiveRoles', 'tenantIds', 'userId', 'entityACL'], req.auth),
                    null,
                    2
                )} due to rule: ${JSON.stringify(matching, null, 2)}`
            ); //eslint-disable-line
        }
        return !!matching;
    });

    const execTime = performance.now() - start;
    req.log.debug({execTimeMsec: execTime, handler: 'atrix-acl:guard-requests'});

    if (allowed) {
        return next.continue();
    }

    return next(Boom.unauthorized('AtrixACL denied'));
};
