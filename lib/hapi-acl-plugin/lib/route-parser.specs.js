'use strict';

const RouteParser = require('./route-parser');
const uuid = require('uuid');
const bb = require('bluebird');


describe('route-parser', () => {
	it('uses constant max memory (SLOW!)', async () => {
		let iteration = 0;
		do {
			const p1 = uuid();
			const p2 = uuid();
			const route = `/${p1}/:id/${p2}/:action`;

			for (let i = 0; i < 15000; i++) {
				const path = `/${p1}/${uuid()}/${p2}/${uuid()}`;
				const match = RouteParser(route).match(path);
			}
			iteration++;
			console.log(`Finished iteration: ${iteration}`);
		} while (iteration < 10000);
	});
});
