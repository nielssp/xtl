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

    this.undoHistory = [];

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
    if (this.selection === node) {
        el.id = 'ast-selection';
    }
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
            name.innerHTML = node.value;
            el.appendChild(name);
            el.appendChild(this.render(node.children[0]));
            break;
        case 'function-definition':
            el.className = 'function-definition';
            var kw = document.createElement('div');
            kw.className = 'keyword';
            kw.innerHTML = 'define';
            el.appendChild(kw);
            var name = document.createElement('div');
            name.className = 'name';
            name.innerHTML = node.value;
            if (node.children[0].children.length > 0) {
                var sig = document.createElement('div');
                sig.className = 'subexpression';
                sig.appendChild(name);
                node.children[0].children.forEach(function (child) {
                    sig.appendChild(this.render(child));
                }, this);
                el.appendChild(sig);
            } else {
                el.appendChild(name);
            }
            el.appendChild(this.render(node.children[1]));
            break;
        case 'typed-paremeters':
        case 'parameters':
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
            name.innerHTML = node.value;
            el.appendChild(name);
            el.appendChild(this.render(node.children[0]));
            break;
        case 'let-expression':
            el.className = node.type;
            var kw = document.createElement('div');
            kw.className = 'keyword';
            kw.innerHTML = 'let';
            el.appendChild(kw);
            var assigns = document.createElement('div');
            assigns.className = 'assigns';
            node.children[0].children.forEach(function (assign) {
                assigns.appendChild(this.render(assign));
            }, this);
            el.appendChild(assigns);
            el.appendChild(this.render(node.children[1]));
            break;
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
        case 'parameter':
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
            throw 'Undefined or unexpected node type: ' + node.type;

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
    if (node === null || node.element === null) {
        console.debug('Unselectable:', node);
        return false;
    }
    console.debug('Select node:', node);
    if (this.selection !== null && this.selection.element !== null) {
        if (this.selection.type === 'number') {
            if (this.selection.value[this.selection.value.length - 1] === '.') {
                this.selection.value = this.selection.value.slice(0, this.selection.value.length - 1);
                this.render(this.selection);
            }
        }
        this.trigger({type: 'deselect', node: this.selection});
        this.selection.element.id = '';
    }
    this.selection = node;
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
    this.trigger({type: 'select', node: node});
    return true;
};

Editor.prototype.do = function (apply, unapply) {
    this.history.push({apply: apply, unapply: unapply});
    this.undoHistory = [];
    apply.call(this);
};

Editor.prototype.editName = function (node, element, callback) {
    var input = document.createElement('input');
    input.type = 'text';
    input.value = node.value;
    element.innerHTML = '';
    element.appendChild(input);
    input.focus();
    var done = false;
    var finish = function () {
        if (!done) {
            done = true;
            input.parentNode.removeChild(input);
            callback(input.value);
        }
    };
    input.addEventListener('blur', finish);
    input.addEventListener('keydown', function (e) {
        if (e.keyCode === 13) {
            finish();
        }
    });
};

Editor.prototype.undo = function () {
    var action = this.history.pop();
    if (typeof action !== 'undefined') {
        action.unapply.call(this);
        this.undoHistory.push(action);
    }
};

Editor.prototype.redo = function () {
    var action = this.undoHistory.pop();
    if (typeof action !== 'undefined') {
        action.apply.call(this);
        this.history.push(action);
    }
};

Editor.prototype.up = function () {
    if (this.selection !== null) {
        var node = this.selection;
        do {
            node = node.parent;
        } while (node !== null && !this.select(node));
    }
};

Editor.prototype.down = function () {
    if (this.selection !== null) {
        var node = this.selection;
        do {
            node = node.getFirstChild();
        } while (node !== null && !this.select(node));
    }
};

Editor.prototype.left = function () {
    if (this.selection !== null) {
        var node = this.selection;
        do {
            node = node.getPreviousDfs();
        } while (node !== null && !this.select(node));
    }
};

Editor.prototype.right = function () {
    if (this.selection !== null) {
        var node = this.selection;
        do {
            node = node.getNextDfs();
        } while (node !== null && !this.select(node));
    }
};

Editor.prototype.delete = function () {
    if (this.selection !== null && !this.selection.isFixed()) {
        var selection = this.selection;
        switch (selection.type) {
            case 'assign':
            case 'parameter':
                var assigns = selection.parent;
                var letExpression = assigns.parent;
                var body = letExpression.children[1];
                var index = assigns.indexOf(selection);
                this.do(function () {
                    assigns.removeChild(selection);
                    if (assigns.children.length > 0) {
                        this.render(letExpression);
                        this.select(assigns.children[assigns.children.length - 1]);
                    } else {
                        letExpression.replaceWith(body);
                        this.render(body.parent);
                        this.select(body);
                    }
                }, function () {
                    assigns.insert(index, selection);
                    if (assigns.children.length > 1) {
                        this.render(letExpression);
                    } else {
                        body.replaceWith(letExpression);
                        letExpression.addChild(body);
                        body.parent = letExpression;
                        this.render(letExpression.parent);
                    }
                    this.select(selection);
                });
                break;
            case 'typed-parameter':
                throw 'not implemented';
            default:
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
                break;
        }
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
        }
        return true;
    }
    return false;
};

Editor.prototype.number = function (char) {
    if (this.selection !== null && this.selection.isExpression()) {
        char = char.toString();
        if (this.selection.type === 'number') {
            if (char !== '.' || this.selection.value.indexOf('.') === -1) {
                this.selection.value += char;
                this.render(this.selection);
            }
        } else {
            var selection = this.selection;
            if (char === '.') {
                char = '0.';
            }
            var node = new AstNode('number', char);
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
    }
};