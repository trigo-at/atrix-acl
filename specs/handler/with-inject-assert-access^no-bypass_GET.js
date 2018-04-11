
module.exports.handler = async (req, reply, service) => {
	const response = await service.request({
		method: 'get',
		url: '/admin-only-assert-access',
		headers: Object.assign({}, req.headers, { 'x-atrix-acl-no-inject-bypass': '1' }),
	});
	return reply({ inject: response.result });
};
