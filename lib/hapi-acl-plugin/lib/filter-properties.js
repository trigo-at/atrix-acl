'use strict';

const R = require('ramda');


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

const extractObjectKeys = (obj, parents) => {
	const keys = Object.keys(obj)
		.filter(k => typeof obj[k] === 'object' && obj[k] !== null)
		.map(k => [k, parents ? `${parents}.${k}` : k]) //eslint-disable-line
		.map(k => [k[1], extractObjectKeys(obj[k[0]], k[1])]);

	return R.flatten(keys);
};

const ensureResourceArray = (res) => {
	if (res.items) return res.items;
	if (Array.isArray(res)) return res;
	return [res];
};

const filterResource = (filter, resource, req) => {
	const resources = ensureResourceArray(resource);
	const filteredResources = resources.map((res) => {
		let ret = res;
		const path = filter.key.split('.');

		let subPath;
		if (path.slice(-1)[0] === '*') {
			// wildcard match: get all keys of object
			path.pop();
			subPath = Object.keys(R.path(path, res));
		} else {
			// direct path
			subPath = [path.pop()];
		}

		if (path[0] === '*') {
			// get all keys of objects inside resource recursively
			path.shift();
			subPath = subPath.concat(extractObjectKeys(R.path(path, res))
				.map(k => `${k}.${subPath}`))
				.filter(k => R.path(path.concat(k.split('.')), res));
		}

		for (const sub of subPath) {
			// split subPath-entry into array, replace number-string to integers (Ramda.lensPath needs integers for array index)
			let subP = sub.split('.').map(s => isNaN(s) ? s : parseInt(s)); //eslint-disable-line
			// get element at subpath location
			let obj = R.path(path.concat(subP), res);
			if (Array.isArray(obj)) {
				obj = obj.filter(entry => !filter.when || !filter.when(res, entry, req));
			} else if (typeof obj === 'object') {
				obj = !filter.when || filter.when(res, obj, req) ? filter.value : obj;
			} else {
				obj = !filter.when || filter.when(res, obj, req) ? filter.value : obj;
			}
			if (R.view(R.lensPath(path.concat(subP)))) {
				// set filtered object at path (lensPath supports arrays via index)
				ret = R.set(R.lensPath(path.concat(subP)), obj, ret);
			}
		}

		return ret;
	});
	return filteredResources;
};


module.exports = {
	extractObjectKeys,
	filterResource,
	ensureResourceArray,
};
