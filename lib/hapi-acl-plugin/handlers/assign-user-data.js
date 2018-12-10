'use strict';

const {uniq, pick} = require('ramda');

const getUserData = require('../lib/get-user-data');

module.exports = atrixACL => async (request, h) => {
    const {roles, username, userId, tenantIds, entityACLs} = await getUserData(request, atrixACL);

    request.auth = Object.assign(request.auth, {
        effectiveRoles: uniq(roles.map(r => r.role)),
        username,
        userId,
        tenantIds,
        roles,
        entityACLs,
    });
    request.log.debug(
        'Attached ACL auth',
        pick(['roles', 'effectiveRoles', 'tenantIds', 'username', 'userId', 'entityACL'], request.auth)
    );
    return h.continue;
};
