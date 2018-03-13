'use strict';

const extractObjectKeys = require('./extract-object-keys');
const filterResource = require('./filter-resource');

const ensureResourceArray = res => {
	if (res.items) return res.items;
	if (Array.isArray(res)) return res;
	return [res];
};

const filterResources = (filter, resource, req) => {
	const resources = ensureResourceArray(resource);
	const filteredResources = resources.map(res =>
		filterResource(res, filter, req)
	);
	return filteredResources;
};

module.exports = {
	extractObjectKeys,
	filterResource: filterResources,
	ensureResourceArray,
};
