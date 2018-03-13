'use strict';

const generateToken = require('./generate-token');

module.exports = {
	authorization: `Bearer ${generateToken()}`,
};
