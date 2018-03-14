'use strict';

const RouteParser = require('route-parser');

const PARSER_CACHE = {};
const MAX_CACHE_SIZE = 100000;
let cacheKeys = [];

module.exports = (route) => {
	if (PARSER_CACHE[route]) return PARSER_CACHE[route];

	if (cacheKeys.length === MAX_CACHE_SIZE) {
		const tenPercent = Math.max(Math.ceil(MAX_CACHE_SIZE * 0.5), 1);

		// console.log(`Reached max cache size: ${MAX_CACHE_SIZE}. Free cache ${tenPercent} items...`);
		for (let i = 0; i < tenPercent; i++) {
			PARSER_CACHE[cacheKeys[i]] = null;
		}

		cacheKeys = cacheKeys.slice(tenPercent);
		// console.log(`New cache size: ${cacheKeys.length}`);
	}

	PARSER_CACHE[route] = RouteParser(route);
	cacheKeys.push(route);

	return PARSER_CACHE[route];
};
