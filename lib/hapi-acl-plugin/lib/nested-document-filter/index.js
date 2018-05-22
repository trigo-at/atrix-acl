'use strict';

const {
	type, map, filter,
} = require('ramda');
const stripUndefined = require('../strip-undefined');
const hasDocumentAccess = require('./has-document-access');

const filterUndefinedArrayElements = filter(x => x !== undefined);

const nestedDocumentFilter = (response, req, atrixACL) => {
	// skip when filtering disabled
	if (!atrixACL.config.acl.enableNestedDocumentAcls) return response;

	const { roles, tenantIds } = req.auth;

	const filtered = stripUndefined(map((prop) => {
		if (hasDocumentAccess(prop, roles, tenantIds, atrixACL)) {
			if (type(prop) === 'Array') {
				return nestedDocumentFilter(prop, req, atrixACL);
			} else if (type(prop) === 'Object') {
				return nestedDocumentFilter(prop, req, atrixACL);
			}
			return prop;
		}
		return undefined;
	}, response));

	return type(filtered) === 'Array' ?
		filterUndefinedArrayElements(filtered) :
		filtered;
};


module.exports = nestedDocumentFilter;
