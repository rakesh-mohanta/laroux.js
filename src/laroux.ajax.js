(function(laroux) {
    'use strict';

    // requires $l
    // requires $l.events
    // requires $l.helpers

    // ajax - partially taken from 'jquery in parts' project
    //        can be found at: https://github.com/mythz/jquip/
    laroux.ajax = {
        corsDefault: false,

        wrappers: {
            registry: {
                'laroux.js': function(data) {
                    if (!data.isSuccess) {
                        laroux.popupFunc('Error: ' + data.errorMessage);
                        return;
                    }

                    var obj;

                    if (data.format == 'json') {
                        obj = JSON.parse(data.object);
                    } else if (data.format == 'script') {
                        /* jshint evil:true */
                        obj = eval(data.object);
                    } else { // if (data.format == 'xml') {
                        obj = data.object;
                    }

                    return obj;
                }
            },

            set: function(name, fnc) {
                laroux.ajax.wrappers.registry[name] = fnc;
            }
        },

        xDomainObject: false,
        _xmlHttpRequestObject: null,
        _xDomainRequestObject: null,
        _xhr: function(crossDomain) {
            if (laroux.ajax._xmlHttpRequestObject === null) {
                laroux.ajax._xmlHttpRequestObject = new XMLHttpRequest();
            }

            if (crossDomain) {
                if (!('withCredentials' in laroux.ajax._xmlHttpRequestObject) && XDomainRequest !== undefined) {
                    laroux.ajax.xDomainObject = true;

                    if (laroux.ajax._xDomainRequestObject === null) {
                        laroux.ajax._xDomainRequestObject = new XDomainRequest();
                    }

                    return laroux.ajax._xDomainRequestObject;
                }
            } else {
                laroux.ajax.xDomainObject = false;
            }

            return laroux.ajax._xmlHttpRequestObject;
        },

        _xhrResp: function(xhr, options) {
            var wrapperFunction = xhr.getResponseHeader('X-Response-Wrapper-Function');
            var response;

            if (options.datatype === undefined) {
                response = xhr.responseText;
            } else if (options.datatype == 'json') {
                response = JSON.parse(xhr.responseText);
            } else if (options.datatype == 'script') {
                /* jshint evil:true */
                response = eval(xhr.responseText);
            } else if (options.datatype == 'xml') {
                response = xhr.responseXML;
            } else {
                response = xhr.responseText;
            }

            if (wrapperFunction && (wrapperFunction in laroux.ajax.wrappers.registry)) {
                response = laroux.ajax.wrappers.registry[wrapperFunction](response);
            }

            return {
                'response': response,
                'wrapperFunc': wrapperFunction
            };
        },

        makeRequest: function(options) {
            var cors = laroux.ajax.corsDefault;
            if (options.cors !== undefined) {
                cors = options.cors;
            }

            var xhr = laroux.ajax._xhr(cors);
            var timer = null;
            var n = 0;

            if (options.timeout !== undefined) {
                timer = setTimeout(
                    function() {
                        xhr.abort();
                        if (options.timeoutFn !== undefined) {
                            options.timeoutFn(options.url);
                        }
                    },
                    options.timeout
                );
            }

            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    if (timer !== null) {
                        clearTimeout(timer);
                    }

                    if (xhr.status < 300) {
                        var res = null;
                        var isSuccess = true;

                        try {
                            res = laroux.ajax._xhrResp(xhr, options);
                        } catch (e) {
                            if (options.error !== undefined) {
                                options.error(xhr, xhr.status, xhr.statusText);
                            }

                            laroux.events.invoke('ajaxError', [xhr, xhr.status, xhr.statusText, options]);
                            isSuccess = false;
                        }

                        if (isSuccess) {
                            if (options.success !== undefined && res !== null) {
                                options.success(res.response, res.wrapperFunc);
                            }

                            laroux.events.invoke('ajaxSuccess', [xhr, res.response, res.wrapperFunc, options]);
                        }
                    } else {
                        if (options.error !== undefined) {
                            options.error(xhr, xhr.status, xhr.statusText);
                        }

                        laroux.events.invoke('ajaxError', [xhr, xhr.status, xhr.statusText, options]);
                    }

                    if (options.complete !== undefined) {
                        options.complete(xhr, xhr.statusText);
                    }

                    laroux.events.invoke('ajaxComplete', [xhr, xhr.statusText, options]);
                } else if (options.progress !== undefined) {
                    options.progress(++n);
                }
            };

            var url = options.url;
            if (options.getdata !== undefined && options.getdata !== null) {
                if (options.getdata.constructor === Object) {
                    var queryString = laroux.helpers.buildQueryString(options.getdata);
                    if (queryString.length > 0) {
                        url += ((url.indexOf('?') < 0) ? '?' : '&') + queryString;
                    }
                } else {
                    url += ((url.indexOf('?') < 0) ? '?' : '&') + options.getdata;
                }
            }

            if (options.jsonp !== undefined) {
                url += ((url.indexOf('?') < 0) ? '?' : '&') + 'jsonp=' + options.jsonp;
            }

            if (!laroux.ajax.xDomainObject) {
                xhr.open(options.type, url, true);
            } else {
                xhr.open(options.type, url);
            }

            try {
                if (options.xhrFields !== undefined) {
                    for (var i in options.xhrFields) {
                        if (!options.xhrFields.hasOwnProperty(i)) {
                            continue;
                        }

                        xhr[i] = options.xhrFields[i];
                    }
                }

                if (options.headers !== undefined) {
                    for (var j in options.headers) {
                        if (!options.headers.hasOwnProperty(j)) {
                            continue;
                        }

                        xhr.setRequestHeader(j, options.headers[j]);
                    }
                }
            } catch(e) {
                console.log(e);
            }

            if (options.postdata === undefined || options.postdata === null) {
                xhr.send(null);
                return;
            }

            switch (options.postdatatype) {
                case 'json':
                    xhr.send(JSON.stringify(options.postdata));
                    break;
                case 'form':
                    xhr.send(laroux.helpers.buildFormData(options.postdata));
                    break;
                default:
                    xhr.send(options.postdata);
                    break;
            }
        },

        get: function(path, values, successfnc, errorfnc) {
            laroux.ajax.makeRequest({
                type: 'GET',
                url: path,
                datatype: 'html',
                getdata: values,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Wrapper-Function': 'laroux.js'
                },
                success: successfnc,
                error: errorfnc
            });
        },

        getJson: function(path, values, successfnc, errorfnc) {
            laroux.ajax.makeRequest({
                type: 'GET',
                url: path,
                datatype: 'json',
                getdata: values,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Wrapper-Function': 'laroux.js'
                },
                success: successfnc,
                error: errorfnc
            });
        },

        getJsonP: function(path, values, method, successfnc, errorfnc) {
            laroux.ajax.makeRequest({
                type: 'GET',
                url: path,
                datatype: 'script',
                getdata: values,
                jsonp: method,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                success: successfnc,
                error: errorfnc
            });
        },

        getScript: function(path, values, successfnc, errorfnc) {
            laroux.ajax.makeRequest({
                type: 'GET',
                url: path,
                datatype: 'script',
                getdata: values,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                success: successfnc,
                error: errorfnc
            });
        },

        post: function(path, values, successfnc, errorfnc) {
            laroux.ajax.makeRequest({
                type: 'POST',
                url: path,
                datatype: 'json',
                postdata: values,
                postdatatype: 'form',
                headers: {
                    // 'Content-Type': 'multipart/formdata; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Wrapper-Function': 'laroux.js'
                },
                success: successfnc,
                error: errorfnc
            });
        },

        postJson: function(path, values, successfnc, errorfnc) {
            laroux.ajax.makeRequest({
                type: 'POST',
                url: path,
                datatype: 'json',
                postdata: values,
                postdatatype: 'json',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Wrapper-Function': 'laroux.js'
                },
                success: successfnc,
                error: errorfnc
            });
        }
    };

})(this.laroux);
