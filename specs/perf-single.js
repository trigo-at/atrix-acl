'use strict';

const data = require('./testdata/data-singleobj');
// const data = {};
const {
	lensPath, view, set, clone, startsWith, filter: ramdaFilter, pipe, reverse,
} = require('ramda');

const filterResource = require('../lib/hapi-acl-plugin/lib/filter-resource');
const filter = { role: '*',
	path: '*',
	method: '*',
	key: '*.id',
	when: () => {},
	value: null
};


filterResource(data, filter);
