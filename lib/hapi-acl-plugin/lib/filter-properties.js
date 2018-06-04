'use strict';

const filterResource = require('./filter-resource');

const ensureResourceArray = (res) => {
	if (res.items) return res.items;
	if (Array.isArray(res)) return res;
	return [res];
};

const filterResources = (filter, resource, atrixACL, req) => {
	const resources = ensureResourceArray(resource);
	const filteredResources = resources.map(res => filterResource(res, filter, true, atrixACL, req));
	return filteredResources;
};


module.exports = {
	filterResource: filterResources,
	ensureResourceArray,
};
