'use strict';

const pkg = require('../package.json');
const AtrixACL = require('./AtrixACL');

module.exports = {
	name: pkg.name,
	version: pkg.version,
	register: () => {},
	factory: (atrix, service) => new AtrixACL(atrix, service),
};
