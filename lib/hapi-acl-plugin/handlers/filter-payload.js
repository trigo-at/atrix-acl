'use strict';

// eslint-disable-next-line
const {performance} = require('perf_hooks');
const bypassACLs = require('../lib/bypass-acls');
const applyObjectFilterRules = require('../lib/apply-object-filter-rules');

module.exports = atrixACL => async (request, h) => {
    if (request.payload === null || typeof request.payload !== 'object') {
        return h.continue;
    }

    if (bypassACLs(atrixACL, request)) {
        return h.continue;
    }

    // console.log('%%%%%%%%%%%%%%%%% START PAYLOAD FILTER %%%%%%%%%%%%%%')
    if (atrixACL.ACL.filterPayloadRules.length === 0) {
        return h.continue;
    }
    const start = performance.now();

    const filtered = applyObjectFilterRules({
        req: request,
        atrixACL,
        rules: atrixACL.ACL.filterPayloadRules,
        object: request.payload,
        filterOptions: {filterHatrLinks: false, filterTenantContext: false},
    });
    // console.log('%%%%%%%%%%%%%%%%% END PAYLOAD FILTER %%%%%%%%%%%%%%')

    request.payload = Array.isArray(filtered) ? filtered[0] : filtered;
    const execTime = performance.now() - start;
    request.log.debug({execTimeMsec: execTime, handler: 'atrix-acl:filter-payload'});
    return h.continue;
};
