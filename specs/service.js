'use strict';

const atrix = require('@trigo/atrix');
const path = require('path');
const supertest = require('supertest');

atrix.configure({ pluginMap: { acl: path.join(__dirname, '../') } });

const svc = new atrix.Service('s1', {
	acl: {
		aclDefinition: path.join(__dirname, './acls'),
		allowInject: true,
	},
	swagger: {
		serviceDefinition: path.join(__dirname, './s1.yml'),
	},
	endpoints: {
		http: {
			port: 3007,
			handlerDir: `${__dirname}/handler`,
			prefix: '/prefix',
		},
	},
});
atrix.addService(svc);
svc.endpoints.add('http');

const svcs = {};

Object.keys(atrix.services).forEach((serviceName) => {
	const s = atrix.services[serviceName];
	if (s.config.config.endpoints.http) {
		svcs[s.name] = supertest(`http://localhost:${svc.config.config.endpoints.http.port}`);
	}
});

module.exports = {
	service: svc,
	start: async () => svc.start(),
	test: svcs[svc.name],
};
