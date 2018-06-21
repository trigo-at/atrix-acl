'use strict';

const RouteParser = require('route-parser');

const PARSER_CACHE = {};
const MAX_CACHE_SIZE = 100;
let cacheKeys = [];

class CachingRouteParser {
	constructor(routeParser) {
		this.MAX_CACHE_SIZE = 10000;
		this.MATCH_CACHE = {};
		this.cacheKeys = [];
		this.routeParser = routeParser;
	}

	match(path) {
		if (this.MATCH_CACHE[path] !== undefined) return this.MATCH_CACHE[path];

		if (this.cacheKeys.length === this.MAX_CACHE_SIZE) {
			const tenPercent = Math.max(Math.ceil(this.MAX_CACHE_SIZE * 0.5), 1);
			for (let i = 0; i < tenPercent; i++) {
				this.MATCH_CACHE[this.cacheKeys[i]] = null;
			}

			this.cacheKeys = this.cacheKeys.slice(tenPercent);
		}

		this.MATCH_CACHE[path] = this.routeParser.match(path);
		this.cacheKeys.push(path);
		return this.MATCH_CACHE[path];
	}
}

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

	PARSER_CACHE[route] = new CachingRouteParser(RouteParser(route));
	cacheKeys.push(route);

	return PARSER_CACHE[route];
};
