module.exports.handler = async (req, reply, service) => {
    const response = await service.request({
        method: 'get',
        url: '/admin-only-assert-access',
        headers: req.headers,
    });
    return reply({inject: response.result});
};
