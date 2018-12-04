'use strict';

const debug = require('util').debuglog('atrix-acl-filter-resource');

module.exports = (path, key, isArray = false) => {
    if (path === null || path === undefined) throw new Error('mandatory argument "path" missing or null');
    if (key === null || key === undefined) throw new Error('mandatory argument "keys" missing or null');
    let filter = false;
    if (key === '*') {
        filter = true;
    } else if (key.endsWith('.*') && key.startsWith('*.')) {
        filter = path.includes(key.substr(2, key.length - 4));
    } else if (key.endsWith('.*')) {
        const fixedKey = key.substring(0, key.length - 2);
        debug('   fixedKey', fixedKey);
        filter = path.startsWith(fixedKey) && (isArray || path !== fixedKey);
    } else if (key.startsWith('*.')) {
        filter = path.endsWith(key.substr(2));
    } else {
        filter = path === key;
    }

    debug('shouldFilterPath: ', path, 'key: ', key, ' => ', filter);
    return filter;
};
