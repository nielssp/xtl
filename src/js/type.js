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

exports.Type = Type;
exports.TypeVar = TypeVar;
exports.infer = infer;
exports.compose = compose;

var typeVarCounter = 0;

function newTypeVar(prefix) {
    typeVarCounter++;
    return new TypeVar(prefix + typeVarCounter);
}

function infer(env, node) {
    switch (node.type) {
        case 'let-expression':
            var v = newTypeVar('t');
            break;
        case 'lambda-expression':
            break;
        case 'if-expression':
            var cond = infer(env, node.children[0]);
            var cons = infer(env.apply(cond.sub), node.children[1]);
            var alt = infer(env.apply(cons.sub), node.children[2]);
            var sub1 = cond.type.apply(alt.sub).unify(Type.Bool);
            var sub2 = cons.type.apply(sub1).unify(alt.apply(sub1));
            return {type: alt.type, sub: compose(alt.sub, sub1, sub2)};
        case 'app-expression':
            break;
        case 'name':
            break;
        case 'number':
            return {type: Type.Number, sub: {}};
        case 'string':
            return {type: Type.String, sub: {}};
        case 'placeholder':
            break;
    }
}

function compose(sub1, sub2) {
    var sub = {};
    _.map(arguments, function (subp) {
        sub = _.mapObject(sub, function (type, key) {
            return type.apply(subp);
        });
        sub = _.extend(sub, subp);
    });
    return sub;
}

function TypeVar(name) {
    this.name = name;
}

TypeVar.prototype.toString = function () {
    return this.name;
};

TypeVar.prototype.apply = function (sub) {
    if (_.has(sub, this.name)) {
        return sub[this.name];
    }
    return this;
};

function Type(tag, children) {
    this.tag = tag;
    this.children = typeof children === 'undefined' ? [] : children;
    
    this.ftv = _.union.apply(_, _.pluck(this.children, 'ftv'));
}

Type.Number = new Type('number');

Type.Bool = new Type('bool');

Type.String = new Type('string');

Type.Unit = new Type('unit');

Type.Io = function (t) {
    return new Type('io', [t]);
};

Type.Function = function (t1, t2) {
    return new Type('->', [t1, t2]);
};

Type.prototype.toString = function () {
    if (this.children.length === 0) {
        return this.tag;
    }
    return '(' + this.tag + ' ' + this.children.map(function (c) {
        return c.toString();
    }).join(' ') + ')';
};

Type.prototype.apply = function (sub) {
    return new Type(this.tag, _.map(this.children, function (type) {
        return type.apply(sub);
    }));
};

Type.prototype.unify = function (other) {
    if (other instanceof TypeVar) {
        if (_.contains(this.ftv, other.name)) {
            throw new Error('occurs check failed: ' + other.name + ' vs ' + this.toString());
        }
        var sub = {};
        sub[other.name] = this;
        return sub;
    }
    if (other instanceof Type && other.tag === this.tag) {
        if (other.children.length === this.children.length) {
            var sub = {};
            for (var i = 0; i < this.children.length; i++) {
                sub = compose(sub, this.children[i].apply(sub).unify(other.children[i].apply(sub)));
            }
            return sub;
        }
    }
    throw new Error('types do not unify: ' + this.toString() + ' vs ' + other.toString());
};

function TypeScheme(names, type) {
    this.names = names;
    
    this.type = type;
    
    this.ftv = _.difference(type.ftv, names);
}

TypeScheme.prototype.apply = function (sub) {
    return new TypeScheme(this.name, this.type.apply(_.omit(sub, this.names)));
};

function TypeEnv(map) {
    this.map = map;
}

TypeEnv.prototype.apply = function (sub) {
    return new TypeEnv(_.mapObject(this.map, function (type) {
        return type.apply(sub);
    }));
};

TypeEnv.prototype.get = function (name) {
    return this.map[name];
};

TypeEnv.prototype.has = function (name) {
    return this.map.hasOwnProperty(name);
};

TypeEnv.prototype.updated = function (name, type) {
    var env = new TypeEnv(_.clone(this.map));
    env.map[name] = type;
    return env;
};