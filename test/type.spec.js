var assert = require('chai').assert;

var compose = require('../src/js/type').compose;

var Type = require('../src/js/type').Type;
var TypeVar = require('../src/js/type').TypeVar;

describe('compose', function () {
   it('should apply the substitution', function () {
       var sub1 = {a: new TypeVar('b')};
       var sub2 = {b: Type.Number};
       var result = compose(sub1, sub2);
       assert.equal(result.a, Type.Number);
       assert.property(result, 'b');
   });
});

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
