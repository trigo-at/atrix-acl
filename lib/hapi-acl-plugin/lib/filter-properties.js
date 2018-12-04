'use strict';

const filterResource = require('./filter-resource');

const ensureResourceArray = res => {
    if (res.items) return res.items;
    if (Array.isArray(res)) return res;
    return [res];
};

const filterResources = (filters, resource, atrixACL, req, filterOptions) =>
    filterResource(ensureResourceArray(resource), filters, atrixACL, req, filterOptions);

module.exports = {
    filterResource: filterResources,
    ensureResourceArray,
};
