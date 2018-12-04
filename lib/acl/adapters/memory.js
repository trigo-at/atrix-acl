'use strict';

const RouteParser = require('../../hapi-acl-plugin/lib/route-parser');

let aclRules = [];

const roleFilter = (rule, role) => (rule.role && rule.role === '*') || (rule.role && role && rule.role === role);
const userIdFilter = (rule, userId) => rule.userId && userId && rule.userId === userId;
const transitionFilter = (rule, transition) =>
    rule.transition &&
    transition &&
    RouteParser(rule.transition.replace(/:/g, '/')).match(transition.replace(/:/g, '/'));

const pathFilter = (rule, path) => rule.path && path && RouteParser(rule.path).match(path);
const tenantFilter = (rule, tenant) => rule.tenant && (rule.tenant === '*' || rule.tenant === tenant);

module.exports = {
    access: ({role, path, method, userId, tenant, transition}) =>
        aclRules.find(
            r =>
                (roleFilter(r, role) || userIdFilter(r, userId)) &&
                tenantFilter(r, tenant) &&
                (r.method === '*' || r.method === method || r.method.indexOf(method) >= 0) &&
                (pathFilter(r, path) || transitionFilter(r, transition))
        ),

    setRules: rules => {
        aclRules = rules;
    },

    getRules: () => aclRules,

    addRule: rule => aclRules.push(rule),
};
