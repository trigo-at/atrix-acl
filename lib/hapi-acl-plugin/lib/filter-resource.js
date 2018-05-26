'use strict';

// NOTE: all functions in here heavily mutate state. it's a feature, not a bug!

const debug = require('util').debuglog('atrix-acl-filter-resource');

module.exports = (obj, filter, req) => {
	const start = new Date();
	const keyBlacklist = getKeyBlacklist(filter);

	// capture some variables (obj, filter, req) in the closure to not
	// have to pass them through the call hierarchy
	const whenClosure = (path, value) => {
		return filter.when ? filter.when({path, root: obj, value, filter, req}) : true;
	};

	// since the keys we have to filter are probably fewer than number of
	// keys on our input objects, we iterate over the blacklisted keys instead of
	// the object keys
	keyBlacklist.forEach(key => filterNode(obj, '', key, filter.value, whenClosure));

	const end = new Date();
	debug(`Filter Resource took: ${end.getTime() - start.getTime()}ms`);
	debug(`RESULT = ${JSON.stringify(obj).substring(0, 2000)}`);
	return obj;
};

/**
 * Accepts `filter.key` and `filter.keys`, `filter.key` having precedence.
 * Array-izes the keys, removes ending wildcards
 * @return {array} e.g. `[ ['a', 'b'], ['*', 'b'] ]`
 */
function getKeyBlacklist(filter) {
	const inputKeys = filter.key || filter.keys
	const rawBlacklist = Array.isArray(inputKeys) ? inputKeys : [inputKeys];
	return rawBlacklist.map(key => {
		// keys ending with a wildcard have the same effect as ones without
		// ending in wildcards, so we strip ending wildcards
		const sanitizedKey = key.endsWith(".*") ? key.slice(0, -2) : key;
		return sanitizedKey.split('.');
	});
}

/**
 * Recursive tree traversal to filter blacklisted keys from the object.
 * @param node {object} The object we have to filter
 * @param path {string} The attribute path to the current node, e.g. `foo.bar`
 * @param filterBranch {array} List of keys we have to filter (hierarchical), e.g. `['a', 'b']`
 * @param value {object} Value to set for blacklisted keys
 * @param when {function} Found blacklisted keys are evaluated against this function, value is only set if `when` returns true
 */
function filterNode(node, path, filterBranch, value, when) {
	if (node === undefined || node === null || filterBranch.length === 0) return;
	debug('-------------------------------------------');
	debug(`@ ${path || '.'} = ${JSON.stringify(node)}`);
	debug('  filterBranch = ', filterBranch);

	const nodeKey = filterBranch[0];

	// we are only interested in nodes which match the nodeKey
	const relevantChilds = nodeKey === '*' ? Object.keys(node) : [nodeKey];
	debug('  relevantChilds = ', relevantChilds);

	// find out which child nodes are worthy of traversing, we don't want to traverse
	// into strings or simple data types, only objects and arrays
	const childsToTraverse = filterBranch.length > 1 || nodeKey === '*' ? relevantChilds.filter(k => typeof(node[k]) === 'object') : [];
	debug('  childsToTraverse = ', childsToTraverse);

	// only do filtering if we are at the end of our filter and we have
	// relevant nodes to filter
	if (filterBranch.length === 1 && relevantChilds.length > 0) {
		processBlacklist(relevantChilds, childsToTraverse, node, path, value, when);
	}

	// the tree traversal follows two paths in the case of prefix wildcards
	//
	// if we have a wildcard filter and more filter levels ahead of us,
	// we try the same node we just processed but without the wildcard,
	// so in the next traversal step we don't have a wildcard anymore
	// and the tree traversal is continued to the next level
	if (nodeKey === '*' && filterBranch.length > 1) {
		const retryFilter = filterBranch.slice(1);
		debug(' next* -> ', ' ', node, retryFilter);
		filterNode(node, path, retryFilter, value, when);
	}

	// in every case (with or without wildcards) we go down the tree by
	// following all childsToTraverse
	childsToTraverse.forEach(attr => {
		// if we have a wildcard, we pass it down because it matches every
		// time, the case of non-matching next-level filters is handled by the
		// first traversal path where the wildcard is removed
		//
		// if we have a regular nodeKey, we remove it from the filterBranch
		// because it matched, so it can't match again
		const nextFilter = nodeKey === '*' ? filterBranch : filterBranch.slice(1);
		const nextNode = node[attr];
		debug(' next -> ', attr, nextNode, nextFilter);
		filterNode(nextNode, constructPath(path, attr), nextFilter, value, when);
	});
}

/**
 * Does the actual blacklist-based filtering of object attributes and array
 * elements.
 * Modifies childsToTraverse via sanitizeKeyset
 */
function processBlacklist(attributesToProcess, childsToTraverse, node, path, value, when) {
	debug('  *** processing ***');
	for(let idx=0; idx < attributesToProcess.length; idx++) {
		const attr = attributesToProcess[idx];
		if (when(constructPath(path, attr), node[attr])) {
			const hasRemovedArrayEl = setValue(node, attr, value);
			sanitizeKeyset(childsToTraverse, attr, hasRemovedArrayEl);
			// if the value is undefined, setValue removed an element from
			// the array, so we have to "fix" the index variable
			if (hasRemovedArrayEl) idx--;
		}
	}
}

/**
 * Sets an attribute on an object or an array element to a specified value,
 * if the value is undefined, the object attribute is deleted, the array
 * element is removed from the array.
 * Retuns true if an array element was removed, false otherwise.
 * @return {bool}
 */
function setValue(node, key, value) {
	debug(`       ---> setting value ${JSON.stringify(node)} ->  ${key} = ${JSON.stringify(value)}`);
	if (value === undefined) {
		if (Array.isArray(node)) {
			node.splice(key, 1);
			return true;
		}
		else {
			delete node[key];
		}
	}
	else {
		node[key] = value;
	}
	return false;
}

/**
 * Removes a key from a key set, used to avoid duplicate processing and
 * circular processing.
 * If the currently processed node is an array, all keys are decreased by 1 to
 * have correct array indices again.
 * @param {array} keys The key set to be sanitized.
 * @param {string} processedKey  The key to be removed from the keys array
 * @param {bool} isArray If set to true, all elements in the keys array are decreased by 1
 */
function sanitizeKeyset(keys, processedKey, isArray) {
	if (keys.length === 0) return;
	debug(`           ---> trying sanitizing ${JSON.stringify(keys)} @ ${processedKey} (array:${isArray})`);
	const foundAt = keys.indexOf(processedKey);
	if (isArray) keys.forEach((k, i) => keys[i] = k - 1);
	if (foundAt < 0) return;
	keys.splice(foundAt, 1);
	debug(`           ---> sanitized ${JSON.stringify(keys)} @ ${processedKey} (array:${isArray})`);
}

/**
 * Returns the current property path e.g `foo.bar.0` for `{ foo: { bar: ['first'] } }`
 * @return {string} path
 */
function constructPath(currentPath, attribute) {
	return currentPath.length > 0 ? [currentPath, attribute].join('.') : attribute;
}

