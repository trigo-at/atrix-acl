'use strict';

const {
	lensPath,
	view,
	set,
	clone,
	startsWith,
	filter: ramdaFilter,
	pipe,
	reverse,
} = require('ramda');
const extractObjectKeys = require('./extract-object-keys');
const shouldFilterPath = require('./should-filter-path');
const stripUndefined = require('./strip-undefined');

module.exports = (obj, filter, req) => {
	const paths = extractObjectKeys(obj).sort();
	let retVal = clone(obj);

	const blackList = [];
	const filteredArrays = [];
	paths.forEach(path => {
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
				if (!filteredArrays.includes(parentPath))
					filteredArrays.push(parentPath);
			}
		};

		if (shouldFilterPath(path.join('.'), filter.key || filter.keys)) {
			if (filter.when) {
				if (
					filter.when({
						path: path.join('.'),
						root: retVal,
						value: view(lensPath(path), retVal),
						filter,
						req,
					}) === true
				) {
					filterValue();
				}
			} else {
				filterValue();
			}
		}
	});

	reverse(filteredArrays).forEach(path => {
		const array = pipe(
			view(lensPath(path)),
			ramdaFilter(v => v !== undefined)
		)(retVal);
		retVal = set(lensPath(path), array, retVal);
	});

	return stripUndefined(retVal);
};
