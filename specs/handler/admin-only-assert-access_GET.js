module.exports = (req, reply) => {
    req.assertAccess(req, 'voegb');
    reply(42);
};
