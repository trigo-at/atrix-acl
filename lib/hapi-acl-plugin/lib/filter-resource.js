'use strict';

/* eslint no-underscore-dangle:0, no-prototype-builtins:0, max-len:0, dot-notation:0 */

// NOTE: all functions in here heavily mutate state. it's a feature, not a bug!

const { performance } = require('perf_hooks');
const debug = require('util').debuglog('atrix-acl-filter-resource');
const getUserData = require('./get-user-data');
const filterHatrLinks = require('./filter-hatr-links');

module.exports = (obj, filters, shouldFilterHatrLinks, atrixACL, req) => {
	const trie = {};
	const filtersToApply = Array.isArray(filters) ? filters : [filters];
	filtersToApply.forEach(filter => {
		const keyBlacklist = getKeyBlacklist(filter);
		keyBlacklist.forEach(keys => addToTrie(trie, keys, filter));
	});
	debug('Filters: ', trie);

	// capture some variables (obj, filter, req) in the closure to not
	// have to pass them through the call hierarchy
	const whenClosure = (filter, path, value, root, contextTenantId) => (filter.when ? filter.when({ path, root, obj: value, value, filter, req, contextTenantId }) : true);

	// hatr link filtering
	const startHatr = performance.now();
	let filterHatrClosure;
	if (shouldFilterHatrLinks) {
		const { roles, userId } = getUserData(req, atrixACL);
		filterHatrClosure = (curObj, contextTenantId) => filterHatrLinks(atrixACL, req, curObj, roles, userId, contextTenantId);
	} else {
		filterHatrClosure = () => {};
	}
	const execHatrTime = performance.now() - startHatr;
	req.log.debug({ execTimeMsec: execHatrTime, handler: 'atrix-acl:filter-resource:hatr' });

	filterNode(0, obj, obj, '', trie, whenClosure, filterHatrClosure);

	return obj;
};

/**
 * Accepts `filter.key` and `filter.keys`, `filter.key` having precedence.
 * Array-izes the keys
 * @return {array} e.g. `[ 'a.b'], ['*.b'] ]`
 */
function normalizeFilter(filter) {
	const inputKeys = filter.key || filter.keys;
	const rawBlacklist = Array.isArray(inputKeys) ? inputKeys : [inputKeys];
	return rawBlacklist;
}

function getKeyBlacklist(filter) {
	const rawBlacklist = normalizeFilter(filter);
	return rawBlacklist.map(key => {
		const sanitizedKey = key.trim();
		return sanitizedKey.split('.');
	});
}

function addToTrie(trie, nodePath, filter) {
	if (!nodePath) return trie;
	if (!trie.hasOwnProperty(nodePath[0])) trie[nodePath[0]] = { __d: [filter] };
	else trie[nodePath[0]]['__d'].push(filter);
	if (nodePath.length > 1) addToTrie(trie[nodePath[0]], nodePath.slice(1), filter);
	return trie;
}

/**
 * Recursive tree traversal to filter blacklisted keys from the object.
 * @param node {object} The object we have to filter
 * @param path {string} The attribute path to the current node, e.g. `foo.bar`
 * @param filterBranch {array} List of keys we have to filter (hierarchical), e.g. `['a', 'b']`
 * @param value {object} Value to set for blacklisted keys
 * @param when {function} Found blacklisted keys are evaluated against this function, value is only set if `when` returns true
 */

