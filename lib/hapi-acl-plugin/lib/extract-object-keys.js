'use strict';

const extract = (obj, paths = [], current = []) => {
	if (obj === null) return paths;
	if (typeof (obj) === 'object') {
		const keys = Object.keys(obj);
		let isArray = false;
		isArray = Array.isArray(obj);
		// console.log('keys', keys);
		for (const key of keys) {
			const newPath = Array.from(current);
			const keyValue = isArray ? parseInt(key, 10) : key;
			newPath.push(keyValue);
			paths.push(newPath);
			extract(obj[key], paths, newPath);
		}
	}

	return paths;
};

module.exports = extract;
