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

var ast = new AstNode('constant-definition');
ast.addChild(new AstNode('name', 'main'));
var placeholder = new AstNode('placeholder');
ast.addChild(placeholder);

program.members.main = ast;

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
    } else {
        matrix[cols - 2][rows - 3] = input.Key.getAssign(editor);
    }
    matrix[cols - 1][rows - 3] = input.Key.getDelete(editor);
    matrix[cols - 1][rows - 2] = input.Key.getUndo(editor);
    matrix[cols - 2][rows - 2] = input.Key.getUpArrow(editor);
    matrix[cols - 2][rows - 1] = input.Key.getDownArrow(editor);
    matrix[cols - 3][rows - 1] = input.Key.getLeftArrow(editor);
    matrix[cols - 1][rows - 1] = input.Key.getRightArrow(editor);

    // TODO: find available methods based on editor.selection.typeAnnotation
    
    var i = 0;
    if (editor.selection !== null && editor.selection.type === 'placeholder') {
        for (symbol in editor.selection.symbols) {
            if (!editor.selection.symbols.hasOwnProperty(symbol)) continue;
            matrix[left][i++] = new input.Key.getName(editor, symbol);
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
                matrix[cols - 4][rows - 1] = new input.Key('rename', null, function () {
                    alert('not implemented');
                });
                break;
            case 'name':
                if (editor.selection.parent.type !== 'parameters') {
                    matrix[cols - 4][rows - 1] = new input.Key('find', 'definition', function () {
                        var def = editor.selection.symbols[editor.selection.value];
                        if (typeof def !== 'undefined') {
                            editor.select(def);
                        }
                    });
                }
                break;
        }
    }
};

keymatrix.defaultLayout = defaultLayout;

var updateSize = function () {
    keymatrix.autoResize();
    editor.element.style.bottom = keymatrix.element.offsetHeight + 'px';
};

editor.on('select', function (event) {
    keymatrix.update();
});

window.addEventListener('resize', updateSize);
updateSize();

window.addEventListener('keydown', function (e) {
    var key = e.keyCode || e.which;
    if (key >= 48 && key <= 57) {
        editor.number(key - 48);
        return;
    }
    switch (key) {
        case 8:
            e.preventDefault();
            editor.backspace();
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
});