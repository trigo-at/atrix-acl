const tmpObj = require('../../../tmp-obj');
module.exports = (req, reply) => {
	tmpObj.obj = req.payload;
	reply(req.payload);
};
