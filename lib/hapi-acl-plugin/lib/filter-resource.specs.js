'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0, one-var-declaration-per-line: 0, one-var: 0, no-unused-vars:0, no-console:0, max-len: 0 */

const {expect} = require('chai');
const {clone} = require('ramda');
const filterResource = require('./filter-resource');
// const filterResourceBenchmark = require('./filter-resource-bak');

const requestWithRoles = roles => {
    const request = {headers: {}, payload: '42', log: {debug: () => {}}, auth: {tenantIds: [], roles: []}};
    roles.forEach(r => {
        request.auth.roles.push({
            tenant: r.split(':')[0],
            role: r.split(':')[1],
            global: false,
        });
    });
    request.auth.tenantIds.push(roles[0].split(':')[0]);
    return request;
};

describe('filter-resource', () => {
    const request = {headers: {}, payload: '42', log: {debug: () => {}}};
    const atrixACL = {
        config: {
            acl: {
                tenantIdProperty: 'tenantId',
                aclProperty: '_acl',
                matchAllTenantId: '_all',
                enableNestedDocumentAcls: true,
            },
        },
        fixPath: str => str,
    };

    const filterOptions = {filterHatrLinks: false, filterTenantContext: false};
    describe('value setting and when method', () => {
        it('calls filter when path matches', () => {
            let aPath, aRoot, aValue, aFilter, aReq;

            const when = ({path, root, value, filter, req}) => {
                aPath = path;
                aRoot = root;
                aValue = value;
                aFilter = filter;
                aReq = req;
            };

            const obj = {a: 42};
            const f = {keys: ['a', 'b'], when};
            filterResource(obj, f, atrixACL, request, filterOptions);
            expect(aPath).to.equal('a');
            expect(aRoot).to.eql(obj);
            expect(aValue).to.equal(42);
            expect(aFilter.when).to.equal(f.when);
            expect(aFilter.key).to.equal('a');
            expect(aReq).to.equal(request);
        });

        it('without when function is directly resets the value', () => {
            const obj = {a: 42};
            const f = {keys: 'a', value: 21};
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret.a).to.eql(21);
        });

        it('when "filter.when" returnes "true" it replaces value with "filter.value"', () => {
            const obj = {a: 42};
            const f = {keys: 'a', value: 21, when: () => true};
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret.a).to.eql(21);
        });

        it('can handle replaced properties', () => {
            const obj = {a: {b: 21}};
            const f = {keys: 'a', value: 21, when: ({path}) => path === 'a'};
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: 21});
        });

        it('can handle removed properties', () => {
            const obj = {a: {b: 21}};
            const f = {keys: 'a', value: undefined, when: ({path}) => path === 'a'};
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({});
        });

        it('does not reevaluate already replaced paths', () => {
            const obj = {a: {b: 21}};
            const f = {keys: '*', value: {b: 'desdo'}, when: () => true};
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: {b: 'desdo'}});
        });

        it('removes all undefineds, even deeply nested', () => {
            const obj = {a: {b: 21}, b: 42, c: {d: {b: 63, dd: 84}}};
            const f = {keys: '*.b', value: undefined, when: () => true};
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: {}, c: {d: {dd: 84}}});
        });

        it('should be able to handle empty arrays', () => {
            const obj = {a: []};
            const f = {keys: '*.b', value: undefined, when: () => true};
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: []});
        });

        it('traverses the full object', () => {
            const obj = {a: {foo: 21}, b: {foo: {bar: 42}}};
            const f = {
                keys: '*',
                value: undefined,
                when: ({value, path}) => {
                    console.log(path);
                    return value === 42;
                },
            };
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: {foo: 21}, b: {foo: {}}});
        });

        it('traverses the full object with multiple filters', () => {
            const obj = {a: {foo: {x: 21}}};
            const f = [
                {
                    keys: '*.foo.bar',
                    value: undefined,
                    when: ({value, path}) => value === 42,
                },
                {
                    keys: '*',
                    value: undefined,
                    when: ({value, path}) => value === 42,
                },
                {
                    keys: '*',
                    value: undefined,
                    when: ({value, path}) => value === 21,
                },
            ];
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: {foo: {}}});
        });

        it('should execute wildcard filters even if there are prefix wildcard filters', () => {
            const obj = {a: {b: {c: 21}}, d: 42};
            const f = [
                {
                    keys: '*.c',
                    value: undefined,
                    when: ({value, path}) => value === 21,
                },
                {
                    keys: '*',
                    value: undefined,
                    when: ({value, path}) => value === 42,
                },
            ];
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: {b: {}}});
        });

        it('provides full property path to the when method', () => {
            const obj = {a: {foo: 21}, b: {foo: {bar: 42}}};
            const f = {
                keys: '*',
                value: undefined,
                when: ({path}) => {
                    if (path.match(/(a.foo)/)) return true;
                    return false;
                },
            };
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: {}, b: {foo: {bar: 42}}});
        });

        it('can handle filter array', () => {
            const obj = {a: 1, b: 2, c: 3, d: 4};
            const f = [
                {keys: '*', value: undefined, when: ({value}) => value === 1},
                {keys: '*', value: undefined, when: ({value}) => value === 3},
            ];
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({b: 2, d: 4});
        });

        it('can handle nested filter array', () => {
            const obj = {a: 1, b: 2, c: 3, d: {da: 1, db: 2}};
            const f = [
                {keys: 'd.*', value: undefined, when: ({value}) => value === 1},
                {keys: '*', value: undefined, when: ({value}) => value === 3},
            ];
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: 1, b: 2, d: {db: 2}});
        });

        it('arrays behave like values', () => {
            const obj = {a: [{v: 1}, {v: 2}, {v: 3}]};
            const f = [
                {
                    keys: 'a',
                    value: undefined,
                    when: ({value}) => {
                        console.log(value);
                        return value.v === 2;
                    },
                },
            ];

            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: [{v: 1}, {v: 3}]});
        });

        it('should filter deep deep stuff with "*._acl" and multiple filters', () => {
            const obj = {
                tenantId: 't1',
                speaker: {
                    fees: [
                        {
                            tenantId: 't1',
                            name: 'f1',
                            _acl: {
                                foo: 'bar',
                            },
                        },
                        {
                            tenantId: 't2',
                            name: 'f1',
                            _acl: {
                                foo: 'bar',
                            },
                        },
                    ],
                },
            };
            const f = [
                {keys: '*._acl', value: undefined, when: ({value}) => true},
                {keys: 'speaker', value: undefined, when: ({value}) => false},
            ];
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({
                tenantId: 't1',
                speaker: {
                    fees: [
                        {
                            tenantId: 't1',
                            name: 'f1',
                        },
                        {
                            tenantId: 't2',
                            name: 'f1',
                        },
                    ],
                },
            });
        });
    });

    describe('deep property filtering', () => {
        const obj = {
            a: {
                b: {
                    c: 21,
                    d: 42,
                },
            },
            b: {
                c: 63,
            },
        };

        it('can handle multiple keys', () => {
            const f = {keys: ['*.a', 'b.*', 'c', '*.d'], value: undefined, when: () => false};
            const ret = filterResource(clone(obj), f, atrixACL, request, filterOptions);
            expect(ret).to.eql(obj);
        });

        it('can handle deep keys', () => {
            const f = {keys: 'a.b', value: undefined};
            const ret = filterResource(clone(obj), f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: {}, b: {c: 63}});
        });

        it('can handle deep keys in subtree', () => {
            const f = {keys: 'b.c', value: undefined};
            const ret = filterResource(clone(obj), f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: {b: {c: 21, d: 42}}, b: {}});
        });

        it('can handle deep keys with wildcard prefix', () => {
            const f = {keys: '*.b.c', value: undefined};
            const ret = filterResource(clone(obj), f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: {b: {d: 42}}, b: {}});
        });

        it('can handle keys with wildcard prefix and suffix "*.b.*" act as "path contains" filters', () => {
            const f = {keys: '*.b.*', value: undefined};
            const ret = filterResource(clone(obj), f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: {}});
        });

        it('can handle keys with wildcard suffix "b.*" - match all keys below, ignoring', () => {
            const f = {keys: 'b.*', value: undefined};
            const ret = filterResource(clone(obj), f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: {b: {c: 21, d: 42}}, b: {}});
        });

        it('can handle objects inside arrays', () => {
            const o = {a: {b: [1, 2, 3, {c: {d: 42}}, 4]}};
            const f = {keys: '*.c.d', value: undefined, when: v => v.value === 42};
            const ret = filterResource(o, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: {b: [1, 2, 3, {c: {}}, 4]}});
        });
    });

    describe('array filtering', () => {
        it('removes filtered array values when set to "undefined"', () => {
            const obj = {
                a: [11, 21, 42, 12],
                gg: {
                    h: [11, 31, 42, 23, 42],
                },
            };
            const f = {keys: '*', value: undefined, when: ({value}) => typeof value === 'number' && value !== 42};
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({
                a: [42],
                gg: {
                    h: [42, 42],
                },
            });
        });

        it('removes filtered array values in nested arrays hen set to undfined', () => {
            const obj = {
                a: [11, 21, 42, 12],
                gg: {
                    h: [
                        11,
                        31,
                        42,
                        {
                            ii: [42, 12, 32, 42, 12],
                        },
                        42,
                    ],
                },
            };
            const f = {keys: '*', value: undefined, when: ({value}) => typeof value === 'number' && value !== 42};
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({
                a: [42],
                gg: {
                    h: [
                        42,
                        {
                            ii: [42, 42],
                        },
                        42,
                    ],
                },
            });
        });

        it('does not remove filtered array values when set to anything but "undefined"', () => {
            const obj = {a: [11, 21, 42]};
            const f = {keys: '*', value: 42, when: ({value}) => value === 21};
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret.a).to.eql([11, 42, 42]);
        });

        it('respects array names', () => {
            const obj = {a: [1, 2, 3], b: [4, 5, 6], c: [7], d: [8]};
            const f = {keys: ['*.b', 'c', 'd'], value: undefined, when: () => true};
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({a: [1, 2, 3]});
        });

        it('can filter top level arrays', () => {
            const obj = [{a: 11, b: 22}, {b: 22}];
            const f = {keys: 'a', value: undefined, when: () => true};
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql([{b: 22}, {b: 22}]);
        });

        it('provides correct path to match function for top level arrays', () => {
            const obj = [{a: {aa: 1}, b: {bb: 2}}, {b: {bb: 3}}];
            const f = {keys: '*', value: undefined, when: ({path}) => path === 'a'};
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql([{b: {bb: 2}}, {b: {bb: 3}}]);
        });

        it('can kill array elements by value', () => {
            const obj = {arr: [{a: 11, b: 22}, {c: 33}]};
            const f = {keys: 'arr.*', value: undefined, when: ({value}) => value.a === 11};
            const ret = filterResource(obj, f, atrixACL, request, filterOptions);
            expect(ret).to.eql({arr: [{c: 33}]});
        });
    });

    describe('tenantContextFilter', () => {
        it('filters based on "tenantId" property', () => {
            const obj = {
                a: {
                    tenantId: 'ak',
                    sub: {
                        tenantId: 'goed',
                    },
                },
                b: {
                    tenantId: 'voegb',
                },
            };

            const ret = filterResource(obj, null, atrixACL, requestWithRoles(['ak:admin', 'goed:admin']), {
                filterHatrLinks: false,
                filterTenantContext: true,
            });
            expect(ret).to.eql({a: {tenantId: 'ak'}});
        });

        it('filters based on "tenantId" property resepecting "_acl.tenantIds"', () => {
            const obj = {
                a: {
                    tenantId: 'ak',
                    sub: {
                        tenantId: 'goed',
                    },
                },
                b: {
                    tenantId: 'voegb',
                    _acl: {
                        tenantIds: ['ak'],
                    },
                },
            };

            const ret = filterResource(obj, null, atrixACL, requestWithRoles(['ak:admin', 'goed:admin']), {
                filterHatrLinks: false,
                filterTenantContext: true,
            });
            expect(ret).to.eql({a: {tenantId: 'ak'}, b: {tenantId: 'voegb', _acl: {tenantIds: ['ak']}}});
        });
    });

    describe.skip('benchmarks', () => {
        let o;
        beforeEach(() => {
            o = require('../../../specs/testdata/huge.json');
            console.log(Object.keys(o));
        });

        // it('should perform', () => {
        // const f = { keys: ['*._embedded', '*.legacy', '*.a', '*.b', '*.c', '*.d', '*.e', '*.f', '*.g', '*.h', 'i.*', '_shards.*', 'timed_out'], when: () => false };
        // filterResource(o, f, false, null, request);
        // });
        // it('should perform', () => {
        // const f = { keys: ['*._embedded', '*.legacy', '*.a', '*.b', '*.c', '*.d', '*.e', '*.f', '*.g', '*.h', 'i.*', '_shards.*', 'timed_out'], when: () => false };
        // filterResource(o, f, false, null, request);
        // });

        // it('should perform (benchmark)', () => {
        // const f = { keys: ['*._embedded', '*.legacy', '*.a', '*.b', '*.c', '*.d', '*.e', '*.f', '*.g', '*.h', 'i.*', '_shards.*', 'timed_out'], when: () => true };
        // filterResourceBenchmark(o, f, false, null, request);
        // });

        // it('should perform (benchmark)', () => {
        // const f = { keys: ['*._embedded', '*.legacy', '*.a', '*.b', '*.c', '*.d', '*.e', '*.f', '*.g', '*.h', 'i.*', '_shards.*', 'timed_out'], when: () => true };
        // filterResourceBenchmark(o, f, false, null, request);
        // });

        // it('should perform', () => {
        // const f = { keys: ['*._embedded', '*.legacy', '*.a', '*.b', '*.c', '*.d', '*.e', '*.f', '*.g', '*.h', 'i.*', '_shards.*', 'timed_out'], when: () => false };
        // filterResource(o, f, false, null, request);
        // });

        // it('should perform (benchmark)', () => {
        // const f = { keys: ['*._embedded', '*.legacy', '*.a', '*.b', '*.c', '*.d', '*.e', '*.f', '*.g', '*.h', 'i.*', '_shards.*', 'timed_out'], when: () => true };
        // filterResourceBenchmark(o, f, false, null, request);
        // });

        // it('should perform', () => {
        // const f = { keys: ['*._embedded', '*.legacy', '*.a', '*.b', '*.c', '*.d', '*.e', '*.f', '*.g', '*.h', 'i.*', '_shards.*', 'timed_out'], when: () => false };
        // filterResource(o, f, false, null, request);
        // });
    });
});
