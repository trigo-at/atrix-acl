'use strict';

const Shot = require('shot');
const R = require('ramda');
const getUserData = require('../lib/get-user-data');

module.exports = atrixACL => (req, next) => {
	if ((typeof req.response) !== 'object' || !req.response.source) {
		return next.continue();
	}

	if (atrixACL.allowInject && Shot.isInjection(req.raw.res)) {
		return next.continue();
	}

	const { roles, userId } = getUserData(req, atrixACL);

	const resources = (() => {
		if (req.response.source.items) {
			return req.response.source.items;
		}
		if (Array.isArray(req.response.source)) {
			return req.response.source;
		}

		return [req.response.source];
	})();


	resources.forEach((item) => {
		const path = item._source ? ['_source', '_links'] : ['_links'];
		const links = R.view(R.lensPath(path), item);
		if (!links) return;

		const filteredLinks = Object.keys(links).reduce((ret, transition) => {
			const link = links[transition];
			const allowed = roles.some(({ tenant, role }) => atrixACL.ACL.access({ role,
				userId,
				tenant,
				transition,
				path: link.href || link.url,
				method: link.method || 'get' }));

			ret[transition] = allowed ? link : false; //eslint-disable-line
			return ret;
		}, {});

		if (item._source) {
			item._source._links = filteredLinks; //eslint-disable-line
		} else {
			item._links = filteredLinks; //eslint-disable-line
		}
	});

	return next.continue();
};
