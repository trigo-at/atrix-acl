'use strict';

const RouteParser = require('route-parser');

const MAX_CACHE_SIZE = 100;
const MAX_MATCH_CACHE_SIZE = 10000;

class CachingRouteParser {
    constructor(routeParser) {
        this.MATCH_CACHE = {};
        this.cacheKeys = [];
        this.routeParser = routeParser;
    }

    match(path) {
        if (this.MATCH_CACHE[path] !== undefined) {
            return this.MATCH_CACHE[path];
        }

        if (this.cacheKeys.length === MAX_MATCH_CACHE_SIZE) {
            const tenPercent = Math.max(Math.ceil(MAX_MATCH_CACHE_SIZE * 0.1), 1);
            console.log(
                `atrix-acl:RouteParser:CachingRouteParser: Reached max MATCH_CACHE size: ${MAX_MATCH_CACHE_SIZE}. Free cache ${tenPercent} items...`
            );
            for (let i = 0; i < tenPercent; i++) {
                this.MATCH_CACHE[this.cacheKeys[i]] = undefined;
            }

            this.cacheKeys = this.cacheKeys.slice(tenPercent);
        }

        this.MATCH_CACHE[path] = this.routeParser.match(path);
        this.cacheKeys.push(path);
        return this.MATCH_CACHE[path];
    }
}

const PARSER_CACHE = {};
let cacheKeys = [];

module.exports = route => {
    if (PARSER_CACHE[route]) return PARSER_CACHE[route];

    if (cacheKeys.length === MAX_CACHE_SIZE) {
        const tenPercent = Math.max(Math.ceil(MAX_CACHE_SIZE * 0.1), 1);

        console.log(
            `atrix-acl:RouteParser: Reached max PARSER_CACHE size: ${MAX_CACHE_SIZE}. Free cache ${tenPercent} items...`
        );
        for (let i = 0; i < tenPercent; i++) {
            PARSER_CACHE[cacheKeys[i]] = undefined;
        }

        cacheKeys = cacheKeys.slice(tenPercent);
    }

    PARSER_CACHE[route] = new CachingRouteParser(RouteParser(route));
    cacheKeys.push(route);

    return PARSER_CACHE[route];
};
