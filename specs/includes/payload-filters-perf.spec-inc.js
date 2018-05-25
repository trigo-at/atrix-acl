'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const R = require('ramda');
const tmpObj = require('../tmp-obj');
const svc = require('../service');
const testHeaders = require('../helper/test-headers');
const generateToken = require('../helper/generate-token');

describe('payload filter perf test', () => {
	let atrixACL;
	before(async () => {
		atrixACL = svc.service.plugins.acl;
	});
	let headers;
	const roles = {
		'pathfinder-app': {
			roles: ['admin', 'ak:editor', 'voegb:editor', 'voegb:event-viewer'],
		},
	};

	beforeEach(() => {
		headers = R.merge(testHeaders, {
			authorization: `Bearer ${generateToken(roles)}`,
			'x-pathfinder-tenant-ids': 'ak,voegb',
		});
	});
	// const testPayload = {};
	const testPayload = require('../data-huge.json');

	it.only('should apply payload filter', async () => {
		atrixACL.setRules([{ role: 'admin', path: '/*_', method: '*' }]);

		atrixACL.setPayloadFilterRules([
			{
				role: 'admin',
				key: ['*'],
				when: ({
					path, value,
				}) => {
					if (path.match(/(_embed|objProp)/)) return true;
					return false;
				},
				value: undefined,
			},
		]);
		const res = await svc.test
			.post('/prefix/entity/42')
			.send(testPayload)
			.set(headers);
		expect(res.statusCode).to.equal(200);
	});
});
