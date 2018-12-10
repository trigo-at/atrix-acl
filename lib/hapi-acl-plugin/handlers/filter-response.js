'use strict';

// eslint-disable-next-line
const {performance} = require('perf_hooks');
const bypassACLs = require('../lib/bypass-acls');
const applyObjectFilterRules = require('../lib/apply-object-filter-rules');

module.exports = atrixACL => async (request, h) => {
    // https://hapijs.com/api/16.6.2#response-object
    // variety can be plain, buffer, stream or promise, currently we can only handle plain
    // but we should resolve promises in the future
    if (typeof request.response !== 'object' || !request.response.source || request.response.variety !== 'plain') {
        return h.continue;
    }

    if (bypassACLs(atrixACL, request)) {
        return h.continue;
    }

    // console.log('%%%%%%%%%%%%%%%%% START RESPONSE FILTER %%%%%%%%%%%%%%')
    const start2 = performance.now();
    const filtered = applyObjectFilterRules({
        req: request,
        atrixACL,
        rules: atrixACL.ACL.filterRules,
        object: request.response.source,
        filterOptions: {filterHatrLinks: true, filterTenantContext: atrixACL.config.acl.enableNestedDocumentAcl},
    });
    // console.log('%%%%%%%%%%%%%%%%% END RESPONSE FILTER %%%%%%%%%%%%%%')

    if (Array.isArray(request.response.source)) {
        request.response.source = filtered;
    } else if (Array.isArray(request.response.source.items)) {
        request.response.source.items = filtered;
    } else {
        request.response.source = Array.isArray(filtered) ? filtered[0] : filtered;
    }
    const execTime2 = performance.now() - start2;
    request.log.debug({execTimeMsec: execTime2, handler: 'atrix-acl:filter-response'});

    return h.continue;
};
