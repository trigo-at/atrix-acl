'use strict';

const {uniq, pipe, map, defaultTo, split, ifElse, propEq} = require('ramda');

const defaultToEmptyArray = defaultTo([]);
const splitColon = split(':');

module.exports = ({atrixACL, roles, source}) => {
    const buildTenantRole = arr => ({tenant: arr[0], role: arr[1], global: false, source});

    const buildGlobalRole = arr => ({
        tenant: atrixACL.config.acl.tokenResourceAccessRoleKey,
        role: arr[0],
        global: true,
        source,
    });
    const buildRole = ifElse(propEq('length', 2), buildTenantRole, buildGlobalRole);
    return pipe(
        map(splitColon),
        map(buildRole),
        uniq
    )(defaultToEmptyArray(roles));
};
