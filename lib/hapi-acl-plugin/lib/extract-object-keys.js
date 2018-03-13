'use strict';

// recursively extract all keys of nested objects in obj
// Output Example:
// ```
// [
// 	'_embedded',
// 	'_embedded.toys',
// 	'_embedded.toys.0',
// 	'_embedded.toys.1'
// 	'_embedded.food'
// ]
// ```

const {curry, toPairs, unnest, compose, flatten, is} = require('ramda');

const mapWithIndex = curry(
	(f, x) =>
		is(Array, x)
			? x.map((v, k) => f(k, v))
			: toPairs(x).map(([k, v]) => f(k, v))
);

const extract = compose(
	unnest,
	mapWithIndex(
		(key, value) =>
			is(Object, value)
				? [[key]].concat(
						extract(value).map(path => flatten([key, path]))
				  )
				: [[key]]
	)
);

module.exports = extract;
