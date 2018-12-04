'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const {expect} = require('chai');
const R = require('ramda');
const svc = require('../service');
const testHeaders = require('../helper/test-headers');
const generateToken = require('../helper/generate-token');

describe('Inject', () => {
    let atrixACL;
    before(async () => {
        atrixACL = svc.service.plugins.acl;
    });
    const {server} = svc.service.endpoints.get('http').instance;
    it('should allow inject routes with config allowInject:true', async () => {
        const res = await server.inject({method: 'get', url: '/prefix/', headers: testHeaders});
        expect(res.statusCode).to.equal(200);
    });

    it('should deny inject routes with config allowInject:false', async () => {
        atrixACL.allowInject = false;
        const res = await server.inject({method: 'get', url: '/prefix/', headers: testHeaders});
        expect(res.statusCode).to.equal(401);
    });

    it('should deny inject routes with config allowInject:true and x-atrix-acl-no-inject-bypass header set', async () => {
        atrixACL.allowInject = true;
        const res = await server.inject({
            method: 'get',
            url: '/prefix/',
            headers: Object.assign({}, testHeaders, {'x-atrix-acl-no-inject-bypass': '0'}),
        });
        expect(res.statusCode).to.equal(401);
    });

    it('should delete x-atrix-acl-no-inject-bypass form request headers for futher inject calls to work', async () => {
        const roles = {
            'pathfinder-app': {roles: ['editor1']},
        };
        const headers = R.merge(testHeaders, {authorization: `Bearer ${generateToken(roles)}`});

        atrixACL.allowInject = true;
        atrixACL.setRules([
            {role: 'admin', path: '/admin-only(*_)', method: '*'},
            {role: 'editor1', path: '/with-inject(*_)', method: '*'},
            {role: 'editor1', path: '/editor1(*_)', method: '*'},
        ]);
        const res = await svc.test.get('/prefix/with-inject').set(headers);
        expect(res.statusCode).to.equal(200);
        expect(res.body.inject.inject).to.equal(42);
    });

    it('should delete x-atrix-acl-no-inject-bypass form request headers for futher inject calls to work', async () => {
        const roles = {
            'pathfinder-app': {roles: ['editor1']},
        };
        const headers = R.merge(testHeaders, {authorization: `Bearer ${generateToken(roles)}`});

        atrixACL.allowInject = true;
        atrixACL.setRules([
            {role: 'admin', path: '/admin-only-assert-access(*_)', method: '*'},
            {role: 'editor1', path: '/with-inject(*_)', method: '*'},
            {role: 'editor1', path: '/editor1(*_)', method: '*'},
        ]);
        const res = await svc.test.get('/prefix/with-inject').set(headers);
        expect(res.statusCode).to.equal(200);
        expect(res.body.inject.inject).to.equal(42);
    });

    it('should respect allowedInjection when asserting acl access', async () => {
        const roles = {
            'pathfinder-app': {roles: ['editor1']},
        };
        const headers = R.merge(testHeaders, {authorization: `Bearer ${generateToken(roles)}`});

        atrixACL.allowInject = true;
        atrixACL.setRules([
            {role: 'admin', path: '/admin-only-assert-access(*_)', method: '*'},
            {role: 'editor1', path: '/with-inject-assert-access(*_)', method: '*'},
        ]);

        const res = await svc.test.get('/prefix/with-inject-assert-access').set(headers);
        expect(res.statusCode).to.equal(200);
        expect(res.body.inject).to.equal(42);
    });

    it('should deny access when asserting acl when x-atrix-acl-no-inject-bypass form request header is set', async () => {
        const roles = {
            'pathfinder-app': {roles: ['ak:editor1']},
        };
        const headers = R.merge(testHeaders, {
            authorization: `Bearer ${generateToken(roles)}`,
            'x-pathfinder-tenant-ids': 'ak',
        });

        atrixACL.allowInject = true;
        atrixACL.setRules([
            {role: 'editor1', path: '/admin-only-assert-access(*_)', method: '*'},
            {role: 'editor1', path: '/with-inject-assert-access(*_)', method: '*'},
        ]);

        const res = await svc.test.get('/prefix/with-inject-assert-access/no-bypass').set(headers);
        expect(res.statusCode).to.equal(200);
        expect(res.body.inject.statusCode).to.equal(403);
    });
});
