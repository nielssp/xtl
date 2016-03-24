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

module.exports = Editor;

function Editor(element) {
    /**
     * @type {Element}
     */
    this.element = element;

    /**
     * @type {AstNode}
     */
    this.selection = null;

    this.history = [];

    this.handlers = {};
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
    node.updateSymbols();
    var el = document.createElement('div');
    var previous = node.element;
    node.element = el;
    switch (node.type) {
        case 'constant-definition':
            el.className = 'function-definition';
            var kw = document.createElement('div');
            kw.className = 'keyword';
            kw.innerHTML = 'define';
            el.appendChild(kw);
            var name = document.createElement('div');
            name.className = 'name';
            name.innerHTML = node.children[0].value;
            el.appendChild(name);
            el.appendChild(this.render(node.children[1]));
            break;
        case 'function-definition':
            el.className = 'function-definition';
            var kw = document.createElement('div');
            kw.className = 'keyword';
            kw.innerHTML = 'define';
            el.appendChild(kw);
            var name = document.createElement('div');
            name.className = 'name';
            name.innerHTML = node.children[0].value;
            if (node.children[1].children.length > 0) {
                var sig = document.createElement('div');
                sig.className = 'subexpression';
                sig.appendChild(name);
                node.children[1].children.forEach(function (child) {
                    sig.appendChild(this.render(child));
                }, this);
                el.appendChild(sig);
            } else {
                el.appendChild(name);
            }
            el.appendChild(this.render(node.children[2]));
            break;
        case 'typed-paremeters':
        case 'parameters':
        case 'assigns':
        case 'app-expression':
            el.className = node.type;
            node.children.forEach(function (child) {
                el.appendChild(this.render(child));
            }, this);
            break;
        case 'assign':
        case 'typed-parameter':
            el.className = node.type;
            var name = document.createElement('div');
            name.className = 'name';
            name.innerHTML = node.children[0].value;
            el.appendChild(name);
            el.appendChild(this.render(node.children[1]));
            break;
        case 'let-expression':
        case 'lambda-expression':
        case 'if-expression':
            el.className = node.type;
            var kw = document.createElement('div');
            kw.className = 'keyword';
            if (node.type === 'lambda-expression') {
                kw.innerHTML = '&lambda;';
            } else {
                kw.innerHTML = node.type.match(/^([^-]+)-/)[1];
            }
            el.appendChild(kw);
            node.children.forEach(function (child) {
                el.appendChild(this.render(child));
            }, this);
            break;
        case 'name':
            el.className = 'name';
            el.innerHTML = node.value;
            break;
        case 'number':
            el.className = 'literal';
            el.innerHTML = node.value;
            break;
        case 'string':
            el.className = 'literal';
            el.innerHTML = '"' + node.value + '"';
            break;
        case 'function-type':
        case 'applied-type':
            el.className = node.type;
            node.children.forEach(function (child) {
                el.appendChild(this.render(child));
            }, this);
            break;
        case 'placeholder':
            el.className = 'placeholder';
            break;
        default:
            throw 'Undefined node type: ' + node.type;
            
    }
    if (previous !== null && previous.parentNode !== null) {
        previous.parentNode.replaceChild(el, previous);
    }
    var _this = this;
    el.addEventListener('click', function (e) {
        _this.select(node);
        e.stopPropagation();
    });
    if (node.error !== null) {
        var errorEl = document.createElement('div');
        errorEl.className = 'error';
        errorEl.innerHTML = node.error;
        el.className += ' has-error';
        el.appendChild(errorEl);
    }
    return el;
};

Editor.prototype.on = function (name, handler) {
    if (!this.handlers.hasOwnProperty(name)) {
        this.handlers[name] = [];
    }
    this.handlers[name].push(handler);
};

Editor.prototype.trigger = function (event) {
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
 * 
 * @param {AstNode} node
 */
Editor.prototype.select = function (node) {
    if (node === null) {
        return false;
    }
    if (this.selection !== null && this.selection.element !== null) {
        this.trigger({type: 'deselect', node: this.selection});
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
            } else if (pos + 30 > this.element.scrollTop + this.element.clientHeight) {
                this.element.scrollTop = pos - this.element.clientHeight / 2;
            }
        }
    }
    this.trigger({type: 'select', node: node});
    return true;
};

Editor.prototype.do = function (apply, unapply) {
    this.history.push({apply: apply, unapply: unapply});
    apply.call(this);
};

Editor.prototype.undo = function () {
    var action = this.history.pop();
    if (typeof action !== 'undefined') {
        action.unapply.call(this);
    }
};

Editor.prototype.up = function () {
    if (this.selection !== null) {
        this.select(this.selection.parent);
    }
};

Editor.prototype.down = function () {
    if (this.selection !== null) {
        var node = this.selection.getFirstChild();
        this.select(node !== null ? node : this.selection.getNext());
    }
};

Editor.prototype.left = function () {
    if (this.selection !== null) {
        this.select(this.selection.getPreviousDfs());
    }
};

Editor.prototype.right = function () {
    if (this.selection !== null) {
        this.select(this.selection.getNextDfs());
    }
};

Editor.prototype.delete = function () {
    if (this.selection !== null && this.selection.parent !== null) {
        var selection = this.selection;
        var node = new AstNode('placeholder');
        this.do(function () {
            selection.replaceWith(node);
            this.render(node.parent);
            this.select(node);
        }, function () {
            node.replaceWith(selection);
            this.render(selection.parent);
            this.select(selection);
        });
    }
};

Editor.prototype.backspace = function () {
    if (this.selection !== null && this.selection.type === 'number') {
        this.selection.value = this.selection.value.slice(0, -1);
        if (this.selection.value === '') {
            var node = new AstNode('placeholder');
            this.selection.replaceWith(node);
            this.render(node.parent);
            this.select(node);
        } else {
            this.render(this.selection);
            this.select(this.selection);
        }
    }
};

Editor.prototype.number = function (char) {
    if (this.selection !== null && this.selection.parent !== null) {
        var char = char.toString();
        if (this.selection.type === 'number') {
            if (char !== '.' || this.selection.value.indexOf('.') === -1) {
                this.selection.value += char;
                this.render(this.selection);
                this.select(this.selection);
            }
        } else {
            if (char === '.') {
                char = '0.';
            }
            var node = new AstNode('number', char);
            this.selection.replaceWith(node);
            this.render(node.parent);
            this.select(node);
        }
    }
};