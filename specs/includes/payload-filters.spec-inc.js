'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const R = require('ramda');
const tmpObj = require('../tmp-obj');
const svc = require('../service');
const testHeaders = require('../helper/test-headers');
const generateToken = require('../helper/generate-token');

describe('payload Filters', () => {
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
	const testPayload = {
		prop: 'val',
		arrayProp: ['val1', 'val2', 'val3'],
		objProp: {
			prop: 'val',
			arrayProp: ['val1', 'val2', 'val3'],
		},
	};
	it('should not filter anything without rules', async () => {
		atrixACL.setRules([{ role: 'admin', path: '/*_', method: '*' }]);

		const res = await svc.test
			.post('/prefix/entity/42')
			.send(testPayload)
			.set(testHeaders);
		expect(res.statusCode).to.equal(200);
		expect(res.body).to.eql(testPayload);
	});

	it('should filter & remove propertiesi with "when" function => true, valu => undefined', async () => {
		atrixACL.setRules([
			{ role: 'admin', path: '/*_', method: '*' },
			{ role: 'editor', path: '/*_', method: '*' }]);

		atrixACL.setPayloadFilterRules([
			{
				role: 'editor',
				key: ['*'],
				when: ({
					path, value,
				}) => {
					if (path.match(/(prop|objProp)/)) return true;
					if (path.match(/arrayProp\.\d/) && ['val2', 'val42'].indexOf(value) !== -1) return true;
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
		expect(tmpObj.obj).to.eql({
			arrayProp: ['val1', 'val3'],
		});
	});

	it('should set properties "when" => true, value => "newVal"', async () => {
		atrixACL.setRules([
			{ role: 'admin', path: '/*_', method: '*' },
			{ role: 'editor', path: '/*_', method: '*' }]);

		atrixACL.setPayloadFilterRules([
			{
				role: 'editor', key: ['prop', 'objProp'], when: () => true, value: 'newVal',
			},
		]);
		const res = await svc.test
			.post('/prefix/entity/42')
			.send(testPayload)
			.set(headers);
		expect(res.statusCode).to.equal(200);
		expect(res.body.prop).to.eql('newVal');
		expect(res.body.objProp).to.eql('newVal');
	});

	it('it matches path for rule evaluation"', async () => {
		atrixACL.setRules([
			{ role: 'admin', path: '/*_', method: '*' },
			{ role: 'editor', path: '/*_', method: '*' }]);

		atrixACL.setPayloadFilterRules([
			{
				path: '/foo(*_)', role: 'editor', key: ['prop', 'objProp'], when: () => true, value: 'newVal',
			},
		]);
		const res = await svc.test
			.post('/prefix/entity/42')
			.send(testPayload)
			.set(headers);
		expect(res.statusCode).to.equal(200);
		expect(res.body.prop).not.to.eql('newVal');
		expect(res.body.objProp).not.to.eql('newVal');
	});
});
