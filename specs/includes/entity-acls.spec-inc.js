
/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const R = require('ramda');
const svc = require('../service');
const testHeaders = require('../helper/test-headers');
const generateToken = require('../helper/generate-token');

describe('Inject', () => {
	let atrixACL;
	let roles = {
		'pathfinder-app': {
			roles: ['ak:admin', 'voegb:editor', 'voegb:event-viewer'],
		},
	};

	before(async () => {
		atrixACL = svc.service.plugins.acl;
	});

	const { server } = svc.service.endpoints.get('http').instance;

	it.only('test rpute parsin', async () => {
		atrixACL.setRules([{ role: 'admin', path: '/*_', method: '*' }]);
		const res = await svc.test
			.get('/prefix/events/42')
			.set(testHeaders);
		expect(res.statusCode).to.equal(200);
	});
});
