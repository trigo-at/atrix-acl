'use strict';

const {
	lensPath, view, set, clone, startsWith, dissocPath,
} = require('ramda');
const extractObjectKeys = require('./extract-object-keys');
const shouldFilterPath = require('./should-filter-path');

module.exports = (obj, filter, req) => {
	const paths = extractObjectKeys(obj).sort();
	let retVal = clone(obj);

	const blackList = [];
	const filteredArrayValues = [];
	paths.forEach((path) => {
		const blackListed = blackList.find(blPath => startsWith(blPath, path));
		if (blackListed) {
			return;
		}

		const filterValue = () => {
			retVal = set(lensPath(path), filter.value, retVal);
			blackList.push(path);

			const parentPath = clone(path);
			parentPath.pop();
			const parent = view(lensPath(parentPath), retVal);
			if (Array.isArray(parent)) {
				filteredArrayValues.push(path);
			}
		};

		if (shouldFilterPath(path.join('.'), filter.key || filter.keys)) {
			if (filter.when) {
				if (filter.when({
					path: path.join('.'), root: retVal, value: view(lensPath(path), retVal), filter, req,
				}) === true) {
					filterValue();
				}
			} else {
				filterValue();
			}
		}
	});

	filteredArrayValues.forEach((path) => {
		const arrayValue = view(lensPath(path), retVal);
		if (arrayValue === undefined) {
			retVal = dissocPath(path, retVal);
		}
	});

	return retVal;
};
