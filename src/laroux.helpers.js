(function(laroux) {
    'use strict';

    // helpers
    laroux.helpers = {
        uniqueId: 0,

        getUniqueId: function() {
            return 'uid-' + (++laroux.helpers.uniqueId);
        },

        buildQueryString: function(values, rfc3986) {
            var uri = '';
            var regEx = /%20/g;

            for (var name in values) {
                if (!values.hasOwnProperty(name)) {
                    continue;
                }

                if (typeof values[name] != 'function') {
                    if (rfc3986 || false) {
                        uri += '&' + encodeURIComponent(name).replace(regEx, '+') + '=' + encodeURIComponent(values[name].toString()).replace(regEx, '+');
                    } else {
                        uri += '&' + encodeURIComponent(name) + '=' + encodeURIComponent(values[name].toString());
                    }
                }
            }

            return uri.substr(1);
        },

        buildFormData: function(values) {
            var data = new FormData();

            for (var name in values) {
                if (!values.hasOwnProperty(name)) {
                    continue;
                }

                if (typeof values[name] != 'function') {
                    data.append(name, values[name]);
                }
            }

            return data;
        },

        camelCase: function(value) {
            var flag = false;
            var output = '';

            for (var j = 0; j < value.length; j++) {
                var currChar = value.charAt(j);
                if (currChar == '-') {
                    flag = true;
                    continue;
                }

                output += (!flag) ? currChar : currChar.toUpperCase();
                flag = false;
            }

            return output;
        },

        antiCamelCase: function(value) {
            var output = '';

            for (var j = 0; j < value.length; j++) {
                var currChar = value.charAt(j);
                if (currChar != '-' && currChar == currChar.toUpperCase()) {
                    output += '-' + currChar.toLowerCase();
                    continue;
                }

                output += currChar;
            }

            return output;
        },

        quoteAttr: function(value) {
            return value.replace(/&/g, '&amp;')
                        .replace(/'/g, '&apos;')
                        .replace(/"/g, '&quot;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/\r\n/g, '&#13;')
                        .replace(/[\r\n]/g, '&#13;');
        },

        random: function(min, max) {
            return min + Math.floor(Math.random() * (max - min + 1));
        },

        find: function(obj, iterator, context) {
            var result;

            obj.some(function(value, index, list) {
                if (iterator.call(context, value, index, list)) {
                    result = value;
                    return true;
                }
            });

            return result;
        },

        column: function(obj, key) {
            return obj.map(function(value) { return value[key]; });
        },

        shuffle: function(obj) {
            var index = 0;
            var shuffled = [];

            obj.forEach(function(value) {
                var rand = laroux.helpers.random(0, index);
                shuffled[index++] = shuffled[rand];
                shuffled[rand] = value;
            });

            return shuffled;
        },

        merge: function(obj1, obj2) {
            var tmp = obj1;

            if (tmp instanceof Array) {
                return tmp.concat(obj2);
            }

            for (var attr in obj2) {
                if (!tmp.hasOwnProperty(attr)) {
                    tmp[attr] = obj2[attr];
                }
            }

            return tmp;
        },

        duplicate: function(obj) {
            return JSON.parse(JSON.stringify(obj));
        },

        toArray: function(obj) {
            var length = obj.length,
                items = new Array(length);

            for (var i = 0; i < length; i++) {
                items[i] = obj[i];
            }

            return items;
        },

        getAsArray: function(obj) {
            var items;

            if (obj instanceof Array) {
                items = obj;
            } else if (obj instanceof NodeList) {
                var length = obj.length;

                items = new Array(length);
                for (var i = 0; i < length; i++) {
                    items[i] = obj[i];
                }
            } else {
                items = [obj];
            }

            return items;
        },

        getLength: function(obj) {
            if (obj.constructor === Object) {
                if (obj.length !== undefined) {
                    return obj.length;
                }

                return Object.keys(obj).length;
            }

            return -1;
        },

        getKeysRecursive: function(obj, delimiter, prefix, keys) {
            if (delimiter === undefined) {
                delimiter = '.';
            }

            if (prefix === undefined) {
                prefix = '';
                keys = [];
            }

            for (var item in obj) {
                keys.push(prefix + item);

                if (obj[item].constructor === Object) {
                    laroux.helpers.getKeysRecursive(obj[item], delimiter, prefix + item + delimiter, keys);
                    continue;
                }
            }

            return keys;
        },

        getElement: function(obj, path, defaultValue, delimiter) {
            if (defaultValue === undefined) {
                defaultValue = null;
            }

            if (delimiter === undefined) {
                delimiter = '.';
            }

            var pos = path.indexOf(delimiter);
            var key;
            var rest;
            if (pos === -1) {
                key = path;
                rest = null;
            } else {
                key = path.substring(0, pos);
                rest = path.substring(pos + 1);
            }

            if (!(key in obj)) {
                return null;
            }

            if (rest === null || rest.length === 0) {
                return obj[key];
            }

            return laroux.helpers.getElement(obj[key], rest, defaultValue, delimiter);
        },
        /* for javascript 1.7 or later,

        getKeys: function(obj) {
            var keys = Object.keys(obj);
            for (var item in keys) {
                yield keys[item];
            }
        } */
    };

})(this.laroux);
