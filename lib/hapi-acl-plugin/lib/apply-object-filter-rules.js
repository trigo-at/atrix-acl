'use strict';

const RouteParser = require('./route-parser');
const {filterResource} = require('./filter-properties');

module.exports = ({req, atrixACL, object, rules, filterOptions}) => {
    const {method} = req;
    let {path} = req;

    path = atrixACL.fixPath(path);
    const rulesToApply = rules.filter(
        rule =>
            (rule.role === '*' ||
                req.auth.effectiveRoles.indexOf(rule.role) >= 0 ||
                (rule.notRole && req.auth.effectiveRoles.indexOf(rule.notRole) === -1)) &&
            (rule.method === '*' || (rule.method && rule.method === method)) &&
            (rule.path === '*' || (rule.path && RouteParser(rule.path).match(path)))
    );

    return filterResource(rulesToApply, object, atrixACL, req, filterOptions);
};
