'use strict';

const {
	uniq, pipe, map, defaultTo, split, head, ifElse, propEq, isNil, not, filter,
} = require('ramda');

const defaultToEmptyArray = defaultTo([]);
const splitColon = split(':');
const headSplitColon = pipe(
	splitColon,
	ifElse(
		propEq('length', 2),
		head,
		() => null,
	),
);
const isNotNil = pipe(isNil, not);

const getTenantIds = roles => map(headSplitColon, roles);

module.exports = roles => pipe(
	uniq,
	filter(isNotNil),
)(getTenantIds(defaultToEmptyArray(roles)));
