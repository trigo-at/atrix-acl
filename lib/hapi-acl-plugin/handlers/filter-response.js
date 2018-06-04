'use strict';

const { performance } = require('perf_hooks');
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

	// DISABLE: completely
	// Apply deep acls filtering before custom filters
	const start = performance.now();
	const nestedAclFilteredResponse = nestedDocumentFilter(req.response.source, req, atrixACL);
	const execTime = performance.now() - start;
	req.log.debug({ execTimeMsec: execTime, handler: 'atrix-acl:nested-acl-filter' });

	const start2 = performance.now();
	// we need to apply at least 1 "empty" filter if none other is present to
	// filter hatr links
	if (atrixACL.ACL.filterRules.length === 0) {
		atrixACL.setFilterRules([
			{ key: '*', when: () => false },
		]);
	}

	const filtered = applyObjectFilterRules({
		req,
		atrixACL,
		rules: atrixACL.ACL.filterRules,
		object: nestedAclFilteredResponse,
	});

	if (Array.isArray(req.response.source)) {
		req.response.source = filtered;
	} else if (Array.isArray(req.response.source.items)) {
		req.response.source.items = filtered;
	} else {
		req.response.source = Array.isArray(filtered) ? filtered[0] : filtered;
	}
	const execTime2 = performance.now() - start2;
	req.log.debug({ execTimeMsec: execTime2, handler: 'atrix-acl:filter-response' });

	return next.continue();
};
