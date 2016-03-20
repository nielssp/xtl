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
var visual = require('./visual');

exports.KeyMatrix = KeyMatrix;

exports.Key = Key;

/**
 * 
 * @class
 * @param {visual.Editor} editor
 * @param {Element} element
 */
function KeyMatrix(editor, element) {
    /**
     * @type {visual.Editor}
     */
    this.editor = editor;

    /**
     * @type {Element}
     */
    this.element = element;

    this.cols = null;

    this.rows = null;

    this.keys = [];

    this.defaultLayout = null;

    this.layout = null;

    this.setSize(12, 3);
}

KeyMatrix.clear = function (keys) {
    keys.forEach(function (column) {
        column.forEach(function (key, index) {
            column[index] = null;
        });
    });
};

KeyMatrix.prototype.setSize = function (cols, rows) {
    if (this.cols === cols && this.rows === rows) {
        return;
    }
    if (this.defaultLayout !== null) {
        this.layout = this.defaultLayout;
    }
    this.cols = cols;
    this.rows = rows;
    this.keys = [];
    this.element.className = 'cols-' + cols + ' rows-' + rows;
    for (var i = 0; i < this.cols; i++) {
        var column = [];
        for (var j = 0; j < this.rows; j++) {
            column.push(null);
        }
        this.keys.push(column);
    }
    if (this.layout !== null) {
        this.layout(this.keys, this.cols, this.rows);
    }
    this.update();
};

/**
 * @callback KeyMatrix~layout
 * @param {Key[][]} keys Key matrix.
 * @param {number} cols Number of columns, at least 5.
 * @param {number} rows Number of rows, at least 3.
 */

/**
 * 
 * @param {KeyMatrix~layout} layout
 */
KeyMatrix.prototype.setLayout = function (layout) {
    this.layout = layout;
    layout(this.keys, this.cols, this.rows);
    this.update();
};

KeyMatrix.prototype.autoResize = function () {
    var rows = 3;
    if (window.innerHeight >= 480) {
        rows = 4;
    }
    if (window.innerWidth < 700) {
        this.setSize(5, rows);
    } else if (window.innerWidth < 950) {
        this.setSize(10, rows);
    } else {
        this.setSize(12, rows);
    }
};

KeyMatrix.prototype.update = function () {
    this.element.innerHTML = '';
    this.keys.forEach(function (column) {
        var colEl = document.createElement('div');
        colEl.className = 'column';
        column.forEach(function (key) {
            if (key === null) {
                colEl.appendChild(document.createElement('button'));
            } else {
                colEl.appendChild(key.render());
            }
        });
        this.element.appendChild(colEl);
    }, this);
};

/**
 * 
 * @param {?string} label
 * @param {?string} help
 * @param {Function} action
 */
function Key(label, help, action, type) {
    this.label = label;

    this.help = help;

    this.action = action;

    this.type = typeof type !== 'undefined' ? type : '';
}

Key.getUpArrow = function (editor) {
    return new Key('&uparrow;', 'parent', function () {
        editor.up();
    });
};


Key.getDownArrow = function (editor) {
    return new Key('&downarrow;', 'first child', function () {
        editor.down();
    });
};

Key.getLeftArrow = function (editor) {
    return new Key('&leftarrow;', 'previous', function () {
        editor.left();
    });
};

Key.getRightArrow = function (editor) {
    return new Key('&rightarrow;', 'next', function () {
        editor.right();
    });
};

Key.getNumber = function (editor, value, help) {
    var help = typeof help !== 'undefined' ? help : null;
    return new Key(value, help, function () {
        editor.number(value);
    }, 'literal');
};

Key.getName = function (editor, name) {
    return new Key(name, null, function () {
        if (editor.selection !== null && editor.selection.parent !== null) {
            var node = new AstNode('id', name);
            editor.selection.replaceWith(node);
            editor.render(node.parent);
            editor.select(node);
        }
    }, 'id');
};

Key.getDelete = function (editor) {
    return new Key('del', 'delete', function () {
        editor.delete();
    });
};

Key.getBackspace = function (editor) {
    return new Key('&Leftarrow;', 'backspace', function () {
        editor.backspace();
    });
};

Key.getUndo = function (editor) {
    return new Key('&#x21b6;', 'undo', function () {
        alert('not implemented');
    });
};

Key.getMethod = function (editor, method, parameters) {
    return new Key(method, null, function () {
        if (editor.selection !== null && editor.selection.parent !== null) {
            var node = new AstNode('expression');
            var object = editor.selection;
            object.replaceWith(node);
            node.addChild(new AstNode('id', method));
            node.addChild(object);
            for (var i = 0; i < parameters; i++) {
                node.addChild(new AstNode('placeholder'));
            }
            editor.render(node.parent);
            if (node.children[1].type === 'placeholder') {
                editor.select(node.children[1]);
            } else if (parameters > 0) {
                editor.select(node.children[2]);
            } else {
                editor.select(node.parent);
            }
        }
    }, 'method');
};

Key.getIf = function (editor) {
    return new Key('if', 'conditional', function () {
        if (editor.selection !== null && editor.selection.parent !== null) {
            var node = new AstNode('macro', 'if');
            var condition = editor.selection;
            condition.replaceWith(node);
            node.addChild(condition);
            node.addChild(new AstNode('placeholder'));
            node.addChild(new AstNode('placeholder'));
            editor.render(node.parent);
            if (node.children[0].type === 'placeholder') {
                editor.select(node.children[0]);
            } else {
                editor.select(node.children[1]);
            }
        }
    }, 'macro');
};

Key.getLambda = function (editor) {
    return new Key('&lambda;', 'abstraction', function () {
        if (editor.selection !== null && editor.selection.parent !== null) {
            var node = new AstNode('macro', '&lambda;');
            var expr = editor.selection;
            expr.replaceWith(node);
            var parameters = new AstNode('parameters');
            parameters.addChild(new AstNode('id', 'x'));
            node.addChild(parameters);
            node.addChild(expr);
            editor.render(node.parent);
            editor.select(node.children[1]);
        }
    }, 'macro');
};

Key.getLet = function (editor) {
    return new Key('let', 'assignment', function () {
        if (editor.selection !== null && editor.selection.parent !== null) {
            var node = new AstNode('macro', 'let');
            var expr = editor.selection;
            expr.replaceWith(node);
            var parameters = new AstNode('parameters');
            node.addChild(parameters);
            node.addChild(expr);
            editor.render(node.parent);
            if (node.children[1].type === 'placeholder') {
                editor.select(node.children[0]);
            } else {
                editor.select(node.children[1]);
            }
        }
    }, 'macro');
};

Key.getAssign = function (editor) {
    return new Key('=', 'assign', function () {
        alert('not implemented');
    });
};

Key.prototype.render = function () {
    var el = document.createElement('button');
    el.className = this.type;
    if (this.label !== null) {
        var labelEl = document.createElement('span');
        labelEl.className = 'label';
        labelEl.innerHTML = this.label;
        el.appendChild(labelEl);
    }
    if (this.help !== null) {
        var helpEl = document.createElement('span');
        helpEl.className = 'help';
        helpEl.innerHTML = this.help;
        el.appendChild(helpEl);
    }
    el.addEventListener('click', this.action);
    return el;
};