'use strict';

const {
	lensPath, view, isNil, not, pipe, pick,
} = require('ramda');

const isNotNil = pipe(isNil, not);

const getUserData = require('../lib/get-user-data');
const bypassACLs = require('../lib/bypass-acls');

module.exports = atrixACL => (req, next) => {
	if ((typeof req.response) !== 'object' || !req.response.source) {
		return next.continue();
	}

	if (bypassACLs(atrixACL, req)) {
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
		const links = view(lensPath(path), item);
		if (!links) return;

		const tenantIdPath = item._source ? ['_source', 'tenantId'] : ['tenantId'];
		let tenantId = view(lensPath(tenantIdPath), item);
		if (tenantId === '_all') {
			tenantId = null;
		}

		const filteredRoles = tenantId
			? roles.filter(r => r.tenant === tenantId || r.global)
			: roles;

		const filteredLinks = Object.keys(links).reduce((ret, transition) => {
			const link = links[transition];
			const linkPath = link.href || link.url;
			const allowed = filteredRoles.find(({ tenant, role }) => atrixACL.ACL.access({
				role,
				userId,
				tenant,
				transition,
				path: linkPath,
				method: link.method || 'get',
			}));

			if (isNotNil(allowed)) {
				atrixACL.log.debug(
					'Grant transition:', transition,
					'link:', link,
					'of resource:', linkPath,
					'with tenantId:', tenantId,
					'in context:', pick(['roles', 'tenantIds'], req.auth),
					'due to rule:', allowed,
				);
			}
			ret[transition] = isNotNil(allowed) ? link : false; //eslint-disable-line
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
