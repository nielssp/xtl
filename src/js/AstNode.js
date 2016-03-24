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

module.exports = AstNode;

/**
 * An abstract syntax tree node.
 * 
 * @class
 * @param {string} type
 * @param {*} [value]
 */
function AstNode(type, value) {
    /**
     * @type {string}
     */
    this.type = type;

    /**
     * @type {*}
     */
    this.value = value;

    /**
     * @type {Type}
     */
    this.typeAnnotation = null;
    
    /**
     * @type {?string}
     */
    this.error = null;

    /**
     * @type {Element}
     */
    this.element = null;

    /**
     * @type {?AstNode}
     */
    this.parent = null;

    /**
     * @type {AstNode[]}
     */
    this.children = [];

    this.handlers = {};
    
    this.symbols = {};
}

AstNode.prototype.on = function (name, handler) {
    if (!this.handlers.hasOwnProperty(name)) {
        this.handlers[name] = [];
    }
    this.handlers[name].push(handler);
};

AstNode.prototype.trigger = function (event) {
    if (this.handlers.hasOwnProperty(event.type)) {
        this.handlers[event.type].forEach(function (handler) {
            if (handler.call(this, event) === false) {
                return false;
            }
        });
    }
    return true;
};

/**
 * Replace a child with another node.
 * 
 * @param {AstNode} child
 * @param {AstNode} replacement
 */
AstNode.prototype.replace = function (child, replacement) {
    this.children[this.children.indexOf(child)] = replacement;
    replacement.detach();
    child.detach();
    replacement.parent = this;
};

/**
 * Add a child node.
 * 
 * @param {AstNode} node
 */
AstNode.prototype.addChild = function (node) {
    node.detach();
    node.parent = this;
    this.children.push(node);
};

AstNode.prototype.removeChild = function (node) {
    var index = this.children.indexOf(node);
    if (index >= 0) {
        this.children.splice(index, 1);
        node.parent = null;
    }
};

AstNode.prototype.indexOf = function (node) {
    return this.children.indexOf(node);
};

AstNode.prototype.nodeAt = function (index) {
    return this.children[index];
};

AstNode.prototype.insert = function (index, node) {
    node.detach();
    node.parent = this;
    this.children = this.children.slice(0, index).concat(
        node,
        this.children.slice(index)
    );
};

AstNode.prototype.detach = function () {
    if (this.parent !== null) {
        this.parent.removeChild(this);
        this.parent = null;
    }
};

function extend(obj, extension) {
    for (var key in extension) {
        if (extension.hasOwnProperty(key)) {
            obj[key] = extension[key];
        }
    }
    return obj;
}

AstNode.prototype.updateSymbols = function () {
    if (this.parent === null) {
        this.symbols = {};
    } else {
        this.symbols = extend({}, this.parent.symbols);
    }
    switch (this.type) {
        case 'let-expression':
            this.children[0].children.forEach(function (assignment) {
                this.symbols[assignment.value] = assignment;
            }, this);
            break;
        case 'lambda-expression':
            this.children[0].children.forEach(function (parameter) {
                this.symbols[parameter.value] = parameter;
            }, this);
            break;
        case 'function-definition':
            this.children[1].children.forEach(function (typedParameter) {
                this.symbols[typedParameter.value] = typedParameter;
            }, this);
            break;
    }
    this.children.forEach(function (node) {
        node.updateSymbols();
    });
};

AstNode.prototype.getNextFreeSymbol = function () {
    var name = 'a';
    while (this.symbols.hasOwnProperty(name)) {
        var code = name.charCodeAt(name.length - 1) + 1;
        if (code <= 122) {
            name = name.slice(0, name.length - 1) + String.fromCharCode(code);
        } else {
            throw 'not implemented';
        }
    }
    return name;
};

AstNode.prototype.substitute = function (symbol, substitution) {
    switch (this.type) {
        case 'name':
            if (this.value === symbol) {
                this.value = substitution;
            }
            break;
        case 'let-expression':
        case 'lambda-expression':
            if (this.children[0].children.some(function (parameter) {
                return parameter.value === symbol;
            })) {
                return;
            }
            break;
        case 'function-definition':
            if (this.children[1].children.some(function (parameter) {
                return parameter.value === symbol;
            })) {
                return;
            }
            break;
    }
    this.children.forEach(function (node) {
        node.substitute(symbol, substitution);
    });
};

AstNode.prototype.isExpression = function () {
    switch (this.type) {
        case 'let-expression':
        case 'if-expression':
        case 'lambda-expression':
        case 'app-expression':
        case 'name':
        case 'number':
        case 'string':
        case 'placeholder':
            return true;
    }
    return false;
};

AstNode.prototype.isFixed = function () {
    if (this.parent === null) {
        return true;
    }
    switch (this.type) {
        case 'typed-parameters':
        case 'parameters':
        case 'assigns':
            return true;
    }
    return false;
};

/**
 * Replace this node with another node.
 * 
 * @param {AstNode} node
 */
AstNode.prototype.replaceWith = function (node) {
    if (this.parent !== null) {
        this.parent.replace(this, node);
    }
};

/**
 * Get next sibling node.
 * 
 * @returns {?AstNode}
 */
AstNode.prototype.getNext = function () {
    if (this.parent !== null) {
        var id = this.parent.children.indexOf(this) + 1;
        if (id < this.parent.children.length) {
            return this.parent.children[id];
        }
    }
    return null;
};

/**
 * Get previous sibling node.
 * 
 * @returns {?AstNode}
 */
AstNode.prototype.getPrevious = function () {
    if (this.parent !== null) {
        var id = this.parent.children.indexOf(this) - 1;
        if (id >= 0) {
            return this.parent.children[id];
        }
    }
    return null;
};

/**
 * Get next node in a depth-first search of the AST.
 * 
 * @returns {?AstNode}
 */
AstNode.prototype.getNextDfs = function () {
    var next = this.getFirstChild();
    if (next !== null) {
        return next;
    }
    var node = this;
    while (node.parent !== null) {
        next = node.getNext();
        if (next !== null) {
            return next;
        }
        node = node.parent;
    }
    return null;
};

/**
 * Get previous node in a depth-first search of the AST.
 * 
 * @returns {?AstNode}
 */
AstNode.prototype.getPreviousDfs = function () {
    if (this.parent === null) {
        return null;
    }
    var id = this.parent.children.indexOf(this) - 1;
    if (id < 0) {
        return this.parent;
    }
    var node = this.parent.children[id];
    while (node.children.length > 0) {
        node = node.children[node.children.length - 1];
    }
    return node;
};

/**
 * Get the first child.
 * 
 * @returns {?AstNode}
 */
AstNode.prototype.getFirstChild = function () {
    if (this.children.length > 0) {
        return this.children[0];
    }
    return null;
};