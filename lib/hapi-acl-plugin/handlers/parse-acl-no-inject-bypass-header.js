'use stric';

module.exports = () => async (request, h) => {
    if (!request.plugins.atrixACL) request.plugins.atrixACL = {};
    if (request.headers['x-atrix-acl-no-inject-bypass'] !== undefined) {
        delete request.headers['x-atrix-acl-no-inject-bypass'];
        request.plugins.atrixACL.noInjectBypass = true;
    }

    return h.continue;
};
