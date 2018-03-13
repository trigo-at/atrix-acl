'use strict';

const Shot = require('shot');

module.exports = (atrixACL, req) =>
	!req.plugins.atrixACL.noInjectBypass &&
	atrixACL.allowInject &&
	Shot.isInjection(req.raw.res);
