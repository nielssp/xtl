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
}

/**
 * Replace a child with another node.
 * 
 * @param {AstNode} child
 * @param {AstNode} replacement
 */
AstNode.prototype.replace = function (child, replacement) {
    this.children[this.children.indexOf(child)] = replacement;
    replacement.parent = this;
    child.parent = null;
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
 * Add a child node.
 * 
 * @param {AstNode} node
 */
AstNode.prototype.addChild = function (node) {
    node.parent = this;
    this.children.push(node);
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