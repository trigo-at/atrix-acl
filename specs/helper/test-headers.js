'use strict';

const generateToken = require('./generate-token');
/* eslint max-len: 0 */

module.exports = {
    authorization: `Bearer ${generateToken()}`,
};
