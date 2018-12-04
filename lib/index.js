'use strict';

const pkg = require('../package.json');
const AtrixACL = require('./AtrixACL');
const generateToken = require('../specs/helper/generate-token');

module.exports = {
    name: pkg.name,
    version: pkg.version,
    register: () => {},
    factory: (atrix, service) => new AtrixACL(atrix, service),
    generateToken,
    compatibility: {
        atrix: {
            min: '6.0.0-7',
        },
    },
};
