'use strict';

const { lensPath, view, set, clone, startsWith } = require('ramda');
const extractObjectKeys = require('./extract-object-keys');
const shouldFilterPath = require('./should-filter-path');

module.exports = (obj, filter, req) => {
	const paths = extractObjectKeys(obj).sort();
	let retVal = clone(obj);

	const blackList = [];
	paths.forEach((path) => {
		const blackListed = blackList.find(blPath => startsWith(blPath, path));
		if (blackListed) {
			return;
		}

		if (shouldFilterPath(path.join('.'), filter.key || filter.keys)) {
			if (filter.when) {
				if (filter.when({ path: path.join('.'), root: retVal, value: view(lensPath(path), retVal), filter, req }) === true) {
					retVal = set(lensPath(path), filter.value, retVal);
					blackList.push(path);
				}
			} else {
				retVal = set(lensPath(path), filter.value, retVal);
				blackList.push(path);
			}
		}
	});

	return retVal;
};
