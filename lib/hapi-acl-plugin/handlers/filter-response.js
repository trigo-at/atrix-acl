'use strict';

// eslint-disable-next-line
const { performance } = require('perf_hooks');
const bypassACLs = require('../lib/bypass-acls');
const applyObjectFilterRules = require('../lib/apply-object-filter-rules');

module.exports = atrixACL => (req, next) => {
	if ((typeof req.response) !== 'object' || !req.response.source) {
		return next.continue();
	}

	if (bypassACLs(atrixACL, req)) {
		return next.continue();
	}

	// console.log('%%%%%%%%%%%%%%%%% START RESPONSE FILTER %%%%%%%%%%%%%%')
	const start2 = performance.now();
	const filtered = applyObjectFilterRules({
		req,
		atrixACL,
		rules: atrixACL.ACL.filterRules,
		object: req.response.source,
		filterOptions: { filterHatrLinks: true, filterTenantContext: atrixACL.config.acl.enableNestedDocumentAcl },
	});
	// console.log('%%%%%%%%%%%%%%%%% END RESPONSE FILTER %%%%%%%%%%%%%%')

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