function filterNode(level, root, node, path, filterTrie, when, filterHatr, contextTenantId) {
	if (node === undefined || node === null || Object.keys(node).length === 0 || filterTrie === undefined || Object.keys(filterTrie).length === 0) return;
	debug('-------------------------------------------');
	debug(`${level} @ ${path || '.'} = ${JSON.stringify(node)}`);
	debug('  filterTrie = ', filterTrie);

	const nodeKeys = getTrieChildNodes(filterTrie);
	const hasWildcard = nodeKeys.indexOf('*') >= 0;
	const nodeIsObject = typeof node === 'object';
	const isTopLevelArray = level === 0 && Array.isArray(node);

	if (!hasWildcard && nodeIsObject) {
		if (nodeKeys.indexOf('_source') < 0) nodeKeys.push('_source');
		if (nodeKeys.indexOf('_embedded') < 0) nodeKeys.push('_embedded');
	}

	let relevantChildNodes;
	if (hasWildcard || Array.isArray(node)) {
		relevantChildNodes = Object.keys(node);
	} else {
		relevantChildNodes = nodeKeys.filter(n => node.hasOwnProperty(n));
	}

	const childNodesToTraverse = relevantChildNodes.filter(n => typeof node[n] === 'object');
	debug('  relevantChildNodes = ', relevantChildNodes, ',   childNodesToTraverse = ', childNodesToTraverse);

	contextTenantId = node.tenantId ? node.tenantId : contextTenantId;
	if (contextTenantId === '_all') contextTenantId = null;
	if (node._links) {
		node._links = filterHatr(node._links, contextTenantId);
	}

	const nodesToProcess = relevantChildNodes.filter(n => (filterTrie[n] && getTrieChildNodes(filterTrie[n]).length === 0) || (hasWildcard && getTrieChildNodes(filterTrie['*']).length === 0));
	if (nodesToProcess.length > 0) {
		processBlacklist(root, node, path, nodesToProcess, childNodesToTraverse, filterTrie, when, contextTenantId);
	}

	if (hasWildcard) {
		const retryFilter = filterTrie['*'];
		debug(' next* -> ', ' ', node, retryFilter);
		filterNode(level, root, node, path, retryFilter, when, filterHatr, contextTenantId);
	}

	childNodesToTraverse.forEach(attr => {
		const nextTrie = filterTrie.hasOwnProperty(attr) ? filterTrie[attr] : filterTrie;
		const nextNode = node[attr];
		const nextRoot = isTopLevelArray ? root[attr] : root;
		debug(' next -> ', attr, nextNode, nextTrie);
		filterNode(level + 1, nextRoot, nextNode, constructPath(path, attr), nextTrie, when, filterHatr, contextTenantId);
	});
}

function getTrieChildNodes(trie) {
	const keys = Object.keys(trie);
	if (keys.indexOf('__d') >= 0) keys.splice(keys.indexOf('__d'), 1);
	return keys;
}

function getCurrentFilterDefinition(trie, key) {
	let trieNode;
	if (trie.hasOwnProperty(key)) trieNode = trie[key];
	else if (trie.hasOwnProperty('*')) trieNode = trie['*'];
	else trieNode = {};
	return trieNode['__d'] || { when: () => false, value: undefined, keys: '__noop' };
}

/**
 * Does the actual blacklist-based filtering of object attributes and array
 * elements.
 * Modifies childsToTraverse via sanitizeKeyset
 */
function processBlacklist(root, node, path, attributesToProcess, childsToTraverse, filterTrie, whenClosure, contextTenantId) {
	debug(` *** processing ${attributesToProcess} ***`);
	let numberOfAttributes = attributesToProcess.length;
	for (let idx = 0; idx < numberOfAttributes; idx++) {
		const attr = attributesToProcess[idx];
		const filterDefinitions = getCurrentFilterDefinition(filterTrie, attr);
		/* eslint-disable-next-line */
		filterDefinitions.forEach(filterDefinition => {
			if (whenClosure(filterDefinition, constructPath(path, attr), node[attr], root, contextTenantId)) {
				const hasRemovedArrayEl = setValue(node, attr, filterDefinition.value);
				sanitizeKeyset(childsToTraverse, attr, hasRemovedArrayEl);
				// if the value is undefined, setValue removed an element from
				// the array, so we have to "fix" the index variable
				if (hasRemovedArrayEl) {
					idx--;
					numberOfAttributes--;
				}
			}
		});
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
	debug(`       ---> setting value @ node ${JSON.stringify(node)} :  ${key} => ${JSON.stringify(value)} (array:${Array.isArray(node)})`);
	if (value === undefined) {
		if (Array.isArray(node)) {
			if (node.length === 0) {
				return false;
			}
			node.splice(key, 1);
			return true;
		} else {
			delete node[key];
		}
	} else {
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
	if (isArray) {
		for (let idx = foundAt; idx < keys.length; idx++) {
			keys[idx]--;
		}
	}
	if (foundAt < 0) return;
	keys.splice(foundAt, 1);
	debug(`           ---> sanitized: ${JSON.stringify(keys)} @ ${processedKey} (array:${isArray})`);
}

/**
 * Returns the current property path e.g `foo.bar.0` for `{ foo: { bar: ['first'] } }`
 * @return {string} path
 */
function constructPath(currentPath, attribute) {
	return currentPath.length > 0 ? [currentPath, attribute].join('.') : (Number.isNaN(Number.parseInt(attribute, 10)) ? attribute : '');
}

