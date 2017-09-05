// 'use strict';
//
// /* eslint-env node, mocha */
// /* eslint no-unused-expressions: 0, arrow-body-style: 0 */
//
// const { expect } = require('chai');
// const R = require('ramda');
// const svc = require('./service');
// const testHeaders = require('./helper/test-headers');
// const generateToken = require('./helper/generate-token');
//
// describe.only('Filter response', () => {
// 	let atrixACL;
//
// 	before(async () => {
// 		await svc.start();
// 		atrixACL = svc.service.plugins.acl;
// 	});
//
// 	beforeEach(async () => {
// 		atrixACL.setRules([{ role: 'admin', path: '/*_', method: '*' }]);
// 	});
//
//
// 	it('allow GET', async () => {
// 		const res = await svc.test
// 			.get('/prefix/pets/242')
// 			.set(testHeaders);
// 		expect(res.statusCode).to.equal(200);
//
// 		const body = res.body;
// 		console.log(body);
//
// 		body._embedded.toys.forEach((toy) => {
// 			expect(toy.tenantId).to.equal(body.tenantId);
// 		});
// 		if (body._embedded.food && body._embedded.food.tenantId) {
// 			expect(body._embedded.food.tenantId).to.equal(body.tenantId);
// 		}
// 		expect(body.name).to.equal('')
// 	});
// });
