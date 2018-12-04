module.exports = (req, reply) =>
    reply({
        resId: req.params.attendeeId,
        _state: 'approval:none|attendance:none|attendee:registered',
        _stateObject: {
            attendee: 'registered',
            approval: 'none',
            attendance: 'none',
        },
        _links: {
            self: {
                href: '/attendees/43443209-7408-4df9-ba56-a3ff7509b699',
                method: 'get',
            },
            update: {
                href: '/attendees/43443209-7408-4df9-ba56-a3ff7509b699',
                method: 'patch',
            },
            cancel: {
                href: '/attendees/43443209-7408-4df9-ba56-a3ff7509b699/cancellation',
                method: 'put',
            },
            invite: {
                href: '/attendees/43443209-7408-4df9-ba56-a3ff7509b699/invitation',
                method: 'put',
            },
            attend: {
                href: '/attendees/43443209-7408-4df9-ba56-a3ff7509b699/attendance',
                method: 'post',
            },
            excuse: {
                href: '/attendees/43443209-7408-4df9-ba56-a3ff7509b699/attendance-excused',
                method: 'post',
            },
            unexcuse: {
                href: '/attendees/43443209-7408-4df9-ba56-a3ff7509b699/attendance-unexcused',
                method: 'post',
            },
            'request:approval': {
                href: '/attendees/43443209-7408-4df9-ba56-a3ff7509b699/approval-request',
                method: 'put',
            },
            'event:cancel': {
                href: '/attendees/43443209-7408-4df9-ba56-a3ff7509b699/event-cancellation',
                method: 'put',
            },
        },
        _embedded: {
            registration: {
                firstName: 'Franz',
                lastName: 'Hyrule',
                roles: [],
                operatives: [],
                memberships: [],
                employments: [],
                contacts: [],
                addresses: [],
                sources: [],
                tenantId: '_all',
                resId: '43443209-7408-4df9-ba56-a3ff7509b699',
                registeredAt: '2017-09-27T08:01:23.527Z',
            },
            event: {
                resId: '8068208f-3515-43ea-ba60-de6d1e4c460d',
                tenantId: 'ak',
                title: 'Test Event',
                description: 'A pretty cool event',
                tags: ['OEGB', 'UNION'],
                capacity: 10,
                waitingListCapacity: 100,
                legacy_courseId: 123,
                legacy: {
                    courseRemark: 'legacy comment',
                },
                _state:
                    'accommodation:none|budget:draft|educational:none|enrollment:open|event:published|organisational:none|schedule:none|speaker:none|venue:none',
                _stateObject: {
                    schedule: 'none',
                    venue: 'none',
                    educational: 'none',
                    organisational: 'none',
                    speaker: 'none',
                    accommodation: 'none',
                    event: 'published',
                    budget: 'draft',
                    enrollment: 'open',
                },
                eventType: {
                    name: 'Seminar',
                    icon: 'graduation - cap',
                    description: 'Seminar aus dem Bildungsangebot',
                    resId: 'EducationEvent',
                },
                attendees: {
                    registrations: 0,
                    attendees: 1,
                    waitinglist: 0,
                    reservedPlaces: 0,
                },
                _links: {
                    self: {
                        href: '/events/8068208f-3515-43ea-ba60-de6d1e4c460d',
                        method: 'get',
                    },
                    update: {
                        href: '/events/8068208f-3515-43ea-ba60-de6d1e4c460d',
                        method: 'patch',
                    },
                    cancel: {
                        href: '/events/8068208f-3515-43ea-ba60-de6d1e4c460d/cancellation',
                        method: 'put',
                    },
                    'assign:venue:request': {
                        href: '/events/8068208f-3515-43ea-ba60-de6d1e4c460d/venue-requests',
                        method: 'post',
                    },
                    'assign:accommodation:request': {
                        href: '/events/8068208f-3515-43ea-ba60-de6d1e4c460d/venue-requests',
                        method: 'post',
                    },
                    'assign:speaker:request': {
                        href: '/events/8068208f-3515-43ea-ba60-de6d1e4c460d/speaker-requests',
                        method: 'post',
                    },
                    'cancel:speaker': {
                        href: '/events/8068208f-3515-43ea-ba60-de6d1e4c460d/speaker-requests/{requestId}/cancellation',
                        method: 'delete',
                        params: {
                            requestId: true,
                        },
                    },
                    'add:registration': {
                        href: '/registrations',
                        method: 'post',
                    },
                    'add:reservation': {
                        href: '/reservations',
                        method: 'post',
                    },
                    'add:attendee': {
                        href: '/attendees',
                        method: 'post',
                    },
                    'add:attendance': {
                        href: '/attendees/{attendeeId}/attendance',
                        method: 'post',
                        params: {
                            attendeeId: true,
                        },
                    },
                    'add:attendance:excused': {
                        href: '/attendees/{attendeeId}/attendance-excused',
                        method: 'post',
                        params: {
                            attendeeId: true,
                        },
                    },
                    'add:attendance:unexcused': {
                        href: '/attendees/{attendeeId}/attendance/attendance-unexcused',
                        method: 'post',
                        params: {
                            attendeeId: true,
                        },
                    },
                    'enrollment:close': {
                        href: '/events/8068208f-3515-43ea-ba60-de6d1e4c460d/enrollment',
                        method: 'delete',
                    },
                    'assign:educational:responsible': {
                        href: '/events/8068208f-3515-43ea-ba60-de6d1e4c460d/responsible-assignations',
                        method: 'post',
                    },
                    'assign:organisational:responsible': {
                        href: '/events/8068208f-3515-43ea-ba60-de6d1e4c460d/responsible-assignations',
                        method: 'post',
                    },
                    'review:budget': {
                        href: '/events/8068208f-3515-43ea-ba60-de6d1e4c460d/budget/review',
                        method: 'post',
                    },
                },
                _embedded: {
                    skills: [],
                    requirements: [],
                    eventVenues: [],
                    eventResponsibles: [],
                    eventSpeakers: [],
                    reservations: [],
                    educationalProgram: null,
                    seminar: null,
                },
                _permissions: {
                    transitions: [
                        'create',
                        'delete',
                        'update',
                        'cancel',
                        'assign:venue:request',
                        'assign:venue:confirm',
                        'cancel:venue',
                        'assign:accommodation:request',
                        'assign:accommodation:confirm',
                        'cancel:accommodation',
                        'assign:first:speaker:request',
                        'assign:speaker:request',
                        'assign:speaker:confirm',
                        'cancel:speaker',
                        'publish',
                        'add:registration',
                        'add:reservation',
                        'add:attendee',
                        'add:attendance',
                        'add:attendance:excused',
                        'add:attendance:unexcused',
                        'enrollment:capacity:reached',
                        'enrollment:open',
                        'enrollment:close',
                        'assign:educational:responsible',
                        'cancel:educational:responsible',
                        'assign:organisational:responsible',
                        'cancel:organisational:responsible',
                        'schedule',
                        'review:budget',
                        'lock:budget',
                        'unlock:budget',
                        'approve:budget',
                        'reject:budget',
                    ],
                    fields: [],
                },
            },
            person: {
                resId: 'edf815f7-9aef-4775-9066-b460a61ddaa7',
                firstName: 'Franz',
                lastName: 'Hyrule',
            },
        },
        _permissions: {
            transitions: [
                'create',
                'update',
                'cancel',
                'invite',
                'attend',
                'excuse',
                'unexcuse',
                'request:approval',
                'confirm:approval',
                'reject:approval',
                'event:cancel',
            ],
            fields: [],
        },
    });
