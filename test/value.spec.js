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

    it('should evaluate let-expressions', function () {
        var letExpr = new AstNode('let-expression');
        var assigns = new AstNode('assigns');
        var assign = new AstNode('assign', 'a');
        assign.addChild(new AstNode('string', 'foo bar baz'));
        assigns.addChild(assign);
        letExpr.addChild(assigns);
        letExpr.addChild(new AstNode('name', 'a'));

        var value = evaluate(Env.empty, letExpr);
        assert.instanceOf(value, Value.String);
        assert.strictEqual(value.value, "foo bar baz");
    });

    it('should evaluate lambda-expressions', function () {
        var lambdaExpr = new AstNode('lambda-expression');
        var param = new AstNode('parameters');
        param.addChild(new AstNode('parameter', 'a'));
        lambdaExpr.addChild(param);
        lambdaExpr.addChild(new AstNode('name', 'a'));

        var abstraction = evaluate(Env.empty, lambdaExpr);
        assert.instanceOf(abstraction, Value.Function);

        var value = abstraction.func.call(null, [new Value.String('baz')]);
        assert.instanceOf(value, Value.String);
        assert.strictEqual(value.value, "baz");
    });

    it('should evaluate if-expressions', function () {
        var ifExpr = new AstNode('if-expression');
        ifExpr.addChild(new AstNode('name', 'a'));
        ifExpr.addChild(new AstNode('string', 'foo'));
        ifExpr.addChild(new AstNode('string', 'bar'));

        var value1 = evaluate(new Env({a: new Value.Bool(true)}), ifExpr);
        assert.instanceOf(value1, Value.String);
        assert.strictEqual(value1.value, "foo");
        
        var value1 = evaluate(new Env({a: new Value.Bool(false)}), ifExpr);
        assert.instanceOf(value1, Value.String);
        assert.strictEqual(value1.value, "bar");

    });

    it('should evaluate app-expressions', function () {
        var env = new Env({
            f: new Value.Function(function (args) {
                assert.instanceOf(args[0], Value.String);
                assert.strictEqual(args[0].value, "foo");
                assert.instanceOf(args[1], Value.String);
                assert.strictEqual(args[1].value, "bar");
                return new Value.String('foobar');
            })
        });
        
        var appExpr = new AstNode('app-expression');
        appExpr.addChild(new AstNode('name', 'f'));
        appExpr.addChild(new AstNode('string', 'foo'));
        appExpr.addChild(new AstNode('string', 'bar'));

        var value = evaluate(env, appExpr);
        assert.instanceOf(value, Value.String);
        assert.strictEqual(value.value, "foobar");
    });
});
