'use strict';

/* eslint no-underscore-dangle:0, no-prototype-builtins:0, max-len:0, dot-notation:0, no-restricted-syntax:0, no-labels:0, no-continue:0, no-restricted-globals:0, no-param-reassign:0 */

// eslint-disable-next-line
const {performance} = require('perf_hooks');
const {clone, intersection} = require('ramda');

const debug = require('util').debuglog('atrix-acl-filter-resource');
const getUserData = require('./get-user-data');
const filterHatrLinks = require('./filter-hatr-links');
const shouldFilterPath = require('./should-filter-path');

/**
 * Returns the current property path e.g `foo.bar.0` for `{ foo: { bar: ['first'] } }`
 * @return {string} path
 */
function constructPath(currentPath, attribute) {
    /* eslint-disable-next-line */
    return currentPath.length > 0
        ? [currentPath, attribute].join('.')
        : Number.isNaN(Number.parseInt(attribute, 10))
        ? attribute
        : '';
}

function getPathIgnoringArrays(path) {
    return path
        .split('.')
        .filter(p => isNaN(parseInt(p, 10)))
        .join('.');
}

function resolveFilters(filters) {
    if (!filters || filters.length === 0) return [];
    const ret = [];
    filters = Array.isArray(filters) ? filters : [filters];
    const filtersLength = filters.length;
    for (let i = 0; i < filtersLength; i++) {
        const filter = filters[i];
        const key = filter.key || filter.keys;
        const keys = Array.isArray(key) ? key : [key];

        const keyLength = keys.length;
        for (let j = 0; j < keyLength; j++) {
            ret.push({key: keys[j], when: filter.when, value: filter.value});
        }
    }
    return ret;
}

function tenantContextFilter({path, value, contextTenantId, req, atrixACL}) {
    if (!value || Object.prototype.toString.call(value) !== '[object Object]') return false;

    debug('   tenantContextFilter: path:', path, 'value:', JSON.stringify(value), 'contextTenantId:', contextTenantId);
    // no tenantId property
    if (!value[atrixACL.config.acl.tenantIdProperty]) return false;

    // match "_all" && req.auth.tenantIds
    if (
        value[atrixACL.config.acl.tenantIdProperty] === atrixACL.config.acl.matchAllTenantId ||
        req.auth.tenantIds.includes(value[atrixACL.config.acl.tenantIdProperty])
    )
        return false;

    // match "_acl.tenantIds"
    if (
        value[atrixACL.config.acl.aclProperty] &&
        intersection(value[atrixACL.config.acl.aclProperty].tenantIds && req.auth.tenantIds).length > 0
    )
        return false;

    return true;
}

function setNodeAttributeValue(node, attr, value, attrPath, isArrayNode) {
    debug('  OLD NODE:', JSON.stringify(node));
    if (value === undefined) {
        debug('  -> DELETE PATH:', attrPath);
        if (isArrayNode) {
            debug('  -> REMOVE ARRAY INDEX:', attr);
            node.splice(attr, 1);
        } else {
            debug('  -> REMOVE PROPERTY:', attr);
            delete node[attr];
        }
    } else {
        debug('  -> SET PATH:', attrPath, value);
        node[attr] = clone(value);
    }
    debug('  NEW NODE:', JSON.stringify(node));
}

function filterNode(level, root, node, path, whenClosure, filterHatr, contextTenantId, filters, options) {
    if (node === undefined || node === null || Object.keys(node).length === 0) return;
    debug(
        'filterNode:',
        level,
        root,
        /* node, */ path || '<ROOT>',
        /* whenClosure, filterHatr, */ contextTenantId,
        filters,
        options
    );
    const isTopLevelArray = level === 0 && Array.isArray(node);

    const isArrayNode = Array.isArray(node);
    let relevantChildNodes = Object.keys(node);

    contextTenantId = node.tenantId ? node.tenantId : contextTenantId;
    if (contextTenantId === '_all') contextTenantId = null;
    if (node._links) {
        node._links = filterHatr(node._links, contextTenantId);
    }

    let currIndex = 0;
    outerWhile: while (relevantChildNodes.length > currIndex) {
        const attr = relevantChildNodes[currIndex];
        const attrPath = constructPath(path, attr);
        const matchPath = getPathIgnoringArrays(attrPath);
        // debug('attrPath', attrPath, ' match path: ', matchPath);

        const filtersLength = filters.length;
        const filtersToApply = [];
        for (let i = 0; i < filtersLength; i++) {
            const filter = filters[i];
            if (shouldFilterPath(matchPath, filter.key, isArrayNode)) {
                filtersToApply.push(filter);
            }
        }

        const filtersToApplyLength = filtersToApply.length;
        for (let i = 0; i < filtersToApplyLength; i++) {
            const filter = filtersToApply[i];
            const whenResult = whenClosure(filter, attrPath, node[attr], root, contextTenantId);
            debug('WHEN returned: ', filter.when, whenResult, filter.value);
            if (whenResult) {
                setNodeAttributeValue(node, attr, filter.value, attrPath, isArrayNode);
                relevantChildNodes.splice(relevantChildNodes.indexOf(attr), 1);
                if (Array.isArray(node)) {
                    const newKeys = [];
                    for (let ki = 0; ki < node.length; ki++) {
                        newKeys.push(ki.toString());
                    }
                    relevantChildNodes = newKeys;
                }
                debug('  NEW RELEVANT CHILD NODES', relevantChildNodes);
                continue outerWhile;
            }
        }

        currIndex++;
    }

    const childNodesToTraverse = relevantChildNodes.filter(n => typeof node[n] === 'object');
    const childNodesToTraverseLength = childNodesToTraverse.length;
    for (let i = 0; i < childNodesToTraverseLength; i++) {
        const attr = childNodesToTraverse[i];
        const nextNode = node[attr];
        const nextRoot = isTopLevelArray ? root[attr] : root;
        const nextPath = constructPath(path, attr);
        debug('  next -> ', attr, nextNode, path);
        filterNode(level + 1, nextRoot, nextNode, nextPath, whenClosure, filterHatr, contextTenantId, filters, options);
    }
}

module.exports = (obj, filters, atrixACL, req, options) => {
    options = Object.assign({}, {filterHatrLinks: true, filterTenantContext: false}, options);
    filters = resolveFilters(filters);
    if (options.filterTenantContext) {
        filters.splice(0, 0, {
            key: '*',
            value: undefined,
            when: tenantContextFilter,
        });
    }

    const whenClosure = (filter, path, value, root, contextTenantId) =>
        filter.when ? filter.when({path, root, obj: value, value, filter, req, contextTenantId, atrixACL}) : true;

    let filterHatrClosure;
    if (options.filterHatrLinks) {
        const {roles, userId} = getUserData(req, atrixACL);
        filterHatrClosure = (curObj, contextTenantId) =>
            filterHatrLinks(atrixACL, req, curObj, roles, userId, contextTenantId);
    } else {
        filterHatrClosure = () => {};
    }

    filterNode(0, obj, obj, '', whenClosure, filterHatrClosure, null, filters, options);

    return obj;
};
