'use strict';

const filterResource = require('./filter-resource');

const ensureResourceArray = (res) => {
	if (res.items) return res.items;
	if (Array.isArray(res)) return res;
	return [res];
};

const filterResources = (filters, resource, atrixACL, req) => filterResource(ensureResourceArray(resource), filters, true, atrixACL, req);

module.exports = {
	filterResource: filterResources,
	ensureResourceArray,
};
