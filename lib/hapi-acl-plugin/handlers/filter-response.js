'use strict';

const bypassACLs = require('../lib/bypass-acls');
const applyObjectFilterRules = require('../lib/apply-object-filter-rules');
const nestedDocumentFilter = require('../lib/nested-document-filter');

module.exports = atrixACL => (req, next) => {
	if ((typeof req.response) !== 'object' || !req.response.source) {
		return next.continue();
	}

	if (bypassACLs(atrixACL, req)) {
		return next.continue();
	}

	if (atrixACL.ACL.filterRules.length === 0) {
		return next.continue();
	}

	// DISABLE: completely
	// Apply deep acls filtering before custom filters
	let start = new Date();
	const nestedAclFilteredResponse = nestedDocumentFilter(req.response.source, req, atrixACL);
	let end = new Date();
	req.log.debug(`Nested ACL Filter: ${end.getTime() - start.getTime()} `);

	start = new Date();
	const filtered = applyObjectFilterRules({
		req,
		atrixACL,
		rules: atrixACL.ACL.filterRules,
		object: nestedAclFilteredResponse,
	});
	end = new Date();
	req.log.debug(`Response Filter: ${end.getTime() - start.getTime()} `);

	if (Array.isArray(req.response.source)) {
		req.response.source = filtered;
	} else if (Array.isArray(req.response.source.items)) {
		req.response.source.items = filtered;
	} else {
		req.response.source = Array.isArray(filtered) ? filtered[0] : filtered;
	}

	return next.continue();
};
