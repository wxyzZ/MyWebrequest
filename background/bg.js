// Generated by CoffeeScript 1.8.0
var __hasProp = {}.hasOwnProperty;

(function() {
  var cloneObj, formatHeaders, formatQstr, getQueryString, gsearchRuleBasic, logNum, onRequests, pushNotification, requestCache, _rules;
  gsearchRuleBasic = ['*://www.google.com/url*', '*://www.google.com.hk/url*'];
  _rules = {
    block: {},
    hsts: {},
    log: {},
    hotlink: {},
    gsearch: {
      urls: gsearchRuleBasic
    },
    gstatic: {
      urls: ['http://ajax.googleapis.com/*', 'http://fonts.googleapis.com/*']
    }
  };
  logNum = 0;
  requestCache = {};
  cloneObj = function(o) {
    var i, k, key, obj, val, _i, _len;
    if (o === null || !(o instanceof Object)) {
      return o;
    }
    if (Array.isArray(o)) {
      if (o.length > 1) {
        obj = [];
        for (k = _i = 0, _len = o.length; _i < _len; k = ++_i) {
          i = o[k];
          obj[k] = i instanceof Object ? cloneObj(i) : i;
        }
        return obj;
      } else {
        return o[0];
      }
    } else {
      obj = {};
      for (val in o) {
        key = o[val];
        obj[val] = key instanceof Object ? cloneObj(key) : key;
      }
      return obj;
    }
  };
  getQueryString = function(url) {
    var anchor, qstr;
    anchor = document.createElement('a');
    anchor.href = url;
    qstr = anchor.search;
    anchor = null;
    return qstr;
  };
  formatQstr = function(url) {
    var arr, e, i, key, pair, qstr, result, val, _i, _len;
    qstr = getQueryString(url);
    qstr = qstr ? qstr.replace(/^\?/, '') : void 0;
    if (!qstr) {
      return false;
    }
    arr = qstr.split('&');
    result = {};
    try {
      for (_i = 0, _len = arr.length; _i < _len; _i++) {
        i = arr[_i];
        pair = i.split('=');
        key = decodeURIComponent(pair[0]);
        val = pair[1] === void 0 ? '' : decodeURIComponent(pair[1]);
        if (result[key] === void 0) {
          result[key] = val;
        } else {
          if (Array.isArray(result[key])) {
            result[key].push(val);
          } else {
            result[key] = [result[key]];
            result[key].push(val);
          }
        }
      }
      return {
        formatedData: result,
        rawData: qstr
      };
    } catch (_error) {
      e = _error;
      if (e instanceof URIError) {
        result.error = 'The query string is not encoded with utf-8, this can\'t be decoded by now.';
      } else {
        result.error = e.message;
      }
      return result;
    }
  };
  formatHeaders = function(headers) {
    var obj, val, _i, _len;
    obj = {};
    for (_i = 0, _len = headers.length; _i < _len; _i++) {
      val = headers[_i];
      obj[val.name] = val.value;
    }
    return obj;
  };
  pushNotification = (function() {
    if (chrome.notifications) {
      return function(title, content, notifiId, cb) {
        notifiId = notifiId || '';
        chrome.notifications.create(notifiId, {
          type: 'basic',
          iconUrl: '/img/icon48.png',
          title: title,
          message: content
        }, function() {});
        if (notifiId && cb instanceof Function) {
          chrome.notifications.onClicked.addListener(function(nId) {
            if (nId === notifiId) {
              cb();
            }
          });
        }
      };
    } else if (window.webkitNotifications) {
      return function(title, content) {
        var notifi;
        notifi = webkitNotifications.createNotification('/img/icon48.png', title, content);
        return notifi.show();
      };
    } else {
      return function() {};
    }
  })();
  onRequests = {
    gsearch: {
      fn: function(details) {
        var url;
        url = formatQstr(details.url).formatedData;
        url = url != null ? url.url : void 0;
        if (!url) {
          url = details.url;
        }
        return {
          redirectUrl: url
        };
      },
      permit: ['blocking'],
      on: 'onBeforeRequest'
    },
    block: {
      fn: function(details) {
        return {
          cancel: true
        };
      },
      permit: ['blocking'],
      on: 'onBeforeRequest'
    },
    hsts: {
      fn: function(details) {
        return {
          redirectUrl: details.url.replace(/^http\:\/\//, 'https://')
        };
      },
      permit: ['blocking'],
      on: 'onBeforeRequest'
    },
    hotlink: {
      fn: function(details) {
        var headers, i, k, _i, _len;
        headers = details.requestHeaders;
        for (k = _i = 0, _len = headers.length; _i < _len; k = ++_i) {
          i = headers[k];
          if (i.name === 'Referer') {
            header.split(k, 1);
            break;
          }
        }
        return {
          requestHeaders: headers
        };
      },
      permit: ['requestHeaders', 'blocking'],
      on: 'onBeforeSendHeaders'
    },
    logBody: {
      fn: function(details) {
        if (details.requestBody) {
          return requestCache[details.requestId] = cloneObj(details.requestBody);
        }
      },
      permit: ['requestBody'],
      on: 'onBeforeRequest'
    },
    logRequest: {
      fn: function(details) {
        var domain, i, queryBody, rid, url;
        ++logNum;
        url = details.url;
        rid = details.requestId;
        queryBody = formatQstr(details.url);
        i = url.indexOf('//');
        domain = url.indexOf('/', i + 2);
        if (~domain) {
          domain = url.substr(0, domain);
        } else {
          domain = url;
        }
        if (requestCache[rid]) {
          details.requestBody = requestCache[rid];
        }
        details.requestHeaders = formatHeaders(details.requestHeaders);
        if (queryBody) {
          details.queryBody = queryBody;
        }
        console.log('%c%d %o %csent to domain: %s', 'color: #086', logNum, details, 'color: #557c30', domain);
        delete requestCache[rid];
      },
      permit: ['requestHeaders'],
      on: 'onSendHeaders'
    },
    gstatic: {
      fn: function(details) {
        return {
          redirectUrl: details.url.replace('googleapis.com', 'useso.com')
        };
      },
      permit: ['blocking'],
      on: 'onBeforeRequest'
    }
  };
  (function() {
    var k, onRequest, onoff, reqApi, rule, v;
    onoff = JSON.parse(localStorage.onoff || '{}');
    rule;
    for (k in _rules) {
      if (!__hasProp.call(_rules, k)) continue;
      v = _rules[k];
      rule = JSON.parse(localStorage[k] || '[]');
      if (v.urls) {
        v.urls = v.urls.concat(rule);
      } else {
        v.urls = rule;
      }
    }
    reqApi = chrome.webRequest;
    onRequest = null;
    for (k in _rules) {
      if (!__hasProp.call(_rules, k)) continue;
      v = _rules[k];
      if (onoff[k]) {
        if (k === 'log') {
          pushNotification(chrome.i18n.getMessage('bg_logison'), chrome.i18n.getMessage('bg_logon_tip'), 'log-enabled-hint', function() {
            window.open('/options/index.html#log');
          });
          onRequest = onRequests['logBody'];
          reqApi[onRequest.on].addListener(onRequest.fn, _rules[k], onRequest.permit);
          onRequest = onRequests['logRequest'];
          reqApi[onRequest.on].addListener(onRequest.fn, _rules[k], onRequest.permit);
        } else {
          onRequest = onRequests[k];
          reqApi[onRequest.on].addListener(onRequest.fn, _rules[k], onRequest.permit);
        }
      } else {
        onoff[k] = false;
      }
    }
    localStorage.onoff = JSON.stringify(onoff);
  })();
  window.addEventListener('storage', function(event) {
    var k, newData, oldData, onRequest, onoff, reqApi, type;
    type = event.key;
    reqApi = chrome.webRequest;
    newData = JSON.parse(event.newValue || '[]');
    oldData = JSON.parse(event.oldValue || '[]');
    onoff = JSON.parse(localStorage.onoff || '{}');
    onRequest = null;
    if (type === 'onoff') {
      for (k in _rules) {
        if (!__hasProp.call(_rules, k)) continue;
        if (newData[k] !== oldData[k]) {
          if (newData[k]) {
            if (k === 'log') {
              onRequest = onRequests['logBody'];
              reqApi[onRequest.on].addListener(onRequest.fn, _rules[k], onRequest.permit);
              onRequest = onRequests['logRequest'];
              reqApi[onRequest.on].addListener(onRequest.fn, _rules[k], onRequest.permit);
            } else {
              onRequest = onRequests[k];
              reqApi[onRequest.on].addListener(onRequest.fn, _rules[k], onRequest.permit);
            }
          } else {
            if (k === 'log') {
              onRequest = onRequests['logBody'];
              reqApi[onRequest.on].removeListener(onRequest.fn);
              onRequest = onRequests['logRequest'];
              reqApi[onRequest.on].removeListener(onRequest.fn);
              requestCache = {};
            } else {
              onRequest = onRequests[k];
              reqApi[onRequest.on].removeListener(onRequest.fn);
            }
          }
        }
      }
    } else {
      _rules[type].urls = newData;
      if (type === 'gsearch') {
        _rules[type].urls = _rules[type].urls.concat(gsearchRuleBasic);
      }
      if (onoff[type]) {
        if (type === 'log') {
          reqApi[onRequests['logBody'].on].removeListener(onRequests['logBody'].fn);
          reqApi[onRequests['logRequest'].on].removeListener(onRequests['logRequest'].fn);
          setTimeout(function() {
            onRequest = onRequests['logBody'];
            reqApi[onRequest.on].addListener(onRequest.fn, _rules[type], onRequest.permit);
            onRequest = onRequests['logRequest'];
            reqApi[onRequest.on].addListener(onRequest.fn, _rules[type], onRequest.permit);
          }, 0);
        } else {
          onRequest = onRequests[type];
          reqApi[onRequest.on].removeListener(onRequest.fn);
          setTimeout(function() {
            reqApi[onRequest.on].addListener(onRequest.fn, _rules[type], onRequest.permit);
          }, 0);
        }
      }
    }
  });
})();


//# sourceMappingURL=bg.js.map
