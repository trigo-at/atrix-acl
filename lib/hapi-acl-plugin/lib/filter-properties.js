'use strict';

const R = require('ramda');


const extractObjectKeys = (obj, parents) => {
	const keys = Object.keys(obj)
		.filter(k => typeof obj[k] === 'object')
		.map(k => [k, parents ? `${parents}.${k}` : k]) //eslint-disable-line
		.map(k => [k[1], extractObjectKeys(obj[k[0]], k[1])]);

	return R.flatten(keys);
};

const ensureResourceArray = (res) => {
	if (res.items) return res.items;
	if (Array.isArray(res)) return res;
	return [res];
};

const filterResource = (filter, resource) => {
	const resources = ensureResourceArray(resource);
	const filteredResources = resources.map((res) => {
		let ret = res;
		const path = filter.key.split('.');

		let subPath;
		if (path.slice(-1)[0] === '*') {
			path.pop();
			subPath = Object.keys(R.path(path, res));
		} else {
			subPath = [path.pop()];
		}

		if (path[0] === '*') {
			path.shift();
			subPath = subPath.concat(extractObjectKeys(R.path(path, res))
				.map(k => `${k}.${subPath}`))
				.filter(k => R.path(path.concat(k.split('.')), res));
		}

		for (const sub of subPath) {
			let obj = R.path(path.concat(sub.split('.')), res);
			if (Array.isArray(obj)) {
				obj = obj.filter(entry => !filter.when(res, entry));
			} else if (typeof obj === 'object') {
				obj = filter.when(res, obj) ? filter.value : obj;
			} else {
				obj = filter.when(res, obj) ? filter.value : obj;
			}
			if (R.view(R.lensPath(path.concat(sub.split('.'))))) {
				ret = R.set(R.lensPath(path.concat(sub.split('.'))), obj, ret);
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
