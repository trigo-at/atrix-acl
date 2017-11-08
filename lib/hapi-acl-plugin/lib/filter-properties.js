'use strict';

const extractObjectKeys = require('./extract-object-keys');
const filterResource = require('./filter-resource');

// recursively extract all keys of nested objects in obj
// Output Example:
// ```
// [
// 	'_embedded',
// 	'_embedded.toys',
// 	'_embedded.toys.0',
// 	'_embedded.toys.1'
// 	'_embedded.food'
// ]
// ```

const ensureResourceArray = (res) => {
	if (res.items) return res.items;
	if (Array.isArray(res)) return res;
	return [res];
};

const filterResources = (filter, resource, req) => {
	const resources = ensureResourceArray(resource);
	const filteredResources = resources.map(res => filterResource(res, filter, req));
	return filteredResources;
};


module.exports = {
	extractObjectKeys,
	filterResource: filterResources,
	ensureResourceArray,
};
