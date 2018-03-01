'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const { expect } = require('chai');
const svc = require('../service');
const testHeaders = require('../helper/test-headers');

describe('Filter FSM transition links', () => {
	let atrixACL;
	before(async () => {
		atrixACL = svc.service.plugins.acl;
	});
	beforeEach(async () => {
		atrixACL.setRules([{ role: 'admin', path: '/pets/242', method: '*' }]);
	});

	it('filters _links (hrefs) from response body which are not allowed due to ACLs', async () => {
		const res = await svc.test
			.get('/prefix/pets/242')
			.set(testHeaders);

		const allowedLinks = {
			self: {
				href: '/pets/242',
				method: 'get',
			},
			update:	{
				href: '/pets/242',
				method: 'patch',
			},
			cancel:	false,
			'assign:venue:request': false,
			'cancel:speaker': false,
		};
			expect(res.body._links).to.eql(allowedLinks); //eslint-disable-line
		expect(res.statusCode).to.equal(200);
	});

	it('filters _links (hrefs + transitions) from response body which are not allowed due to ACLs', async () => {
		atrixACL.setRules([
			{ role: 'admin', path: '/pets/242', method: '*' },
			{ role: 'admin', transition: 'cancel:speaker', method: '*' },
		]);
		const res = await svc.test
			.get('/prefix/pets/242')
			.set(testHeaders);

		const allowedLinks = {
			self: {
				href: '/pets/242',
				method: 'get',
			},
			update:	{
				href: '/pets/242',
				method: 'patch',
			},
			cancel:	false,
			'assign:venue:request': false,
			'cancel:speaker': {
				href: '/pets/242/speaker-requests/{requestId}/cancellation',
				method: 'delete',
			},
		};
			expect(res.body._links).to.eql(allowedLinks); //eslint-disable-line
		expect(res.statusCode).to.equal(200);
	});

	it('filters _links (hrefs + wildcard transitions) from response body which are not allowed due to ACLs', async () => {
		atrixACL.setRules([
			{ role: 'admin', path: '/pets/242', method: '*' },
			{ role: 'admin', transition: 'cancel(:*_)', method: '*' },
		]);
		const res = await svc.test
			.get('/prefix/pets/242')
			.set(testHeaders);

		const allowedLinks = {
			self: {
				href: '/pets/242',
				method: 'get',
			},
			update:	{
				href: '/pets/242',
				method: 'patch',
			},
			cancel:	{
				href: '/pets/242/cancellation',
				method: 'put',
			},
			'assign:venue:request': false,
			'cancel:speaker': {
				href: '/pets/242/speaker-requests/{requestId}/cancellation',
				method: 'delete',
			},
		};
			expect(res.body._links).to.eql(allowedLinks); //eslint-disable-line
		expect(res.statusCode).to.equal(200);
	});

	it('filters _links (hrefs + wildcard transitions) from response body array which are not allowed due to ACLs', async () => {
		atrixACL.setRules([
			{ role: 'admin', path: '/pets', method: '*' },
			{ role: 'admin', path: '/pets/242', method: '*' },
			{ role: 'admin', transition: 'cancel(:*_)', method: '*' },
		]);
		const res = await svc.test
			.get('/prefix/pets')
			.set(testHeaders);

		const allowedLinks = {
			self: {
				href: '/pets/242',
				method: 'get',
			},
			update:	{
				href: '/pets/242',
				method: 'patch',
			},
			cancel:	{
				href: '/pets/242/cancellation',
				method: 'put',
			},
			'assign:venue:request': false,
			'cancel:speaker': {
				href: '/pets/242/speaker-requests/{requestId}/cancellation',
				method: 'delete',
			},
		};
		res.body.items.forEach((pet) => {
				expect(pet._links).to.eql(allowedLinks); //eslint-disable-line
		});

		expect(res.statusCode).to.equal(200);
	});
});
