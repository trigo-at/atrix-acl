'use stric';

module.exports = () => (req, next) => {
    if (!req.plugins.atrixACL) req.plugins.atrixACL = {};
    if (req.headers['x-atrix-acl-no-inject-bypass'] !== undefined) {
        delete req.headers['x-atrix-acl-no-inject-bypass'];
        req.plugins.atrixACL.noInjectBypass = true;
    }

    next.continue();
};
