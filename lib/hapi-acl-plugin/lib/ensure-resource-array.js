'use strict';

module.exports = value => {
    if (value === null || value === undefined) throw new Error('mandatory argument "value" missing or null');
    if (value.items && Array.isArray(value.items)) return value.items;
    return Array.isArray(value) ? value : [value];
};
