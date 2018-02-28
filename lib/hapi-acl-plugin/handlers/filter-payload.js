'use strict';

const bypassACLs = require('../lib/bypass-acls');
const applyObjectFilterRules = require('../lib/apply-object-filter-rules');

module.exports = atrixACL => (req, next) => {
	if ((typeof req.payload) !== 'object') {
		return next.continue();
	}

	if (bypassACLs(atrixACL, req)) {
		return next.continue();
	}

	if (atrixACL.ACL.filterPayloadRules.length === 0) {
		return next.continue();
	}

	const filtered = applyObjectFilterRules({
		req,
		atrixACL,
		rules: atrixACL.ACL.filterPayloadRules,
		object: req.payload,
	});

	req.payload = Array.isArray(filtered) ? filtered[0] : filtered;
	return next.continue();
};
