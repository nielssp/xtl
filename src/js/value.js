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

exports.evaluate = evaluate;

exports.Value = Value;

function evaluate(env, node) {
    switch (node.type) {
        case 'let-expression':
            // TODO: implement
            break;
        case 'lambda-expression':
            // TODO: implement
            break;
        case 'if-expression':
            var cond = evaluate(env, node.children[0]);
            if (cond.value === true) {
                return evaluate(env, node.children[1]);
            } else {
                return evaluate(env, node.children[2]);
            }
        case 'app-expression':
            // TODO: implement
            break;
        case 'name':
            if (env.has(node.value)) {
                return env.get(node.value);
            }
            node.error = 'Undefined variable';
            break;
        case 'number':
            return Value.Number(parseFloat(node.value));
        case 'string':
            return Value.String(node.value);
        case 'placeholder':
            break;
    }
    return Value.Unit;
}

function Value() {
    
}

Value.Unit = new Value();

Value.Number = function (value) {
    var value = new Value();
    value.value = value;
    return value;
};

Value.String = function (value) {
    this.value = value;
};

Value.Bool = function (value) {
    this.value = value;
};

Value.Function = function (func) {
    this.func = func;
};

function Env(map) {
    this.map = map;
}

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