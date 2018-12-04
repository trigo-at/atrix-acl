/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0, one-var-declaration-per-line: 0, one-var: 0, object-curly-newline: 0, max-len: 0 */

const {expect} = require('chai');
const {merge} = require('ramda');
const svc = require('../service');
const testHeaders = require('../helper/test-headers');
const generateToken = require('../helper/generate-token');

describe('Entity ACLs', () => {
    let atrixACL;

    before(async () => {
        atrixACL = svc.service.plugins.acl;
    });

    beforeEach(async () => {
        atrixACL.setRules([
            {
                role: 'admin',
                method: '*',
                entity: 'event',
                path: '/events/:id(/*_)',
                idParam: 'id',
                tenant: 'gpa',
            },
            {
                role: 'admin',
                method: '*',
                entity: 'budget',
                path: '/events/:id/budget/:bid(/*_)',
                idParam: 'bid',
            },
            {
                role: 'admin',
                method: '*',
                entity: 'budget',
                path: '/persons/:id/budget/:bid(/*_)',
                idParam: 'bid',
            },
            {
                role: 'admin',
                method: '*',
                entity: 'person',
                path: '/persons/:resId(/*_)',
                idParam: 'resId',
            },
        ]);

        atrixACL.setEntityACLs([
            {
                entity: 'event',
                id: '42',
                entityTenantId: 'gpa',
                acl: {
                    tenantId: 'ak',
                    roles: ['special', 'viewer', 'admin'],
                },
            },
            {
                entity: 'budget',
                id: '22',
                entityTenantId: 'ak',
                acl: {
                    tenantId: 'vida',
                    roles: ['sper-event-viewer', 'admin'],
                },
            },
            {
                entity: 'person',
                id: '21',
                entityId: 'ak',
                acl: {
                    tenantId: ['goed'],
                },
            },
        ]);
    });

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

    describe('extending route access', () => {
        it('ACLs with only tenantId copies entityTenantId scoped roles to the schared tenantId scope: "vida:admin" -> "gpa:admin"', async () => {
            atrixACL.setRules([
                {tenant: 'gpa', role: 'admin', method: '*', entity: 'event', path: '/events/:id(/*_)', idParam: 'id'},
            ]);
            atrixACL.setEntityACLs([
                {
                    entity: 'event',
                    id: '42',
                    entityTenantId: 'gpa',
                    acl: {
                        tenantId: 'vida',
                    },
                },
            ]);
            const res = await svc.test.get('/prefix/events/42').set(getHeaders(['vida:admin'], ['vida']));
            expect(res.statusCode).to.equal(200);
        });

        it('ACL with roles = null is handled like ACL without roles ', async () => {
            atrixACL.setRules([
                {tenant: 'gpa', role: 'admin', method: '*', entity: 'event', path: '/events/:id(/*_)', idParam: 'id'},
            ]);
            atrixACL.setEntityACLs([
                {
                    entity: 'event',
                    id: '42',
                    entityTenantId: 'gpa',
                    acl: {
                        tenantId: 'vida',
                        roles: null,
                    },
                },
            ]);
            const res = await svc.test.get('/prefix/events/42').set(getHeaders(['vida:admin'], ['vida']));
            expect(res.statusCode).to.equal(200);
        });

        it('ACLs with role restrictions only copiy entityTenantId scoped roles to the shared tenantId scope when it exists in acl.roles and acl.tenantId scope user roles', async () => {
            atrixACL.setRules([
                {tenant: 'gpa', role: 'admin', method: '*', entity: 'event', path: '/events/:id(/*_)', idParam: 'id'},
            ]);
            atrixACL.setRules([
                {
                    tenant: 'gpa',
                    role: 'viewer',
                    method: '*',
                    entity: 'budget',
                    path: '/events/:eventId/budget/:id',
                    idParam: 'id',
                },
            ]);
            atrixACL.setEntityACLs([
                {
                    entity: 'event',
                    id: '42',
                    entityTenantId: 'gpa',
                    acl: {
                        tenantId: 'vida',
                        roles: ['viewer'],
                    },
                },
                {
                    entity: 'budget',
                    id: '42',
                    entityTenantId: 'gpa',
                    acl: {
                        tenantId: 'vida',
                        roles: ['viewer'],
                    },
                },
            ]);
            expect(
                (await svc.test.get('/prefix/events/42').set(getHeaders(['vida:admin', 'vida:viewer'], ['vida'])))
                    .statusCode
            ).to.equal(401);
            expect(
                (await svc.test
                    .get('/prefix/events/42/budget/42')
                    .set(getHeaders(['vida:admin', 'vida:viewer'], ['vida']))).statusCode
            ).to.equal(200);
        });

        it('All matching ACLs are aplied to the users request context', async () => {
            atrixACL.setRules([
                {tenant: 'gpa', role: 'admin', method: '*', entity: 'event', path: '/events/:id(/*_)', idParam: 'id'},
            ]);
            atrixACL.setEntityACLs([
                {
                    entity: 'event',
                    id: '42',
                    entityTenantId: 'gpa',
                    acl: {
                        tenantId: 'vida',
                    },
                },
                {
                    entity: 'event',
                    id: '42',
                    entityTenantId: 'gpa',
                    acl: {
                        tenantId: 'goed',
                    },
                },
            ]);
            expect(
                (await svc.test.get('/prefix/events/42').set(getHeaders(['vida:admin'], ['vida']))).statusCode
            ).to.equal(200);
            expect(
                (await svc.test.get('/prefix/events/42').set(getHeaders(['goed:admin'], ['goed']))).statusCode
            ).to.equal(200);
        });

        it('correctly matches rule.entity config', async () => {
            atrixACL.setRules([
                {tenant: 'gpa', role: 'admin', method: '*', entity: 'event', path: '/events/:id(/*_)', idParam: 'id'},
            ]);
            atrixACL.setEntityACLs([
                {
                    entity: 'franz',
                    id: '42',
                    entityTenantId: 'gpa',
                    acl: {
                        tenantId: 'vida',
                    },
                },
            ]);
            expect(
                (await svc.test.get('/prefix/events/42').set(getHeaders(['vida:admin'], ['vida']))).statusCode
            ).to.equal(401);
        });

        it('correctly matches rule.idParam config', async () => {
            atrixACL.setRules([
                {
                    tenant: 'gpa',
                    role: 'admin',
                    method: '*',
                    entity: 'event',
                    path: '/events/:eventId(/*_)',
                    idParam: 'eventId',
                },
            ]);
            atrixACL.setEntityACLs([
                {
                    entity: 'event',
                    id: '42',
                    entityTenantId: 'gpa',
                    acl: {
                        tenantId: 'vida',
                    },
                },
            ]);
            expect(
                (await svc.test.get('/prefix/events/42').set(getHeaders(['vida:admin'], ['vida']))).statusCode
            ).to.equal(200);
        });

        it('correctly matches ACL id value config', async () => {
            atrixACL.setRules([
                {
                    tenant: 'gpa',
                    role: 'admin',
                    method: '*',
                    entity: 'event',
                    path: '/events/:eventId(/*_)',
                    idParam: 'eventId',
                },
            ]);
            atrixACL.setEntityACLs([
                {
                    entity: 'event',
                    id: '42',
                    entityTenantId: 'gpa',
                    acl: {
                        tenantId: 'vida',
                    },
                },
            ]);
            expect(
                (await svc.test.get('/prefix/events/42').set(getHeaders(['vida:admin'], ['vida']))).statusCode
            ).to.equal(200);
            expect(
                (await svc.test.get('/prefix/events/43').set(getHeaders(['vida:admin'], ['vida']))).statusCode
            ).to.equal(401);
        });

        it('correctly matches ACL entityTenantId value config', async () => {
            atrixACL.setRules([
                {
                    tenant: 'gpa',
                    role: 'admin',
                    method: '*',
                    entity: 'event',
                    path: '/events/:eventId(/*_)',
                    idParam: 'eventId',
                },
            ]);
            atrixACL.setEntityACLs([
                {
                    entity: 'event',
                    id: '42',
                    entityTenantId: 'goed',
                    acl: {
                        tenantId: 'vida',
                    },
                },
            ]);
            expect(
                (await svc.test.get('/prefix/events/42').set(getHeaders(['vida:admin'], ['vida']))).statusCode
            ).to.equal(401);
        });
    });
});
