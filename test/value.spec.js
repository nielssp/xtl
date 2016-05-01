var assert = require('chai').assert;

var AstNode = require('../src/js/AstNode');

var value = require('../src/js/value');
var evaluate = value.evaluate;
var Value = value.Value;
var Env = value.Env;

describe('evaluate', function () {
    it('should evaluate literals', function () {
        var number = new AstNode('number', 1.5);
        var value = evaluate(Env.empty, number);
        assert.instanceOf(value, Value.Number);
        assert.strictEqual(value.value, 1.5);
        
        var string = new AstNode('string', "foo bar");
        var value = evaluate(Env.empty, string);
        assert.instanceOf(value, Value.String);
        assert.strictEqual(value.value, "foo bar");
    });
    
    it('should look up variables', function () {
        var variable = new AstNode('name', 'a');
        var env = new Env({a: new Value.String('baz')});
        var value = evaluate(env, variable);
        assert.instanceOf(value, Value.String);
        assert.strictEqual(value.value, "baz");
    });
});
