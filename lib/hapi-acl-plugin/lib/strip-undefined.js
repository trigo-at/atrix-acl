'use strict';

module.exports = myObj => {
	const o = myObj;
	Object.keys(o).forEach(key => o[key] === undefined && delete o[key]);
	return o;
};
