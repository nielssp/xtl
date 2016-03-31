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

exports.Type = Type;
exports.infer = infer;

function infer(env, node) {
    switch (node.type) {
        case 'let-expression':
            break;
        case 'lambda-expression':
            break;
        case 'if-expression':
            var cond = infer(env, node.children[0]);
            var cons = infer(env.apply(cond.sub), node.children[1]);
            var alt = infer(env.apply(cons.sub), node.children[2]);
            var sub1 = cond.type.apply(alt.sub).unify('bool');
            var sub2 = cons.type.apply(sub1).unify(alt.apply(sub1));
            return {type: alt.type, sub: compose(alt.sub, sub1, sub2)};
        case 'app-expression':
            break;
        case 'name':
            break;
        case 'number':
            return {type: 'number', sub: {}};
        case 'string':
            return {type: 'string', sub: {}};
        case 'placeholder':
            break;
    }
}

function Type(kind) {
    this.kind = kind;
}

function TypeEnv(map) {
    
}


function apply(type, substitution) {
    switch (type.kind) {
        
    }
}

function unify(typeA, typeB) {
    switch (typeA.kind) {
        
    }
}