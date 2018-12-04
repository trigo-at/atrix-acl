'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const svc = require('./service');
const tmpObj = require('./tmp-obj');

describe('AtrixACL', () => {
    let atrixACL;

    before(async () => {
        await svc.start();
        atrixACL = svc.service.plugins.acl;
    });
    after(async () => {
        await svc.stop();
    });

    beforeEach(async () => {
        atrixACL.setRules([]);
        atrixACL.setFilterRules([]);
        atrixACL.setPayloadFilterRules([]);
        tmpObj.obj = undefined;
    });

    describe('ACLs', () => {
        require('./includes/entity-acls.spec-inc'); //eslint-disable-line
        require('./includes/user-data.spec-inc'); //eslint-disable-line
        require('./includes/inject.spec-inc'); //eslint-disable-line
        require('./includes/filter-endpoints.spec-inc'); //eslint-disable-line
        require('./includes/filter-fsm-transition-links.spec-inc'); //eslint-disable-line
        require('./includes/user-id-based-rules.spec-inc'); //eslint-disable-line
        require('./includes/tenantId-aware-role-evaluation.spec-inc'); //eslint-disable-line
        require('./includes/has-access.spec-inc'); //eslint-disable-line
        require('./includes/assert-access.spec-inc'); //eslint-disable-line
    });

    require('./includes/response-filters.spec-inc'); //eslint-disable-line
    require('./includes/payload-filters.spec-inc'); //eslint-disable-line
    // require('./includes/payload-filters-perf.spec-inc'); //eslint-disable-line
});
