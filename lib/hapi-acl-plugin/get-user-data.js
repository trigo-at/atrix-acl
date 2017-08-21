'use strict';

module.exports = (req) => {
	return {
		userId: req.headers['x-pathfinder-userid'],
		role: req.headers['x-pathfinder-role'],
	};
};
