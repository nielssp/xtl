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

var visual = require('./visual');

var AstNode = require('./AstNode');


var ast = new AstNode('definition');
ast.addChild(new AstNode('id', 'main'));
ast.addChild(new AstNode('parameters'));
var placeholder = new AstNode('placeholder');
ast.addChild(placeholder);

var editor = new visual.Editor(document.getElementById('editor'));
editor.setRoot(ast);
editor.select(placeholder);

var keymatrix = new input.KeyMatrix(editor, document.getElementById('keymatrix'));

var numberLayout = function (matrix, cols, rows) {
    input.KeyMatrix.clear(matrix);
    var num = 1;
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            matrix[j + 1][i] = input.Key.getNumber(editor, num++);
        }
    }
    matrix[4][0] = input.Key.getBackspace(editor);
    matrix[4][1] = input.Key.getNumber(editor, '.');
    matrix[4][2] = input.Key.getNumber(editor, 0);
    if (cols < 10) {
        matrix[0][rows - 1] = new input.Key('( )', 'expressions', function () {
            keymatrix.setLayout(defaultLayout);
        });
    }
};

var defaultLayout = function (matrix, cols, rows) {
    input.KeyMatrix.clear(matrix);
    if (cols >= 10) {
        numberLayout(matrix, cols, rows);
    } else {
        matrix[0][rows - 1] = new input.Key('123', 'literals', function () {
            keymatrix.setLayout(numberLayout);
        });
    }
    matrix[cols - 1][rows - 3] = input.Key.getDelete(editor);
    matrix[cols - 1][rows - 2] = input.Key.getUndo(editor);
    matrix[cols - 2][rows - 2] = input.Key.getUpArrow(editor);
    matrix[cols - 2][rows - 1] = input.Key.getDownArrow(editor);
    matrix[cols - 3][rows - 1] = input.Key.getLeftArrow(editor);
    matrix[cols - 1][rows - 1] = input.Key.getRightArrow(editor);
    
    matrix[cols - 5][0] = input.Key.getMethod(editor, '+', 1);
    matrix[cols - 4][0] = input.Key.getMethod(editor, '-', 1);
    matrix[cols - 3][0] = input.Key.getMethod(editor, '*', 1);
    
    matrix[cols - 5][rows - 2] = input.Key.getIf(editor);
    matrix[cols - 4][rows - 2] = input.Key.getLambda(editor);
};

keymatrix.defaultLayout = defaultLayout;

keymatrix.autoResize();
window.addEventListener('resize', function () {
    keymatrix.autoResize();
});