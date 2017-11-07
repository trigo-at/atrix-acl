'use strict';

const { lensPath, view, set, clone, startsWith } = require('ramda');
const extractObjectKeys = require('./extract-object-keys');
const shouldFilterPath = require('./should-filter-path');

module.exports = (obj, filter, req) => {
	let paths = extractObjectKeys(obj).sort();
	let retVal = clone(obj);

	const stripChildrenPaths = (path) => {
		paths = paths.filter(p => !startsWith(path, p));
	};

	for (let i = 0; i < paths.length; i++) {
		const path = paths[i];
		if (shouldFilterPath(path.join('.'), filter.key || filter.keys)) {
			if (filter.when) {
				if (filter.when({ path: path.join('.'), root: retVal, value: view(lensPath(path), retVal), filter, req }) === true) {
					retVal = set(lensPath(path), filter.value, retVal);
					stripChildrenPaths(path);
				}
			} else {
				retVal = set(lensPath(path), filter.value, retVal);
				stripChildrenPaths(path);
			}
		}
	}

	return retVal;
};
