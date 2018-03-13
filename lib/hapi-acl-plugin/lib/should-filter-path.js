'use strict';

module.exports = (path, keys) => {
	if (path === null || path === undefined)
		throw new Error('mandatory argument "path" missing or null');
	if (keys === null || keys === undefined)
		throw new Error('mandatory argument "keys" missing or null');
	const asArray = Array.isArray(keys) ? keys : [keys];

	return !!asArray.find(key => {
		if (key === '*') return true;
		if (key.endsWith('.*') && key.startsWith('*.')) {
			return path.includes(key.substr(2, key.length - 4));
		}

		if (key.endsWith('.*')) {
			return path.startsWith(key.substring(0, key.length - 2));
		}
		if (key.startsWith('*.')) {
			return path.endsWith(key.substr(2));
		}

		return path === key;
	});
};
