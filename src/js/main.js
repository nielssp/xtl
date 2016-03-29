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

require('../index.html');
require('../scss/main.scss');

var input = require('./input');

var Editor = require('./Editor');

var AstNode = require('./AstNode');

var Module = require('./Module');

var program = new Module('program');

var ast = new AstNode('constant-definition', 'main');
var type = new AstNode('applied-type');
type.addChild(new AstNode('name', 'io'));
type.addChild(new AstNode('name', 'unit'));
ast.addChild(type)
var placeholder = new AstNode('placeholder');
ast.addChild(placeholder);

program.define('main', ast);

var editor = new Editor(document.getElementById('editor'));
editor.setRoot(ast);
editor.select(placeholder);

var keymatrix = new input.KeyMatrix(editor, document.getElementById('keymatrix'));

var numberLayout = function (matrix, cols, rows) {
    input.KeyMatrix.clear(matrix);
    var num = 1;
    for (var i = 3; i > 0; i--) {
        for (var j = 0; j < 3; j++) {
            matrix[j + 1][rows - i] = input.Key.getNumber(editor, num++);
        }
    }
    matrix[0][rows - 3] = input.Key.getName(editor, 'true');
    matrix[0][rows - 2] = input.Key.getName(editor, 'false');
    matrix[4][rows - 3] = input.Key.getBackspace(editor);
    matrix[4][rows - 2] = input.Key.getNumber(editor, '.');
    matrix[4][rows - 1] = input.Key.getNumber(editor, 0);
    if (cols < 10) {
        matrix[0][rows - 1] = new input.Key('( )', 'expressions', function () {
            keymatrix.setLayout(defaultLayout);
        });
    }
};

var defaultLayout = function (matrix, cols, rows) {
    input.KeyMatrix.clear(matrix);
    left = 0;
    if (cols >= 10) {
        numberLayout(matrix, cols, rows);
        left = 5;
    } else {
        matrix[0][rows - 1] = new input.Key('123', 'literals', function () {
            keymatrix.setLayout(numberLayout);
        });
    }
    if (rows > 3) {
        matrix[cols - 1][rows - 4] = input.Key.getAssign(editor);
        matrix[cols - 2][rows - 3] = input.Key.getApply(editor);
    } else {
        matrix[cols - 2][rows - 3] = input.Key.getAssign(editor);
        matrix[cols - 3][rows - 3] = input.Key.getApply(editor);
    }
    matrix[cols - 1][rows - 3] = input.Key.getDelete(editor);
    matrix[cols - 1][rows - 2] = input.Key.getUndo(editor);
    matrix[cols - 2][rows - 2] = input.Key.getUpArrow(editor);
    matrix[cols - 2][rows - 1] = input.Key.getDownArrow(editor);
    matrix[cols - 3][rows - 1] = input.Key.getLeftArrow(editor);
    matrix[cols - 1][rows - 1] = input.Key.getRightArrow(editor);

    // TODO: find available methods based on editor.selection.typeAnnotation

    var i = left;
    var j = 0;
    if (editor.selection !== null && editor.selection.type === 'placeholder') {
        for (var symbol in editor.selection.symbols) {
            if (!editor.selection.symbols.hasOwnProperty(symbol))
                continue;
            matrix[i++][j] = new input.Key.getName(editor, symbol);
            if (i > cols - 2) {
                i = left;
                j++;
                if (j > rows - 3) {
                    break;
                }
            }
        }
    }

    matrix[left][rows - 2] = input.Key.getIf(editor);
    matrix[left + 1][rows - 2] = input.Key.getLambda(editor);
    matrix[left + 2][rows - 2] = input.Key.getLet(editor);

    if (editor.selection !== null) {
        switch (editor.selection.type) {
            case 'function-definition':
            case 'constant-definition':
            case 'assign':
            case 'parameter':
            case 'typed-parameter':
                matrix[cols - 4][rows - 1] = input.Key.getRename(editor);
                break;
            case 'parameters':
            case 'typed-parameters':
            case 'let-expression':
                matrix[cols - 4][rows - 1] = input.Key.getAdd(editor);
                break;
            case 'name':
                matrix[cols - 4][rows - 1] = new input.Key('find', 'definition', function () {
                    var def = editor.selection.symbols[editor.selection.value];
                    if (typeof def !== 'undefined') {
                        editor.select(def);
                    }
                });
                break;
            default:
                matrix[cols - 4][rows - 1] = input.Key.getString(editor);
                break;
        }
    }
};

keymatrix.defaultLayout = defaultLayout;

var updateSize = function () {
    keymatrix.autoResize();
    editor.element.style.bottom = keymatrix.element.offsetHeight + 'px';
    editor.bringIntoView(editor.selection);
};

editor.on('select', function (event) {
    keymatrix.update();
});

window.addEventListener('resize', updateSize);
updateSize();

window.addEventListener('keydown', function (e) {
    if (editor.inputActive) {
        return;
    }
    var key = e.keyCode || e.which;
    if (key >= 48 && key <= 57) {
        editor.number(key - 48);
        return;
    }
    if (e.ctrlKey && e.shiftKey) {
        switch (key) {
            case 90:
                editor.redo();
                break;
        }
    } else if (e.ctrlKey) {
        switch (key) {
            case 90:
                editor.undo();
                break;
        }
    } else if (e.shiftKey) {
        switch (key) {
            case 9:
                editor.previousPlaceholder();
                break;
        }
    } else {
        switch (key) {
            case 8:
                if (editor.backspace()) {
                    e.preventDefault();
                }
                break;
            case 9:
                editor.nextPlaceholder();
                break;
            case 37:
                editor.left();
                break;
            case 38:
                editor.up();
                break;
            case 39:
                editor.right();
                break;
            case 40:
                editor.down();
                break;
            case 46:
                editor.delete();
                break;
            case 190:
                editor.number('.');
                break;
        }
    }
});