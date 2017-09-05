'use strict';

const R = require('ramda');

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


		for (const sub of subPath) {
			let obj = R.path(path.concat(sub), res);
			if (Array.isArray(obj)) {
				obj = obj.filter(entry => !filter.when(res, entry));
			} else if (typeof obj === 'object') {
				obj = filter.when(res, obj) ? filter.value : obj;
			} else {
				obj = filter.when(res, obj) ? filter.value : obj;
			}
			ret = R.set(R.lensPath(path.concat(sub)), obj, ret);
		}

		return ret;
	});
	return filteredResources;
};


module.exports = {
	filterResource,
	ensureResourceArray,
};
