'use strict';

const {lensPath, view, forEachObjIndexed, forEach} = require('ramda');
const filterHatrLinks = require('../lib/filter-hatr-links');

const getUserData = require('../lib/get-user-data');
const bypassACLs = require('../lib/bypass-acls');

const filterLinksRecursive = (atrixACL, req, item, roles, userId, tenantId) => {
	if (!item) return;

	const linksPath = item._source ? ['_source', '_links'] : ['_links'];
	const links = view(lensPath(linksPath), item);
	if (!links) return;

	const aclPath = item._source ? ['_source', '_acl'] : ['_acl'];
	const acl = view(lensPath(aclPath), item);

	const tenantIdPath = item._source ? ['_source', 'tenantId'] : ['tenantId'];
	const localTenantId = view(lensPath(tenantIdPath), item);
	let thisItemsTenantId = localTenantId || tenantId;
	if (thisItemsTenantId === '_all') {
		thisItemsTenantId = null;
	}

	const filteredLinks = filterHatrLinks(
		atrixACL,
		req,
		links,
		roles,
		acl,
		userId,
		thisItemsTenantId
	);

	if (item._source) {
		item._source._links = filteredLinks; //eslint-disable-line
	} else {
		item._links = filteredLinks; //eslint-disable-line
	}

	const embeddedPath = item._source
		? ['_source', '_embedded']
		: ['_embedded'];
	const embedded = view(lensPath(embeddedPath), item);
	if (embedded) {
		forEachObjIndexed(value => {
			if (Array.isArray(value)) {
				forEach(
					i =>
						filterLinksRecursive(
							atrixACL,
							req,
							i,
							roles,
							userId,
							thisItemsTenantId
						),
					value
				);
			}
			filterLinksRecursive(
				atrixACL,
				req,
				value,
				roles,
				userId,
				thisItemsTenantId
			);
		}, embedded);
	}
};

module.exports = atrixACL => (req, next) => {
	if (typeof req.response !== 'object' || !req.response.source) {
		return next.continue();
	}

	if (bypassACLs(atrixACL, req)) {
		return next.continue();
	}

	const {roles, userId} = getUserData(req, atrixACL);

	const resources = (() => {
		if (req.response.source.items) {
			return req.response.source.items;
		}
		if (Array.isArray(req.response.source)) {
			return req.response.source;
		}

		return [req.response.source];
	})();

	resources.forEach(item => {
		filterLinksRecursive(atrixACL, req, item, roles, userId);
	});

	return next.continue();
};
