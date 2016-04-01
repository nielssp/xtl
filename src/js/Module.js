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

module.exports = Module;

/**
 * 
 * @class
 * @param {string} name
 */
function Module(name) {
    this.name = name;

    this.imports = [];

    this.members = {};
    
    this.types = {};
}

Module.prototype.find = function (name) {
    if (this.members.hasOwnProperty(name)) {
        return this.members[name];
    }
    for (var i = 0; i < this.imports.length; i++) {
        var value = this.imports[i].find(name);
        if (value !== null) {
            return value;
        }
    }
    return null;
};

Module.prototype.findType = function (name) {
    if (this.types.hasOwnProperty(name)) {
        return this.types[name];
    }
    for (var i = 0; i < this.imports.length; i++) {
        var type = this.imports[i].findType(name);
        if (type !== null) {
            return type;
        }
    }
    return null;
};

Module.prototype.define = function (name, value) {
    this.members[name] = value;
};

Module.prototype.defineType = function (name, type) {
    this.types[name] = type;
};