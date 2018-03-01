'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const R = require('ramda');
const svc = require('../service');
const testHeaders = require('../helper/test-headers');
const generateToken = require('../helper/generate-token');

describe('UserId based rule', () => {
	let atrixACL;
	before(async () => {
		atrixACL = svc.service.plugins.acl;
	});
	const { server } = svc.service.endpoints.get('http').instance;
	beforeEach(async () => {
		atrixACL.setRules([
			{ role: 'admin', path: '/pets/:petId', method: '*' },
			{ userId: '42', path: '/pets/:petId', method: '*' },
		]);
	});

	it('allow GET with correct role', async () => {
		const res = await svc.test
			.get('/prefix/pets/242')
			.set(testHeaders);
		expect(res.statusCode).to.equal(200);
		expect(res.body.id).to.equal('242');
	});

	it('allows POST with correct userId set in token', async () => {
		const headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken([], 'test@test', '42')}` });
		const res = await svc.test
			.post('/prefix/pets/242')
			.set(headers);
		expect(res.statusCode).to.equal(200);
	});

	it('denies with wrong userid', async () => {
		const headers = R.merge(testHeaders, { authorization: `Bearer ${generateToken([], 'test@test', '44')}` });
		const res = await svc.test
			.post('/prefix/pets/242')
			.set(headers);
		expect(res.statusCode).to.equal(401);
	});
});
