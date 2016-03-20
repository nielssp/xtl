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

var AstNode = require('./AstNode');

exports.Editor = Editor;

function Editor(element) {
    /**
     * @type {Element}
     */
    this.element = element;
    
    /**
     * @type {AstNode}
     */
    this.selection = null;
}

Editor.prototype.setRoot = function (node) {
    this.element.innerHTML = '';
    this.element.appendChild(this.render(node));
};

/**
 * 
 * @param {AstNode} node
 * @returns {Element}
 */
Editor.prototype.render = function (node) {
    var el = document.createElement('div');
    var previous = node.element;
    node.element = el;
    switch (node.type) {
        case 'definition':
            el.className = 'function-definition';
            var kw = document.createElement('div');
            kw.className = 'keyword';
            kw.innerHTML = 'function';
            el.appendChild(kw);
            node.children.forEach(function (child) {
                el.appendChild(this.render(child));
            }, this);
            break;
        case 'parameters':
            el.className = 'subexpression';
            node.children.forEach(function (child) {
                el.appendChild(this.render(child));
            }, this);
            break;
        case 'macro':
            el.className = 'expression';
            var kw = document.createElement('div');
            kw.className = 'keyword';
            kw.innerHTML = node.value;
            el.appendChild(kw);
            node.children.forEach(function (child) {
                el.appendChild(this.render(child));
            }, this);
            break;
        case 'expression':
            el.className = 'expression';
            node.children.forEach(function (child) {
                el.appendChild(this.render(child));
            }, this);
            break;
        case 'placeholder':
            el.className = 'placeholder';
            break;
        case 'id':
            el.className = 'id';
            el.innerHTML = node.value;
            break;
        case 'integer':
            el.className = 'literal';
            el.innerHTML = node.value;
            break;
    }
    if (previous !== null && previous.parentNode !== null) {
        previous.parentNode.replaceChild(el, previous);
    }
    var _this = this;
    el.addEventListener('click', function (e) {
        _this.select(node);
        e.stopPropagation();
    });
    return el;  
};

/**
 * 
 * @param {AstNode} node
 */
Editor.prototype.select = function (node) {
    if (node === null) {
        return false;
    }
    if (this.selection !== null && this.selection.element !== null) {
        this.selection.element.id = '';
    }
    this.selection = node;
    if (this.selection.element !== null) {
        this.selection.element.id = 'ast-selection';
        var pos = 0;
        var obj = this.selection.element;
        if (obj.offsetParent) {
            do {
                pos += obj.offsetTop;
            } while (obj = obj.offsetParent);
            if (pos < this.element.scrollTop) {
                this.element.scrollTop = pos - this.element.clientHeight / 2;
            } else if (pos + 30> this.element.scrollTop + this.element.clientHeight) {
                this.element.scrollTop = pos - this.element.clientHeight / 2;
            }
        }
    }
    return true;
};