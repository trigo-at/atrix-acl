module.exports.handler = async (req, reply, service) => {
    const response = await service.request({
        method: 'get',
        url: '/admin-only',
        headers: req.headers,
    });
    return reply({inject: response.result});
};
