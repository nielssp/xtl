/* 
 * Copyright (C) 2016 Niels Sonnich Poulsen (http://nielssp.dk)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var _ = require('underscore');

exports.evaluate = evaluate;

exports.Value = Value;

exports.Env = Env;

function evaluate(env, node) {
    switch (node.type) {
        case 'let-expression':
            var assigns = node.children[0];
            var body = node.children[1];
            for (var i = 0; i < assigns.children.length; i++) {
                var assign = assigns.children[i];
                env = env.updated(assign.value, evaluate(env, assign.children[0]));
            }
            return evaluate(env, body);
        case 'lambda-expression':
            var parameters = node.children[0].children;
            var body = node.children[1];
            return Function(function(arguments) {
                var newEnv = env;
                _.each(_.zip(parameters, arguments), function(parArg) {
                    newEnv = newEnv.updated(parArg[0].value, parArg[1]);
                });
                return evaluate(newEnv, body);
            });
        case 'if-expression':
            var cond = evaluate(env, node.children[0]);
            if (cond.value === true) {
                return evaluate(env, node.children[1]);
            } else {
                return evaluate(env, node.children[2]);
            }
        case 'app-expression':
            var callee = evaluate(env, node.children[0]);
            var arguments = [];
            for (var i = 1; i < node.children.length; i++) {
                arguments.push(evaluate(env, node.children[i]));
            }
            // TODO: check type
            return callee.func.call(null, arguments);
            break;
        case 'name':
            if (env.has(node.value)) {
                return env.get(node.value);
            }
            node.error = 'Undefined variable';
            break;
        case 'number':
            return new Value.Number(parseFloat(node.value));
        case 'string':
            return new Value.String(node.value);
        case 'placeholder':
            break;
    }
    return Value.Unit;
}

function Value() {
    
}

Value.Unit = new Value();

Value.Number = function (value) {
    Value.call(this);
    this.value = value;
};
Value.Number.prototype = Object.create(Value.prototype);
Value.Number.prototype.constructor = Value.Number;

Value.String = function (value) {
    Value.call(this);
    this.value = value;
};
Value.String.prototype = Object.create(Value.prototype);
Value.String.prototype.constructor = Value.String;

Value.Bool = function (value) {
    Value.call(this);
    this.value = value;
};
Value.Bool.prototype = Object.create(Value.prototype);
Value.Bool.prototype.constructor = Value.Bool;

Value.Function = function (func) {
    Value.call(this);
    this.func = func;
};
Value.Function.prototype = Object.create(Value.prototype);
Value.Function.prototype.constructor = Value.Function;

function Env(map) {
    this.map = map;
}

Env.empty = new Env({});

Env.prototype.get = function (name) {
    return this.map[name];
};

Env.prototype.has = function (name) {
    return this.map.hasOwnProperty(name);
};

Env.prototype.updated = function (name, type) {
    var env = new Env(_.clone(this.map));
    env.map[name] = type;
    return env;
};
