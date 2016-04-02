var assert = require('chai').assert;

var Type = require('../src/js/type').Type;

describe('Type', function () {
    describe('#ftv', function () {
        it('should contain a union of the free type variables', function () {
            var child1 = {ftv: ['a', 'c']};
            var child2 = {ftv: ['b', 'c']};
            var type = new Type('foo', [child1, child2]);
            assert.sameMembers(['a', 'b', 'c'], type.ftv);
        });
    });
});
