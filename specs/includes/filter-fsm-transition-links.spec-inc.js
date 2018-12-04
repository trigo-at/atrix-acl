'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0, one-var: 0, one-var-declaration-per-line: 0 */

const {expect} = require('chai');
const svc = require('../service');
const testHeaders = require('../helper/test-headers');
const generateToken = require('../helper/generate-token');
const {merge} = require('ramda');

const getHeaders = (roles, tenantIds) => {
    return merge(testHeaders, {
        'x-pathfinder-tenant-ids': tenantIds.join(','),
        authorization: `Bearer ${generateToken({
            'pathfinder-app': {
                roles,
            },
        })}`,
    });
};

describe('Filter FSM transition links', () => {
    let atrixACL, headers;
    const roles = {
        'pathfinder-app': {
            roles: ['ak:admin', 'voegb:editor', 'voegb:event-viewer'],
        },
    };
    before(async () => {
        atrixACL = svc.service.plugins.acl;
    });
    beforeEach(async () => {
        atrixACL.setRules([
            {
                role: 'admin',
                path: '/pets/:id',
                method: '*',
                entity: 'pet',
            },
        ]);
        atrixACL.setEntityACLs([]);
        headers = merge(testHeaders, {
            'x-pathfinder-tenant-ids': 'ak,voegb',
            authorization: `Bearer ${generateToken(roles)}`,
        });
    });

    it('filters _links based on resource without tenantId', async () => {
        atrixACL.setRules([
            {role: 'admin', path: '/pets/242', method: 'get'},
            {role: 'admin', transition: '(*_)', method: '*'},
        ]);
        const res = await svc.test.get('/prefix/pets/242?tenantId=__delete__').set(headers);

        const allowedLinks = {
            self: {
                href: '/pets/242',
                method: 'get',
            },
            update: {
                href: '/pets/242',
                method: 'patch',
            },
            cancel: {
                href: '/pets/242/cancellation',
                method: 'put',
            },
            'assign:venue:request': {
                href: '/pets/242/venue-requests',
                method: 'post',
            },
            'cancel:speaker': {
                href: '/pets/242/speaker-requests/{requestId}/cancellation',
                method: 'delete',
            },
        };
        expect(res.body.tenantId).not.to.exist;
        expect(res.statusCode).to.equal(200);
        expect(res.body._links).to.eql(allowedLinks); //eslint-disable-line
    });
    it('filters _links based on the resource tenantId=_all is handled like no tenant Id', async () => {
        atrixACL.setRules([
            {role: 'admin', path: '/pets/242', method: 'get'},
            {role: 'admin', transition: '(*_)', method: '*'},
        ]);
        const res = await svc.test.get('/prefix/pets/242?tenantId=_all').set(headers);

        const allowedLinks = {
            self: {
                href: '/pets/242',
                method: 'get',
            },
            update: {
                href: '/pets/242',
                method: 'patch',
            },
            cancel: {
                href: '/pets/242/cancellation',
                method: 'put',
            },
            'assign:venue:request': {
                href: '/pets/242/venue-requests',
                method: 'post',
            },
            'cancel:speaker': {
                href: '/pets/242/speaker-requests/{requestId}/cancellation',
                method: 'delete',
            },
        };
        expect(res.statusCode).to.equal(200);
        expect(res.body._links).to.eql(allowedLinks); //eslint-disable-line
    });
    it('filters _links based on the resource tenantId - read only for voegb:editor', async () => {
        headers = merge(testHeaders, {
            'x-pathfinder-tenant-ids': 'ak,voegb',
            authorization: `Bearer ${generateToken({
                'pathfinder-app': {
                    roles: ['voegb:editor'],
                },
            })}`,
        });
        atrixACL.setRules([
            {role: 'editor', path: '/pets/242', method: 'get'},
            {role: 'admin', transition: 'cancel(:*_)', method: '*'},
        ]);
        const res = await svc.test.get('/prefix/pets/242?tenantId=voegb').set(headers);

        const allowedLinks = {
            self: {
                href: '/pets/242',
                method: 'get',
            },
            update: false,
            cancel: false,
            'assign:venue:request': false,
            'cancel:speaker': false,
        };
        expect(res.statusCode).to.equal(200);
        expect(res.body._links).to.eql(allowedLinks); //eslint-disable-line
    });
    it('filters _links based on the resource tenantId - full access for ak:admin', async () => {
        headers = merge(testHeaders, {
            'x-pathfinder-tenant-ids': 'ak,voegb',
            authorization: `Bearer ${generateToken({
                'pathfinder-app': {
                    roles: ['voegb:editor', 'ak:admin'],
                },
            })}`,
        });
        atrixACL.setRules([
            {role: 'editor', path: '/pets/242', method: 'get'},
            {role: 'admin', transition: '(*_)', method: '*'},
        ]);
        const res = await svc.test.get('/prefix/pets/242?tenantId=ak').set(headers);

        const allowedLinks = {
            self: {
                href: '/pets/242',
                method: 'get',
            },
            update: {
                href: '/pets/242',
                method: 'patch',
            },
            cancel: {
                href: '/pets/242/cancellation',
                method: 'put',
            },
            'assign:venue:request': {
                href: '/pets/242/venue-requests',
                method: 'post',
            },
            'cancel:speaker': {
                href: '/pets/242/speaker-requests/{requestId}/cancellation',
                method: 'delete',
            },
        };
        expect(res.statusCode).to.equal(200);
        expect(res.body._links).to.eql(allowedLinks); //eslint-disable-line
    });

    it('filters _links based on the resource tenantId - full access for global admin', async () => {
        headers = merge(testHeaders, {
            'x-pathfinder-tenant-ids': 'ak,voegb',
            authorization: `Bearer ${generateToken({
                'pathfinder-app': {
                    roles: ['admin'],
                },
            })}`,
        });
        atrixACL.setRules([
            {role: 'admin', path: '/pets/242', method: 'get'},
            {role: 'admin', transition: '(*_)', method: '*'},
        ]);
        const res = await svc.test.get('/prefix/pets/242?tenantId=ak').set(headers);

        const allowedLinks = {
            self: {
                href: '/pets/242',
                method: 'get',
            },
            update: {
                href: '/pets/242',
                method: 'patch',
            },
            cancel: {
                href: '/pets/242/cancellation',
                method: 'put',
            },
            'assign:venue:request': {
                href: '/pets/242/venue-requests',
                method: 'post',
            },
            'cancel:speaker': {
                href: '/pets/242/speaker-requests/{requestId}/cancellation',
                method: 'delete',
            },
        };
        expect(res.statusCode).to.equal(200);
        expect(res.body._links).to.eql(allowedLinks); //eslint-disable-line
    });

    it('filters _links (hrefs) from response body which are not allowed due to ACLs', async () => {
        const res = await svc.test.get('/prefix/pets/242').set(headers);

        const allowedLinks = {
            self: {
                href: '/pets/242',
                method: 'get',
            },
            update: {
                href: '/pets/242',
                method: 'patch',
            },
            cancel: false,
            'assign:venue:request': false,
            'cancel:speaker': false,
        };
        expect(res.body._links).to.eql(allowedLinks); //eslint-disable-line
        expect(res.statusCode).to.equal(200);
    });

    it('filters _links recursive', async () => {
        const res = await svc.test.get('/prefix/pets/242').set(headers);

        const allowedLinks = {
            self: {
                href: '/pets/242',
                method: 'get',
            },
            update: {
                href: '/pets/242',
                method: 'patch',
            },
            cancel: false,
            'assign:venue:request': false,
            'cancel:speaker': false,
        };
        const allNotAllowed = {
            self: false,
            update: false,
            cancel: false,
            'assign:venue:request': false,
            'cancel:speaker': false,
        };
        expect(res.body._links).to.eql(allowedLinks); //eslint-disable-line
        expect(res.body._embedded.toys[0]._links).to.eql(allowedLinks); //eslint-disable-line
        expect(res.body._embedded.toys[1]._links).to.eql(allNotAllowed); //eslint-disable-line
        expect(res.body._embedded.toys[2]._links).to.eql(allowedLinks); //eslint-disable-line
        expect(res.body._embedded.toys[2]._embedded.toys[0]._links).to.eql(allowedLinks); //eslint-disable-line
        expect(res.body._embedded.toys[2]._embedded.toys[1]._links).to.eql(allNotAllowed); //eslint-disable-line
        expect(res.body._embedded.toys[2]._embedded.toys[2]._links).to.eql(allowedLinks); //eslint-disable-line
        expect(res.body._embedded.beer._links).to.eql(allowedLinks); //eslint-disable-line
        expect(res.body._embedded.beer._embedded.vine._links).to.eql(allowedLinks); //eslint-disable-line
        expect(res.statusCode).to.equal(200);
    });

    describe('with entity ACLs defined', () => {
        it('applies entityACL before filtering each link', async () => {
            atrixACL.setRules([
                {
                    role: 'admin',
                    path: '/pets/:id',
                    method: '*',
                    entity: 'pet',
                },
            ]);
            atrixACL.setEntityACLs([
                {
                    entity: 'pet',
                    id: '42',
                    entityTenantId: 'ak',
                    acl: {
                        tenantId: 'vida',
                    },
                },
            ]);
            const res = await svc.test.get('/prefix/pets/242').set(getHeaders(['vida:admin'], ['vida']));

            const allowedLinks = {
                self: {
                    href: '/pets/42',
                    method: 'get',
                },
                update: {
                    href: '/pets/42',
                    method: 'patch',
                },
                cancel: false,
                'assign:venue:request': false,
                'cancel:speaker': false,
            };
            expect(res.statusCode).to.equal(200);
            expect(res.body._embedded.toys[2]._embedded.toys[3]._links).to.eql(allowedLinks); //eslint-disable-line
        });
    });

    it('filters _links (hrefs + transitions) from response body which are not allowed due to ACLs', async () => {
        atrixACL.setRules([
            {role: 'admin', path: '/pets/242', method: '*'},
            {role: 'admin', transition: 'cancel:speaker', method: '*'},
        ]);
        const res = await svc.test.get('/prefix/pets/242').set(headers);

        const allowedLinks = {
            self: {
                href: '/pets/242',
                method: 'get',
            },
            update: {
                href: '/pets/242',
                method: 'patch',
            },
            cancel: false,
            'assign:venue:request': false,
            'cancel:speaker': {
                href: '/pets/242/speaker-requests/{requestId}/cancellation',
                method: 'delete',
            },
        };
        expect(res.body._links).to.eql(allowedLinks); //eslint-disable-line
        expect(res.statusCode).to.equal(200);
    });

    it('filters _links (hrefs + wildcard transitions) from response body which are not allowed due to ACLs', async () => {
        atrixACL.setRules([
            {role: 'admin', path: '/pets/242', method: '*'},
            {role: 'admin', transition: 'cancel(:*_)', method: '*'},
        ]);
        const res = await svc.test.get('/prefix/pets/242').set(headers);

        const allowedLinks = {
            self: {
                href: '/pets/242',
                method: 'get',
            },
            update: {
                href: '/pets/242',
                method: 'patch',
            },
            cancel: {
                href: '/pets/242/cancellation',
                method: 'put',
            },
            'assign:venue:request': false,
            'cancel:speaker': {
                href: '/pets/242/speaker-requests/{requestId}/cancellation',
                method: 'delete',
            },
        };
        expect(res.body._links).to.eql(allowedLinks); //eslint-disable-line
        expect(res.statusCode).to.equal(200);
    });

    it('filters _links (hrefs + wildcard transitions) from response body array which are not allowed due to ACLs', async () => {
        atrixACL.setRules([
            {role: 'admin', path: '/pets', method: '*'},
            {role: 'admin', path: '/pets/242', method: '*'},
            {role: 'admin', transition: 'cancel(:*_)', method: '*'},
        ]);
        const res = await svc.test.get('/prefix/pets').set(headers);

        const allowedLinks = {
            self: {
                href: '/pets/242',
                method: 'get',
            },
            update: {
                href: '/pets/242',
                method: 'patch',
            },
            cancel: {
                href: '/pets/242/cancellation',
                method: 'put',
            },
            'assign:venue:request': false,
            'cancel:speaker': {
                href: '/pets/242/speaker-requests/{requestId}/cancellation',
                method: 'delete',
            },
        };
        res.body.items.forEach(pet => {
            expect(pet._links).to.eql(allowedLinks); //eslint-disable-line
        });

        expect(res.statusCode).to.equal(200);
    });
});
