'use strict';

module.exports = () => [
	{ key: '_embedded.*', when: (root, obj) => obj.tenantId && obj.tenantId !== root.tenantId, value: null },
	{ key: 'name', when: () => true, value: 'buh' },
];
