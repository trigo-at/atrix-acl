'use strict';

const {uniq, pathOr, pipe, concat, filter, intersection, contains} = require('ramda');

const lookupEntityACLs = require('./lookup-entity-acls');
const parseEntityACLs = require('./parse-entity-acls');
const buildRolesDefinitionArrayFromRoles = require('./build-roles-definition-array-from-roles');
const buildTenantIdsFromRoles = require('./build-tenant-ids-from-roles');

module.exports = (req, atrixACL) => {
    const path = ['auth', 'credentials', 'resource_access', atrixACL.config.acl.tokenResourceAccessRoleKey, 'roles'];

    const rawRoles = pathOr([''], path, req);
    const headerDefinedTenants = (req.headers[atrixACL.config.acl.tenantIdsHeaderField] || '').split(',');
    const tokenDefinedTenants = buildTenantIdsFromRoles(rawRoles);
    const effectiveTenants = intersection(tokenDefinedTenants, headerDefinedTenants);

    let roles = buildRolesDefinitionArrayFromRoles({atrixACL, roles: rawRoles, source: 'token'});
    roles = filter(r => r.global || contains(r.tenant, effectiveTenants), roles);
    roles = roles.length === 0 ? [{app: '', role: ''}] : roles;

    const entityACLs = lookupEntityACLs({
        path: req.path,
        method: req.method,
        log: req.log,
        atrixACL,
    });
    const parsedACLs = parseEntityACLs(atrixACL, entityACLs, rawRoles);

    const allRoles = pipe(
        // append roles created for entity acls
        concat(parsedACLs.roles),
        uniq
    )(roles);

    const allTenantIds = pipe(
        // append tenantIds that are applied by entity ACL definition
        concat(parsedACLs.tenantIds),
        uniq
    )(effectiveTenants);

    return {
        userId: pathOr(null, ['auth', 'credentials', atrixACL.config.acl.tokenUsernIdKey], req),
        username: pathOr(null, ['auth', 'credentials', atrixACL.config.acl.tokenUsernameKey], req),
        tenantIds: allTenantIds,
        roles: allRoles,
        entityACLs,
    };
};
