'use strict';

const {lensPath, view, forEachObjIndexed, forEach} = require('ramda');
const filterHatrLinks = require('../lib/filter-hatr-links');

const getUserData = require('../lib/get-user-data');
const bypassACLs = require('../lib/bypass-acls');

const filterLinksRecursive = (atrixACL, req, item, roles, userId, tenantId) => {
    if (!item) return;

    const linksPath = item._source ? ['_source', '_links'] : ['_links'];
    const links = view(lensPath(linksPath), item);
    if (!links) return;

    const tenantIdPath = item._source ? ['_source', 'tenantId'] : ['tenantId'];
    const localTenantId = view(lensPath(tenantIdPath), item);
    let thisItemsTenantId = localTenantId || tenantId;
    if (thisItemsTenantId === '_all') {
        thisItemsTenantId = null;
    }

    const filteredLinks = filterHatrLinks(atrixACL, req, links, roles, userId, thisItemsTenantId);

    if (item._source) {
        item._source._links = filteredLinks; //eslint-disable-line
    } else {
        item._links = filteredLinks; //eslint-disable-line
    }

    const embeddedPath = item._source ? ['_source', '_embedded'] : ['_embedded'];
    const embedded = view(lensPath(embeddedPath), item);
    if (embedded) {
        forEachObjIndexed(value => {
            if (Array.isArray(value)) {
                forEach(i => filterLinksRecursive(atrixACL, req, i, roles, userId, thisItemsTenantId), value);
            }
            filterLinksRecursive(atrixACL, req, value, roles, userId, thisItemsTenantId);
        }, embedded);
    }
};

module.exports = atrixACL => async (request, h) => {
    if (typeof request.response !== 'object' || !request.response.source) {
        return h.continue;
    }

    if (bypassACLs(atrixACL, request)) {
        return h.continue;
    }

    const {roles, userId} = getUserData(request, atrixACL);

    const start = new Date();
    const resources = (() => {
        if (request.response.source.items) {
            return request.response.source.items;
        }
        if (Array.isArray(request.response.source)) {
            return request.response.source;
        }

        return [request.response.source];
    })();

    resources.forEach(item => {
        filterLinksRecursive(atrixACL, request, item, roles, userId);
    });

    const end = new Date();
    request.log.debug(`Filter Hatr Links took: ${end.getTime() - start.getTime()}ms`);
    return h.continue;
};
