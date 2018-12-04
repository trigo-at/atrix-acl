'use strict';

/* eslint-env node, mocha */
/* eslint no-unused-expressions: 0, arrow-body-style: 0 */

const {expect} = require('chai');
const extractObjectKeys = require('./extract-object-keys');

describe('extract-object-keys', () => {
    it('simple object', () => {
        expect(extractObjectKeys({a: 'a', b: 'b', c: 'c'}).map(x => x.join('.'))).to.eql(['a', 'b', 'c']);
    });
    it('simple object', () => {
        const r = extractObjectKeys({
            a: 'a',
            b: {
                c: 'c',
                d: {
                    e: 'e',
                },
            },
            c: [
                'a',
                {
                    f: 'f',
                    g: {
                        h: 'h',
                    },
                },
            ],
        });
        expect(r).to.eql([
            ['a'],
            ['b'],
            ['b', 'c'],
            ['b', 'd'],
            ['b', 'd', 'e'],
            ['c'],
            ['c', 0],
            ['c', 1],
            ['c', 1, 'f'],
            ['c', 1, 'g'],
            ['c', 1, 'g', 'h'],
        ]);
    });
});
