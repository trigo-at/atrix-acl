'use strict';

module.exports = () => [
    {key: 'id', value: null},
    {key: ['name', 'id'], value: 'foo'},
    {key: '_embedded.*', value: {}},
    {key: '_embedded.*', when: ({root, obj}) => obj.tenantId && obj.tenantId !== root.tenantId, value: null},
    {key: '*.id', value: '1'},

    {role: 'editor', key: '*.id', value: 123},
    {role: '!super-admin', key: '*.id', value: 123},

    {key: '*.id', when: ({req}) => req.auth.effectiveRoles.indexOf('super-admin') <= 0, value: null},
];
