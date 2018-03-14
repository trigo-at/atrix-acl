'use strict';

const RouteParser = require('route-parser');

const PARSER_CACHE = {};

module.exports = (route) => {
	if (PARSER_CACHE[route]) return PARSER_CACHE[route];

	PARSER_CACHE[route] = RouteParser(route);
	return PARSER_CACHE[route];
};
