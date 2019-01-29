(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && 'WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if ('env' in (typeof process === 'undefined' ? {} : process)) {
    r = process.env.DEBUG;
  }
  
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

}).call(this,require('_process'))

},{"./debug":2,"_process":4}],2:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug.debug = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting
    args = exports.formatArgs.apply(self, args);

    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/[\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":3}],3:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000
var m = s * 60
var h = m * 60
var d = h * 24
var y = d * 365.25

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function (val, options) {
  options = options || {}
  var type = typeof val
  if (type === 'string' && val.length > 0) {
    return parse(val)
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ?
			fmtLong(val) :
			fmtShort(val)
  }
  throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val))
}

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str)
  if (str.length > 10000) {
    return
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str)
  if (!match) {
    return
  }
  var n = parseFloat(match[1])
  var type = (match[2] || 'ms').toLowerCase()
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y
    case 'days':
    case 'day':
    case 'd':
      return n * d
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n
    default:
      return undefined
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd'
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h'
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm'
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's'
  }
  return ms + 'ms'
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms'
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name
  }
  return Math.ceil(ms / n) + ' ' + name + 's'
}

},{}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
'use strict';

var _api = require('./helpers/api');

var _api2 = _interopRequireDefault(_api);

var _jquery = require('./helpers/jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _messenger = require('./helpers/messenger');

var _focusListener = require('./modules/focus-listener');

var _focusListener2 = _interopRequireDefault(_focusListener);

var _recordEvent = require('./helpers/record-event');

var _options = require('./helpers/options');

var _options2 = _interopRequireDefault(_options);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('cdm:admin');
var api = (0, _api2.default)();
var $ = (0, _jquery2.default)();

// do some focusing
api.bind('ready', function () {
	debug('admin is ready');

	(0, _focusListener2.default)('control-focus', function (id) {
		return api.control(id);
	});
	(0, _focusListener2.default)('focus-menu', function (id) {
		return api.section(id);
	});
	(0, _focusListener2.default)('focus-menu-location', function (id) {
		return api.control('nav_menu_locations[' + id + ']');
	});

	// disable core so we can enhance by making sure the controls panel opens
	// before trying to focus the widget
	(0, _messenger.off)('focus-widget-control', api.Widgets.focusWidgetFormControl);
	(0, _focusListener2.default)('focus-widget-control', function (id) {
		return api.Widgets.getWidgetFormControlForWidget(id);
	});

	// Toggle icons when customizer toggles preview mode
	$('.collapse-sidebar').on('click', function () {
		return (0, _messenger.send)('cdm-toggle-visible');
	});

	// Make the site title clickable
	$('.customize-info .site-title').on('click', function () {
		if (api.previewer) {
			api.previewer.trigger('control-focus', 'blogname');
		}
	});

	(0, _recordEvent.bindPreviewEventsListener)();
});

},{"./helpers/api":6,"./helpers/jquery":7,"./helpers/messenger":8,"./helpers/options":9,"./helpers/record-event":10,"./modules/focus-listener":14,"debug":1}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = getAPI;

var _window = require('./window');

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getAPI() {
	if (!(0, _window2.default)().wp || !(0, _window2.default)().wp.customize) {
		throw new Error('No WordPress customizer API found');
	}
	return (0, _window2.default)().wp.customize;
}

},{"./window":12}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = getJQuery;

var _window = require('./window');

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getJQuery() {
	return (0, _window2.default)().jQuery;
}

},{"./window":12}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.send = send;
exports.on = on;
exports.off = off;

var _api = require('./api');

var _api2 = _interopRequireDefault(_api);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('cdm:messenger');
var api = (0, _api2.default)();

function getPreview() {
	// wp-admin is previewer, frontend is preview. why? no idea.
	return typeof api.preview !== 'undefined' ? api.preview : api.previewer;
}

function send(id, data) {
	debug('send', id, data);
	return getPreview().send(id, data);
}

function on(id, callback) {
	debug('on', id, callback);
	return getPreview().bind(id, callback);
}

function off(id) {
	var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

	debug('off', id, callback);
	if (callback) {
		return getPreview().unbind(id, callback);
	}
	// no callback? Get rid of all of 'em
	var topic = getPreview().topics[id];
	if (topic) {
		return topic.empty();
	}
}

},{"./api":6,"debug":1}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = getOptions;

var _window = require('./window');

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getOptions() {
	return (0, _window2.default)()._Customizer_DM;
}

},{"./window":12}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.recordEvent = recordEvent;
exports.bindPreviewEventsListener = bindPreviewEventsListener;

var _window = require('./window');

var _window2 = _interopRequireDefault(_window);

var _messenger = require('./messenger');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('cdm:event');

function recordEvent(eventName) {
	var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	debug('recording Tracks event ' + eventName + ' with props:', props);
}

function bindPreviewEventsListener() {
	(0, _messenger.on)('recordEvent', function (data) {
		if (!data.name || !data.props) {
			return;
		}
		recordEvent(data.name, data.props);
	});
}

},{"./messenger":8,"./window":12,"debug":1}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.isPreviewing = isPreviewing;
exports.disablePreview = disablePreview;

var _jquery = require('./jquery');

var _jquery2 = _interopRequireDefault(_jquery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var $ = (0, _jquery2.default)();

function isPreviewing() {
	// Get truth from DOM. Gross.
	return $('.wp-full-overlay').hasClass('preview-only');
}

function disablePreview() {
	$('.customize-controls-preview-toggle').click();
}

},{"./jquery":7}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.setWindow = setWindow;
exports.default = getWindow;
var windowObj = null;

function setWindow(obj) {
	windowObj = obj;
}

function getWindow() {
	if (!windowObj && !window) {
		throw new Error('No window object found.');
	}
	return windowObj || window;
}

},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = focusCallout;

var _jquery = require('../helpers/jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('cdm:focus-callout');
var $ = (0, _jquery2.default)();

var timeout = void 0;

function addCallout(section, type) {
	// Highlight menu item controls
	if (section && section.container && type === 'menu') {
		var menuItems = section.container.find('.customize-control-nav_menu_item');
		if (menuItems.length) {
			debug('highlighting menu item', menuItems);
			return callout(menuItems);
		}
	}

	// Highlight header image "new" button
	if (section && section.btnNew && type === 'header_image') {
		var button = $(section.btnNew);
		if (button.length) {
			debug('highlighting "new" button', button);
			return callout(button);
		}
	}

	// Highlight widget
	if (section && section.container && type === 'widget') {
		debug('highlighting widget container');
		callout(section.container);
		// focus the first input, not the stupid toggle
		return section.container.find(':input').not('button').first().focus();
	}

	// Highlight whatever is focused
	var focused = $(':focus');
	if (focused.length) {
		debug('highlighting the focused element', focused);
		return callout(focused);
	}

	debug('could not find any focused element to highlight');
}

function callout($el) {
	$el.focus();
}

function focusCallout(section, type) {
	clearTimeout(timeout);
	section.focus();
	addCallout(section, type);
}

},{"../helpers/jquery":7,"debug":1}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = addFocusListener;

var _messenger = require('../helpers/messenger');

var _smallScreenPreview = require('../helpers/small-screen-preview');

var _focusCallout = require('./focus-callout');

var _focusCallout2 = _interopRequireDefault(_focusCallout);

var _recordEvent = require('../helpers/record-event');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('cdm:focus-listener');
var eventMap = {
	'focus-widget-control': 'widget',
	'focus-menu': 'menu',
	'focus-menu-location': 'menu',
	'focus-beaver-builder': 'beaver_builder'
};

function addFocusListener(eventName, getControlCallback) {
	(0, _messenger.on)(eventName, makeHandler(eventName, getControlCallback));
}

function makeHandler(eventName, getControlCallback) {
	return function () {
		for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		var eventTargetId = args[0];
		debug('received ' + eventName + ' event for target id ' + eventTargetId);
		var focusableControl = getControlCallback.apply(getControlCallback, args);
		if (!focusableControl) {
			debug('no control found for event ' + eventName + ' and args:', args);
			return;
		}

		var type = getEventType(eventName, eventTargetId);
		(0, _recordEvent.recordEvent)('wpcom_customize_direct_manipulation_click', { type: type });

		// If we are in the small screen preview mode, bring back the controls pane
		if ((0, _smallScreenPreview.isPreviewing)()) {
			debug('focusing controls pane');
			(0, _smallScreenPreview.disablePreview)();
		}

		(0, _focusCallout2.default)(focusableControl, type);
	};
}

function getEventType(eventName, eventTargetId) {
	return eventMap[eventName] ? eventMap[eventName] : eventTargetId;
}

},{"../helpers/messenger":8,"../helpers/record-event":10,"../helpers/small-screen-preview":11,"./focus-callout":13,"debug":1}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVidWcvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9kZWJ1Zy5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9ub2RlX21vZHVsZXMvbXMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwic3JjL2FkbWluLmpzIiwic3JjL2hlbHBlcnMvYXBpLmpzIiwic3JjL2hlbHBlcnMvanF1ZXJ5LmpzIiwic3JjL2hlbHBlcnMvbWVzc2VuZ2VyLmpzIiwic3JjL2hlbHBlcnMvb3B0aW9ucy5qcyIsInNyYy9oZWxwZXJzL3JlY29yZC1ldmVudC5qcyIsInNyYy9oZWxwZXJzL3NtYWxsLXNjcmVlbi1wcmV2aWV3LmpzIiwic3JjL2hlbHBlcnMvd2luZG93LmpzIiwic3JjL21vZHVsZXMvZm9jdXMtY2FsbG91dC5qcyIsInNyYy9tb2R1bGVzL2ZvY3VzLWxpc3RlbmVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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d0I7QUFKUixDQUFqQjs7QUFPZSxTQUFTLGdCQUFULENBQTJCLFNBQTNCLEVBQXNDLGtCQUF0QyxFQUEyRDtBQUN6RSxvQkFBSSxTQUFKLEVBQWUsWUFBYSxTQUFiLEVBQXdCLGtCQUF4QixDQUFmO0FBQ0E7O0FBRUQsU0FBUyxXQUFULENBQXNCLFNBQXRCLEVBQWlDLGtCQUFqQyxFQUFzRDtBQUNyRCxRQUFPLFlBQW9CO0FBQUEsb0NBQVAsSUFBTztBQUFQLE9BQU87QUFBQTs7QUFDMUIsTUFBTSxnQkFBZ0IsS0FBTSxDQUFOLENBQXRCO0FBQ0Esc0JBQW1CLFNBQW5CLDZCQUFvRCxhQUFwRDtBQUNBLE1BQU0sbUJBQW1CLG1CQUFtQixLQUFuQixDQUEwQixrQkFBMUIsRUFBOEMsSUFBOUMsQ0FBekI7QUFDQSxNQUFLLENBQUUsZ0JBQVAsRUFBMEI7QUFDekIseUNBQXFDLFNBQXJDLGlCQUE0RCxJQUE1RDtBQUNBO0FBQ0E7O0FBRUQsTUFBTSxPQUFPLGFBQWMsU0FBZCxFQUF5QixhQUF6QixDQUFiO0FBQ0EsZ0NBQWEsMkNBQWIsRUFBMEQsRUFBRSxVQUFGLEVBQTFEOztBQUVBO0FBQ0EsTUFBSyx1Q0FBTCxFQUFzQjtBQUNyQixTQUFPLHdCQUFQO0FBQ0E7QUFDQTs7QUFFRCw4QkFBYyxnQkFBZCxFQUFnQyxJQUFoQztBQUNBLEVBbkJEO0FBb0JBOztBQUVELFNBQVMsWUFBVCxDQUF1QixTQUF2QixFQUFrQyxhQUFsQyxFQUFrRDtBQUNqRCxRQUFPLFNBQVUsU0FBVixJQUF3QixTQUFVLFNBQVYsQ0FBeEIsR0FBZ0QsYUFBdkQ7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbi8qKlxuICogVGhpcyBpcyB0aGUgd2ViIGJyb3dzZXIgaW1wbGVtZW50YXRpb24gb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2RlYnVnJyk7XG5leHBvcnRzLmxvZyA9IGxvZztcbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuZXhwb3J0cy5zdG9yYWdlID0gJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIGNocm9tZVxuICAgICAgICAgICAgICAgJiYgJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIGNocm9tZS5zdG9yYWdlXG4gICAgICAgICAgICAgICAgICA/IGNocm9tZS5zdG9yYWdlLmxvY2FsXG4gICAgICAgICAgICAgICAgICA6IGxvY2Fsc3RvcmFnZSgpO1xuXG4vKipcbiAqIENvbG9ycy5cbiAqL1xuXG5leHBvcnRzLmNvbG9ycyA9IFtcbiAgJ2xpZ2h0c2VhZ3JlZW4nLFxuICAnZm9yZXN0Z3JlZW4nLFxuICAnZ29sZGVucm9kJyxcbiAgJ2RvZGdlcmJsdWUnLFxuICAnZGFya29yY2hpZCcsXG4gICdjcmltc29uJ1xuXTtcblxuLyoqXG4gKiBDdXJyZW50bHkgb25seSBXZWJLaXQtYmFzZWQgV2ViIEluc3BlY3RvcnMsIEZpcmVmb3ggPj0gdjMxLFxuICogYW5kIHRoZSBGaXJlYnVnIGV4dGVuc2lvbiAoYW55IEZpcmVmb3ggdmVyc2lvbikgYXJlIGtub3duXG4gKiB0byBzdXBwb3J0IFwiJWNcIiBDU1MgY3VzdG9taXphdGlvbnMuXG4gKlxuICogVE9ETzogYWRkIGEgYGxvY2FsU3RvcmFnZWAgdmFyaWFibGUgdG8gZXhwbGljaXRseSBlbmFibGUvZGlzYWJsZSBjb2xvcnNcbiAqL1xuXG5mdW5jdGlvbiB1c2VDb2xvcnMoKSB7XG4gIC8vIGlzIHdlYmtpdD8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTY0NTk2MDYvMzc2NzczXG4gIC8vIGRvY3VtZW50IGlzIHVuZGVmaW5lZCBpbiByZWFjdC1uYXRpdmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC1uYXRpdmUvcHVsbC8xNjMyXG4gIHJldHVybiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiAnV2Via2l0QXBwZWFyYW5jZScgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlKSB8fFxuICAgIC8vIGlzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcbiAgICAod2luZG93LmNvbnNvbGUgJiYgKGNvbnNvbGUuZmlyZWJ1ZyB8fCAoY29uc29sZS5leGNlcHRpb24gJiYgY29uc29sZS50YWJsZSkpKSB8fFxuICAgIC8vIGlzIGZpcmVmb3ggPj0gdjMxP1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuICAgIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSk7XG59XG5cbi8qKlxuICogTWFwICVqIHRvIGBKU09OLnN0cmluZ2lmeSgpYCwgc2luY2Ugbm8gV2ViIEluc3BlY3RvcnMgZG8gdGhhdCBieSBkZWZhdWx0LlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7XG59O1xuXG5cbi8qKlxuICogQ29sb3JpemUgbG9nIGFyZ3VtZW50cyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncygpIHtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcblxuICBhcmdzWzBdID0gKHVzZUNvbG9ycyA/ICclYycgOiAnJylcbiAgICArIHRoaXMubmFtZXNwYWNlXG4gICAgKyAodXNlQ29sb3JzID8gJyAlYycgOiAnICcpXG4gICAgKyBhcmdzWzBdXG4gICAgKyAodXNlQ29sb3JzID8gJyVjICcgOiAnICcpXG4gICAgKyAnKycgKyBleHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZik7XG5cbiAgaWYgKCF1c2VDb2xvcnMpIHJldHVybiBhcmdzO1xuXG4gIHZhciBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcbiAgYXJncyA9IFthcmdzWzBdLCBjLCAnY29sb3I6IGluaGVyaXQnXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncywgMSkpO1xuXG4gIC8vIHRoZSBmaW5hbCBcIiVjXCIgaXMgc29tZXdoYXQgdHJpY2t5LCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG90aGVyXG4gIC8vIGFyZ3VtZW50cyBwYXNzZWQgZWl0aGVyIGJlZm9yZSBvciBhZnRlciB0aGUgJWMsIHNvIHdlIG5lZWQgdG9cbiAgLy8gZmlndXJlIG91dCB0aGUgY29ycmVjdCBpbmRleCB0byBpbnNlcnQgdGhlIENTUyBpbnRvXG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBsYXN0QyA9IDA7XG4gIGFyZ3NbMF0ucmVwbGFjZSgvJVthLXolXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIGlmICgnJSUnID09PSBtYXRjaCkgcmV0dXJuO1xuICAgIGluZGV4Kys7XG4gICAgaWYgKCclYycgPT09IG1hdGNoKSB7XG4gICAgICAvLyB3ZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIHRoZSAqbGFzdCogJWNcbiAgICAgIC8vICh0aGUgdXNlciBtYXkgaGF2ZSBwcm92aWRlZCB0aGVpciBvd24pXG4gICAgICBsYXN0QyA9IGluZGV4O1xuICAgIH1cbiAgfSk7XG5cbiAgYXJncy5zcGxpY2UobGFzdEMsIDAsIGMpO1xuICByZXR1cm4gYXJncztcbn1cblxuLyoqXG4gKiBJbnZva2VzIGBjb25zb2xlLmxvZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBsb2coKSB7XG4gIC8vIHRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LzksIHdoZXJlXG4gIC8vIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG4gIHJldHVybiAnb2JqZWN0JyA9PT0gdHlwZW9mIGNvbnNvbGVcbiAgICAmJiBjb25zb2xlLmxvZ1xuICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzYXZlKG5hbWVzcGFjZXMpIHtcbiAgdHJ5IHtcbiAgICBpZiAobnVsbCA9PSBuYW1lc3BhY2VzKSB7XG4gICAgICBleHBvcnRzLnN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5zdG9yYWdlLmRlYnVnID0gbmFtZXNwYWNlcztcbiAgICB9XG4gIH0gY2F0Y2goZSkge31cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICB2YXIgcjtcbiAgdHJ5IHtcbiAgICByID0gZXhwb3J0cy5zdG9yYWdlLmRlYnVnO1xuICB9IGNhdGNoKGUpIHt9XG5cbiAgLy8gSWYgZGVidWcgaXNuJ3Qgc2V0IGluIExTLCBhbmQgd2UncmUgaW4gRWxlY3Ryb24sIHRyeSB0byBsb2FkICRERUJVR1xuICBpZiAoJ2VudicgaW4gKHR5cGVvZiBwcm9jZXNzID09PSAndW5kZWZpbmVkJyA/IHt9IDogcHJvY2VzcykpIHtcbiAgICByID0gcHJvY2Vzcy5lbnYuREVCVUc7XG4gIH1cbiAgXG4gIHJldHVybiByO1xufVxuXG4vKipcbiAqIEVuYWJsZSBuYW1lc3BhY2VzIGxpc3RlZCBpbiBgbG9jYWxTdG9yYWdlLmRlYnVnYCBpbml0aWFsbHkuXG4gKi9cblxuZXhwb3J0cy5lbmFibGUobG9hZCgpKTtcblxuLyoqXG4gKiBMb2NhbHN0b3JhZ2UgYXR0ZW1wdHMgdG8gcmV0dXJuIHRoZSBsb2NhbHN0b3JhZ2UuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBzYWZhcmkgdGhyb3dzXG4gKiB3aGVuIGEgdXNlciBkaXNhYmxlcyBjb29raWVzL2xvY2Fsc3RvcmFnZVxuICogYW5kIHlvdSBhdHRlbXB0IHRvIGFjY2VzcyBpdC5cbiAqXG4gKiBAcmV0dXJuIHtMb2NhbFN0b3JhZ2V9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2NhbHN0b3JhZ2UoKXtcbiAgdHJ5IHtcbiAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZTtcbiAgfSBjYXRjaCAoZSkge31cbn1cbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBkZWJ1Zy5kZWJ1ZyA9IGRlYnVnO1xuZXhwb3J0cy5jb2VyY2UgPSBjb2VyY2U7XG5leHBvcnRzLmRpc2FibGUgPSBkaXNhYmxlO1xuZXhwb3J0cy5lbmFibGUgPSBlbmFibGU7XG5leHBvcnRzLmVuYWJsZWQgPSBlbmFibGVkO1xuZXhwb3J0cy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cbi8qKlxuICogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXG4gKi9cblxuZXhwb3J0cy5uYW1lcyA9IFtdO1xuZXhwb3J0cy5za2lwcyA9IFtdO1xuXG4vKipcbiAqIE1hcCBvZiBzcGVjaWFsIFwiJW5cIiBoYW5kbGluZyBmdW5jdGlvbnMsIGZvciB0aGUgZGVidWcgXCJmb3JtYXRcIiBhcmd1bWVudC5cbiAqXG4gKiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlcmNhc2VkIGxldHRlciwgaS5lLiBcIm5cIi5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdHRlcnMgPSB7fTtcblxuLyoqXG4gKiBQcmV2aW91c2x5IGFzc2lnbmVkIGNvbG9yLlxuICovXG5cbnZhciBwcmV2Q29sb3IgPSAwO1xuXG4vKipcbiAqIFByZXZpb3VzIGxvZyB0aW1lc3RhbXAuXG4gKi9cblxudmFyIHByZXZUaW1lO1xuXG4vKipcbiAqIFNlbGVjdCBhIGNvbG9yLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNlbGVjdENvbG9yKCkge1xuICByZXR1cm4gZXhwb3J0cy5jb2xvcnNbcHJldkNvbG9yKysgJSBleHBvcnRzLmNvbG9ycy5sZW5ndGhdO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lc3BhY2VgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkZWJ1ZyhuYW1lc3BhY2UpIHtcblxuICAvLyBkZWZpbmUgdGhlIGBkaXNhYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBkaXNhYmxlZCgpIHtcbiAgfVxuICBkaXNhYmxlZC5lbmFibGVkID0gZmFsc2U7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZW5hYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBlbmFibGVkKCkge1xuXG4gICAgdmFyIHNlbGYgPSBlbmFibGVkO1xuXG4gICAgLy8gc2V0IGBkaWZmYCB0aW1lc3RhbXBcbiAgICB2YXIgY3VyciA9ICtuZXcgRGF0ZSgpO1xuICAgIHZhciBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG4gICAgc2VsZi5kaWZmID0gbXM7XG4gICAgc2VsZi5wcmV2ID0gcHJldlRpbWU7XG4gICAgc2VsZi5jdXJyID0gY3VycjtcbiAgICBwcmV2VGltZSA9IGN1cnI7XG5cbiAgICAvLyBhZGQgdGhlIGBjb2xvcmAgaWYgbm90IHNldFxuICAgIGlmIChudWxsID09IHNlbGYudXNlQ29sb3JzKSBzZWxmLnVzZUNvbG9ycyA9IGV4cG9ydHMudXNlQ29sb3JzKCk7XG4gICAgaWYgKG51bGwgPT0gc2VsZi5jb2xvciAmJiBzZWxmLnVzZUNvbG9ycykgc2VsZi5jb2xvciA9IHNlbGVjdENvbG9yKCk7XG5cbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgYXJnc1swXSA9IGV4cG9ydHMuY29lcmNlKGFyZ3NbMF0pO1xuXG4gICAgaWYgKCdzdHJpbmcnICE9PSB0eXBlb2YgYXJnc1swXSkge1xuICAgICAgLy8gYW55dGhpbmcgZWxzZSBsZXQncyBpbnNwZWN0IHdpdGggJW9cbiAgICAgIGFyZ3MgPSBbJyVvJ10uY29uY2F0KGFyZ3MpO1xuICAgIH1cblxuICAgIC8vIGFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXolXSkvZywgZnVuY3Rpb24obWF0Y2gsIGZvcm1hdCkge1xuICAgICAgLy8gaWYgd2UgZW5jb3VudGVyIGFuIGVzY2FwZWQgJSB0aGVuIGRvbid0IGluY3JlYXNlIHRoZSBhcnJheSBpbmRleFxuICAgICAgaWYgKG1hdGNoID09PSAnJSUnKSByZXR1cm4gbWF0Y2g7XG4gICAgICBpbmRleCsrO1xuICAgICAgdmFyIGZvcm1hdHRlciA9IGV4cG9ydHMuZm9ybWF0dGVyc1tmb3JtYXRdO1xuICAgICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmb3JtYXR0ZXIpIHtcbiAgICAgICAgdmFyIHZhbCA9IGFyZ3NbaW5kZXhdO1xuICAgICAgICBtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cbiAgICAgICAgLy8gbm93IHdlIG5lZWQgdG8gcmVtb3ZlIGBhcmdzW2luZGV4XWAgc2luY2UgaXQncyBpbmxpbmVkIGluIHRoZSBgZm9ybWF0YFxuICAgICAgICBhcmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGluZGV4LS07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG5cbiAgICAvLyBhcHBseSBlbnYtc3BlY2lmaWMgZm9ybWF0dGluZ1xuICAgIGFyZ3MgPSBleHBvcnRzLmZvcm1hdEFyZ3MuYXBwbHkoc2VsZiwgYXJncyk7XG5cbiAgICB2YXIgbG9nRm4gPSBlbmFibGVkLmxvZyB8fCBleHBvcnRzLmxvZyB8fCBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpO1xuICAgIGxvZ0ZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICB9XG4gIGVuYWJsZWQuZW5hYmxlZCA9IHRydWU7XG5cbiAgdmFyIGZuID0gZXhwb3J0cy5lbmFibGVkKG5hbWVzcGFjZSkgPyBlbmFibGVkIDogZGlzYWJsZWQ7XG5cbiAgZm4ubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuXG4gIHJldHVybiBmbjtcbn1cblxuLyoqXG4gKiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG4gKiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZShuYW1lc3BhY2VzKSB7XG4gIGV4cG9ydHMuc2F2ZShuYW1lc3BhY2VzKTtcblxuICB2YXIgc3BsaXQgPSAobmFtZXNwYWNlcyB8fCAnJykuc3BsaXQoL1tcXHMsXSsvKTtcbiAgdmFyIGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKCFzcGxpdFtpXSkgY29udGludWU7IC8vIGlnbm9yZSBlbXB0eSBzdHJpbmdzXG4gICAgbmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1tcXFxcXiQrPy4oKXxbXFxde31dL2csICdcXFxcJCYnKS5yZXBsYWNlKC9cXCovZywgJy4qPycpO1xuICAgIGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcbiAgICAgIGV4cG9ydHMuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMgKyAnJCcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRpc2FibGUoKSB7XG4gIGV4cG9ydHMuZW5hYmxlKCcnKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZWQobmFtZSkge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLnNraXBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMuc2tpcHNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMubmFtZXNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDb2VyY2UgYHZhbGAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuICByZXR1cm4gdmFsO1xufVxuIiwiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMFxudmFyIG0gPSBzICogNjBcbnZhciBoID0gbSAqIDYwXG52YXIgZCA9IGggKiAyNFxudmFyIHkgPSBkICogMzY1LjI1XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHRocm93cyB7RXJyb3J9IHRocm93IGFuIGVycm9yIGlmIHZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgbnVtYmVyXG4gKiBAcmV0dXJuIHtTdHJpbmd8TnVtYmVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWwsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsXG4gIGlmICh0eXBlID09PSAnc3RyaW5nJyAmJiB2YWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBwYXJzZSh2YWwpXG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ251bWJlcicgJiYgaXNOYU4odmFsKSA9PT0gZmFsc2UpIHtcbiAgICByZXR1cm4gb3B0aW9ucy5sb25nID9cblx0XHRcdGZtdExvbmcodmFsKSA6XG5cdFx0XHRmbXRTaG9ydCh2YWwpXG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCd2YWwgaXMgbm90IGEgbm9uLWVtcHR5IHN0cmluZyBvciBhIHZhbGlkIG51bWJlci4gdmFsPScgKyBKU09OLnN0cmluZ2lmeSh2YWwpKVxufVxuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgc3RyID0gU3RyaW5nKHN0cilcbiAgaWYgKHN0ci5sZW5ndGggPiAxMDAwMCkge1xuICAgIHJldHVyblxuICB9XG4gIHZhciBtYXRjaCA9IC9eKCg/OlxcZCspP1xcLj9cXGQrKSAqKG1pbGxpc2Vjb25kcz98bXNlY3M/fG1zfHNlY29uZHM/fHNlY3M/fHN8bWludXRlcz98bWlucz98bXxob3Vycz98aHJzP3xofGRheXM/fGR8eWVhcnM/fHlycz98eSk/JC9pLmV4ZWMoc3RyKVxuICBpZiAoIW1hdGNoKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIG4gPSBwYXJzZUZsb2F0KG1hdGNoWzFdKVxuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpXG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ3llYXJzJzpcbiAgICBjYXNlICd5ZWFyJzpcbiAgICBjYXNlICd5cnMnOlxuICAgIGNhc2UgJ3lyJzpcbiAgICBjYXNlICd5JzpcbiAgICAgIHJldHVybiBuICogeVxuICAgIGNhc2UgJ2RheXMnOlxuICAgIGNhc2UgJ2RheSc6XG4gICAgY2FzZSAnZCc6XG4gICAgICByZXR1cm4gbiAqIGRcbiAgICBjYXNlICdob3Vycyc6XG4gICAgY2FzZSAnaG91cic6XG4gICAgY2FzZSAnaHJzJzpcbiAgICBjYXNlICdocic6XG4gICAgY2FzZSAnaCc6XG4gICAgICByZXR1cm4gbiAqIGhcbiAgICBjYXNlICdtaW51dGVzJzpcbiAgICBjYXNlICdtaW51dGUnOlxuICAgIGNhc2UgJ21pbnMnOlxuICAgIGNhc2UgJ21pbic6XG4gICAgY2FzZSAnbSc6XG4gICAgICByZXR1cm4gbiAqIG1cbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3NlY3MnOlxuICAgIGNhc2UgJ3NlYyc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHNcbiAgICBjYXNlICdtaWxsaXNlY29uZHMnOlxuICAgIGNhc2UgJ21pbGxpc2Vjb25kJzpcbiAgICBjYXNlICdtc2Vjcyc6XG4gICAgY2FzZSAnbXNlYyc6XG4gICAgY2FzZSAnbXMnOlxuICAgICAgcmV0dXJuIG5cbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10U2hvcnQobXMpIHtcbiAgaWYgKG1zID49IGQpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGQpICsgJ2QnXG4gIH1cbiAgaWYgKG1zID49IGgpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnXG4gIH1cbiAgaWYgKG1zID49IG0pIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgJ20nXG4gIH1cbiAgaWYgKG1zID49IHMpIHtcbiAgICByZXR1cm4gTWF0aC5yb3VuZChtcyAvIHMpICsgJ3MnXG4gIH1cbiAgcmV0dXJuIG1zICsgJ21zJ1xufVxuXG4vKipcbiAqIExvbmcgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gZm10TG9uZyhtcykge1xuICByZXR1cm4gcGx1cmFsKG1zLCBkLCAnZGF5JykgfHxcbiAgICBwbHVyYWwobXMsIGgsICdob3VyJykgfHxcbiAgICBwbHVyYWwobXMsIG0sICdtaW51dGUnKSB8fFxuICAgIHBsdXJhbChtcywgcywgJ3NlY29uZCcpIHx8XG4gICAgbXMgKyAnIG1zJ1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbiwgbmFtZSkge1xuICBpZiAobXMgPCBuKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgaWYgKG1zIDwgbiAqIDEuNSkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKG1zIC8gbikgKyAnICcgKyBuYW1lXG4gIH1cbiAgcmV0dXJuIE1hdGguY2VpbChtcyAvIG4pICsgJyAnICsgbmFtZSArICdzJ1xufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsImltcG9ydCBnZXRBUEkgZnJvbSAnLi9oZWxwZXJzL2FwaSc7XG5pbXBvcnQgZ2V0SlF1ZXJ5IGZyb20gJy4vaGVscGVycy9qcXVlcnknO1xuaW1wb3J0IHsgb2ZmLCBzZW5kIH0gZnJvbSAnLi9oZWxwZXJzL21lc3Nlbmdlcic7XG5pbXBvcnQgYWRkRm9jdXNMaXN0ZW5lciBmcm9tICcuL21vZHVsZXMvZm9jdXMtbGlzdGVuZXInO1xuaW1wb3J0IHsgYmluZFByZXZpZXdFdmVudHNMaXN0ZW5lciB9IGZyb20gJy4vaGVscGVycy9yZWNvcmQtZXZlbnQnO1xuaW1wb3J0IGdldE9wdHMgZnJvbSAnLi9oZWxwZXJzL29wdGlvbnMnO1xuaW1wb3J0IGRlYnVnRmFjdG9yeSBmcm9tICdkZWJ1Zyc7XG5cbmNvbnN0IGRlYnVnID0gZGVidWdGYWN0b3J5KCAnY2RtOmFkbWluJyApO1xuY29uc3QgYXBpID0gZ2V0QVBJKCk7XG5jb25zdCAkID0gZ2V0SlF1ZXJ5KCk7XG5cbi8vIGRvIHNvbWUgZm9jdXNpbmdcbmFwaS5iaW5kKCAncmVhZHknLCAoKSA9PiB7XG5cdGRlYnVnKCAnYWRtaW4gaXMgcmVhZHknICk7XG5cblx0YWRkRm9jdXNMaXN0ZW5lciggJ2NvbnRyb2wtZm9jdXMnLCBpZCA9PiBhcGkuY29udHJvbCggaWQgKSApO1xuXHRhZGRGb2N1c0xpc3RlbmVyKCAnZm9jdXMtbWVudScsIGlkID0+IGFwaS5zZWN0aW9uKCBpZCApICk7XG5cdGFkZEZvY3VzTGlzdGVuZXIoICdmb2N1cy1tZW51LWxvY2F0aW9uJywgaWQgPT4gYXBpLmNvbnRyb2woIGBuYXZfbWVudV9sb2NhdGlvbnNbJHtpZH1dYCApICk7XG5cblx0Ly8gZGlzYWJsZSBjb3JlIHNvIHdlIGNhbiBlbmhhbmNlIGJ5IG1ha2luZyBzdXJlIHRoZSBjb250cm9scyBwYW5lbCBvcGVuc1xuXHQvLyBiZWZvcmUgdHJ5aW5nIHRvIGZvY3VzIHRoZSB3aWRnZXRcblx0b2ZmKCAnZm9jdXMtd2lkZ2V0LWNvbnRyb2wnLCBhcGkuV2lkZ2V0cy5mb2N1c1dpZGdldEZvcm1Db250cm9sICk7XG5cdGFkZEZvY3VzTGlzdGVuZXIoICdmb2N1cy13aWRnZXQtY29udHJvbCcsIGlkID0+IGFwaS5XaWRnZXRzLmdldFdpZGdldEZvcm1Db250cm9sRm9yV2lkZ2V0KCBpZCApICk7XG5cblx0Ly8gVG9nZ2xlIGljb25zIHdoZW4gY3VzdG9taXplciB0b2dnbGVzIHByZXZpZXcgbW9kZVxuXHQkKCAnLmNvbGxhcHNlLXNpZGViYXInICkub24oICdjbGljaycsICgpID0+IHNlbmQoICdjZG0tdG9nZ2xlLXZpc2libGUnICkgKTtcblxuXHQvLyBNYWtlIHRoZSBzaXRlIHRpdGxlIGNsaWNrYWJsZVxuXHQkKCAnLmN1c3RvbWl6ZS1pbmZvIC5zaXRlLXRpdGxlJyApLm9uKCAnY2xpY2snLCAoKSA9PiB7XG5cdFx0aWYgKCBhcGkucHJldmlld2VyICkge1xuXHRcdFx0YXBpLnByZXZpZXdlci50cmlnZ2VyKCAnY29udHJvbC1mb2N1cycsICdibG9nbmFtZScgKTtcblx0XHR9XG5cdH0gKTtcblxuXHRiaW5kUHJldmlld0V2ZW50c0xpc3RlbmVyKCk7XG5cbn0gKTtcbiIsImltcG9ydCBnZXRXaW5kb3cgZnJvbSAnLi93aW5kb3cnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBnZXRBUEkoKSB7XG5cdGlmICggISBnZXRXaW5kb3coKS53cCB8fCAhIGdldFdpbmRvdygpLndwLmN1c3RvbWl6ZSApIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoICdObyBXb3JkUHJlc3MgY3VzdG9taXplciBBUEkgZm91bmQnICk7XG5cdH1cblx0cmV0dXJuIGdldFdpbmRvdygpLndwLmN1c3RvbWl6ZTtcbn1cbiIsImltcG9ydCBnZXRXaW5kb3cgZnJvbSAnLi93aW5kb3cnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBnZXRKUXVlcnkoKSB7XG5cdHJldHVybiBnZXRXaW5kb3coKS5qUXVlcnk7XG59XG4iLCJpbXBvcnQgZ2V0QVBJIGZyb20gJy4vYXBpJztcbmltcG9ydCBkZWJ1Z0ZhY3RvcnkgZnJvbSAnZGVidWcnO1xuXG5jb25zdCBkZWJ1ZyA9IGRlYnVnRmFjdG9yeSggJ2NkbTptZXNzZW5nZXInICk7XG5jb25zdCBhcGkgPSBnZXRBUEkoKTtcblxuZnVuY3Rpb24gZ2V0UHJldmlldygpIHtcblx0Ly8gd3AtYWRtaW4gaXMgcHJldmlld2VyLCBmcm9udGVuZCBpcyBwcmV2aWV3LiB3aHk/IG5vIGlkZWEuXG5cdHJldHVybiB0eXBlb2YgYXBpLnByZXZpZXcgIT09ICd1bmRlZmluZWQnID8gYXBpLnByZXZpZXcgOiBhcGkucHJldmlld2VyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VuZCggaWQsIGRhdGEgKSB7XG5cdGRlYnVnKCAnc2VuZCcsIGlkLCBkYXRhICk7XG5cdHJldHVybiBnZXRQcmV2aWV3KCkuc2VuZCggaWQsIGRhdGEgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9uKCBpZCwgY2FsbGJhY2sgKSB7XG5cdGRlYnVnKCAnb24nLCBpZCwgY2FsbGJhY2sgKTtcblx0cmV0dXJuIGdldFByZXZpZXcoKS5iaW5kKCBpZCwgY2FsbGJhY2sgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9mZiggaWQsIGNhbGxiYWNrID0gZmFsc2UgKSB7XG5cdGRlYnVnKCAnb2ZmJywgaWQsIGNhbGxiYWNrICk7XG5cdGlmICggY2FsbGJhY2sgKSB7XG5cdFx0cmV0dXJuIGdldFByZXZpZXcoKS51bmJpbmQoIGlkLCBjYWxsYmFjayApO1xuXHR9XG5cdC8vIG5vIGNhbGxiYWNrPyBHZXQgcmlkIG9mIGFsbCBvZiAnZW1cblx0Y29uc3QgdG9waWMgPSBnZXRQcmV2aWV3KCkudG9waWNzWyBpZCBdO1xuXHRpZiAoIHRvcGljICkge1xuXHRcdHJldHVybiB0b3BpYy5lbXB0eSgpO1xuXHR9XG59XG4iLCJpbXBvcnQgZ2V0V2luZG93IGZyb20gJy4vd2luZG93JztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZ2V0T3B0aW9ucygpIHtcblx0cmV0dXJuIGdldFdpbmRvdygpLl9DdXN0b21pemVyX0RNO1xufVxuIiwiaW1wb3J0IGdldFdpbmRvdyBmcm9tICcuL3dpbmRvdyc7XG5pbXBvcnQgeyBvbiB9IGZyb20gJy4vbWVzc2VuZ2VyJztcbmltcG9ydCBkZWJ1Z0ZhY3RvcnkgZnJvbSAnZGVidWcnO1xuY29uc3QgZGVidWcgPSBkZWJ1Z0ZhY3RvcnkoICdjZG06ZXZlbnQnICk7XG5cbmV4cG9ydCBmdW5jdGlvbiByZWNvcmRFdmVudCggZXZlbnROYW1lLCBwcm9wcyA9IHt9ICkge1xuXHRkZWJ1ZyggYHJlY29yZGluZyBUcmFja3MgZXZlbnQgJHtldmVudE5hbWV9IHdpdGggcHJvcHM6YCwgcHJvcHMgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJpbmRQcmV2aWV3RXZlbnRzTGlzdGVuZXIoKSB7XG5cdG9uKCAncmVjb3JkRXZlbnQnLCBkYXRhID0+IHtcblx0XHRpZiAoICEgZGF0YS5uYW1lIHx8ICEgZGF0YS5wcm9wcyApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0cmVjb3JkRXZlbnQoIGRhdGEubmFtZSwgZGF0YS5wcm9wcyApO1xuXHR9ICk7XG59XG4iLCJpbXBvcnQgZ2V0SlF1ZXJ5IGZyb20gJy4vanF1ZXJ5JztcblxuY29uc3QgJCA9IGdldEpRdWVyeSgpO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNQcmV2aWV3aW5nKCkge1xuXHQvLyBHZXQgdHJ1dGggZnJvbSBET00uIEdyb3NzLlxuXHRyZXR1cm4gJCggJy53cC1mdWxsLW92ZXJsYXknICkuaGFzQ2xhc3MoICdwcmV2aWV3LW9ubHknICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXNhYmxlUHJldmlldygpIHtcblx0JCggJy5jdXN0b21pemUtY29udHJvbHMtcHJldmlldy10b2dnbGUnICkuY2xpY2soKTtcbn1cbiIsImxldCB3aW5kb3dPYmogPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0V2luZG93KCBvYmogKSB7XG5cdHdpbmRvd09iaiA9IG9iajtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZ2V0V2luZG93KCkge1xuXHRpZiAoICEgd2luZG93T2JqICYmICEgd2luZG93ICkge1xuXHRcdHRocm93IG5ldyBFcnJvciggJ05vIHdpbmRvdyBvYmplY3QgZm91bmQuJyApO1xuXHR9XG5cdHJldHVybiB3aW5kb3dPYmogfHwgd2luZG93O1xufVxuIiwiaW1wb3J0IGdldEpRdWVyeSBmcm9tICcuLi9oZWxwZXJzL2pxdWVyeSc7XG5pbXBvcnQgZGVidWdGYWN0b3J5IGZyb20gJ2RlYnVnJztcblxuY29uc3QgZGVidWcgPSBkZWJ1Z0ZhY3RvcnkoICdjZG06Zm9jdXMtY2FsbG91dCcgKTtcbmNvbnN0ICQgPSBnZXRKUXVlcnkoKTtcblxubGV0IHRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGFkZENhbGxvdXQoIHNlY3Rpb24sIHR5cGUgKSB7XG5cdC8vIEhpZ2hsaWdodCBtZW51IGl0ZW0gY29udHJvbHNcblx0aWYgKCBzZWN0aW9uICYmIHNlY3Rpb24uY29udGFpbmVyICYmIHR5cGUgPT09ICdtZW51JyApIHtcblx0XHRjb25zdCBtZW51SXRlbXMgPSBzZWN0aW9uLmNvbnRhaW5lci5maW5kKCAnLmN1c3RvbWl6ZS1jb250cm9sLW5hdl9tZW51X2l0ZW0nICk7XG5cdFx0aWYgKCBtZW51SXRlbXMubGVuZ3RoICkge1xuXHRcdFx0ZGVidWcoICdoaWdobGlnaHRpbmcgbWVudSBpdGVtJywgbWVudUl0ZW1zICk7XG5cdFx0XHRyZXR1cm4gY2FsbG91dCggbWVudUl0ZW1zICk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gSGlnaGxpZ2h0IGhlYWRlciBpbWFnZSBcIm5ld1wiIGJ1dHRvblxuXHRpZiAoIHNlY3Rpb24gJiYgc2VjdGlvbi5idG5OZXcgJiYgdHlwZSA9PT0gJ2hlYWRlcl9pbWFnZScgKSB7XG5cdFx0Y29uc3QgYnV0dG9uID0gJCggc2VjdGlvbi5idG5OZXcgKTtcblx0XHRpZiAoIGJ1dHRvbi5sZW5ndGggKSB7XG5cdFx0XHRkZWJ1ZyggJ2hpZ2hsaWdodGluZyBcIm5ld1wiIGJ1dHRvbicsIGJ1dHRvbiApO1xuXHRcdFx0cmV0dXJuIGNhbGxvdXQoIGJ1dHRvbiApO1xuXHRcdH1cblx0fVxuXG5cdC8vIEhpZ2hsaWdodCB3aWRnZXRcblx0aWYgKCBzZWN0aW9uICYmIHNlY3Rpb24uY29udGFpbmVyICYmIHR5cGUgPT09ICd3aWRnZXQnICkge1xuXHRcdGRlYnVnKCAnaGlnaGxpZ2h0aW5nIHdpZGdldCBjb250YWluZXInICk7XG5cdFx0Y2FsbG91dCggc2VjdGlvbi5jb250YWluZXIgKTtcblx0XHQvLyBmb2N1cyB0aGUgZmlyc3QgaW5wdXQsIG5vdCB0aGUgc3R1cGlkIHRvZ2dsZVxuXHRcdHJldHVybiBzZWN0aW9uLmNvbnRhaW5lci5maW5kKCAnOmlucHV0JyApLm5vdCggJ2J1dHRvbicgKS5maXJzdCgpLmZvY3VzKCk7XG5cdH1cblxuXHQvLyBIaWdobGlnaHQgd2hhdGV2ZXIgaXMgZm9jdXNlZFxuXHRjb25zdCBmb2N1c2VkID0gJCggJzpmb2N1cycgKTtcblx0aWYgKCBmb2N1c2VkLmxlbmd0aCApIHtcblx0XHRkZWJ1ZyggJ2hpZ2hsaWdodGluZyB0aGUgZm9jdXNlZCBlbGVtZW50JywgZm9jdXNlZCApO1xuXHRcdHJldHVybiBjYWxsb3V0KCBmb2N1c2VkICk7XG5cdH1cblxuXHRkZWJ1ZyggJ2NvdWxkIG5vdCBmaW5kIGFueSBmb2N1c2VkIGVsZW1lbnQgdG8gaGlnaGxpZ2h0JyApO1xufVxuXG5mdW5jdGlvbiBjYWxsb3V0KCAkZWwgKSB7XG5cdCRlbC5mb2N1cygpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBmb2N1c0NhbGxvdXQoIHNlY3Rpb24sIHR5cGUgKSB7XG5cdGNsZWFyVGltZW91dCggdGltZW91dCApO1xuXHRzZWN0aW9uLmZvY3VzKCk7XG5cdGFkZENhbGxvdXQoIHNlY3Rpb24sIHR5cGUgKTtcbn1cbiIsImltcG9ydCB7IG9uIH0gZnJvbSAnLi4vaGVscGVycy9tZXNzZW5nZXInO1xuaW1wb3J0IHsgaXNQcmV2aWV3aW5nLCBkaXNhYmxlUHJldmlldyB9IGZyb20gJy4uL2hlbHBlcnMvc21hbGwtc2NyZWVuLXByZXZpZXcnO1xuaW1wb3J0IGZvY3VzQ2FsbG91dCBmcm9tICcuL2ZvY3VzLWNhbGxvdXQnO1xuaW1wb3J0IHsgcmVjb3JkRXZlbnQgfSBmcm9tICcuLi9oZWxwZXJzL3JlY29yZC1ldmVudCc7XG5pbXBvcnQgZGVidWdGYWN0b3J5IGZyb20gJ2RlYnVnJztcblxuY29uc3QgZGVidWcgPSBkZWJ1Z0ZhY3RvcnkoICdjZG06Zm9jdXMtbGlzdGVuZXInICk7XG5jb25zdCBldmVudE1hcCA9IHtcblx0J2ZvY3VzLXdpZGdldC1jb250cm9sJzogJ3dpZGdldCcsXG5cdCdmb2N1cy1tZW51JzogJ21lbnUnLFxuXHQnZm9jdXMtbWVudS1sb2NhdGlvbic6ICdtZW51Jyxcblx0J2ZvY3VzLWJlYXZlci1idWlsZGVyJzogJ2JlYXZlcl9idWlsZGVyJ1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gYWRkRm9jdXNMaXN0ZW5lciggZXZlbnROYW1lLCBnZXRDb250cm9sQ2FsbGJhY2sgKSB7XG5cdG9uKCBldmVudE5hbWUsIG1ha2VIYW5kbGVyKCBldmVudE5hbWUsIGdldENvbnRyb2xDYWxsYmFjayApICk7XG59XG5cbmZ1bmN0aW9uIG1ha2VIYW5kbGVyKCBldmVudE5hbWUsIGdldENvbnRyb2xDYWxsYmFjayApIHtcblx0cmV0dXJuIGZ1bmN0aW9uKCAuLi5hcmdzICkge1xuXHRcdGNvbnN0IGV2ZW50VGFyZ2V0SWQgPSBhcmdzWyAwIF07XG5cdFx0ZGVidWcoIGByZWNlaXZlZCAke2V2ZW50TmFtZX0gZXZlbnQgZm9yIHRhcmdldCBpZCAke2V2ZW50VGFyZ2V0SWR9YCApO1xuXHRcdGNvbnN0IGZvY3VzYWJsZUNvbnRyb2wgPSBnZXRDb250cm9sQ2FsbGJhY2suYXBwbHkoIGdldENvbnRyb2xDYWxsYmFjaywgYXJncyApO1xuXHRcdGlmICggISBmb2N1c2FibGVDb250cm9sICkge1xuXHRcdFx0ZGVidWcoIGBubyBjb250cm9sIGZvdW5kIGZvciBldmVudCAke2V2ZW50TmFtZX0gYW5kIGFyZ3M6YCwgYXJncyApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IHR5cGUgPSBnZXRFdmVudFR5cGUoIGV2ZW50TmFtZSwgZXZlbnRUYXJnZXRJZCApO1xuXHRcdHJlY29yZEV2ZW50KCAnd3Bjb21fY3VzdG9taXplX2RpcmVjdF9tYW5pcHVsYXRpb25fY2xpY2snLCB7IHR5cGUgfSApO1xuXG5cdFx0Ly8gSWYgd2UgYXJlIGluIHRoZSBzbWFsbCBzY3JlZW4gcHJldmlldyBtb2RlLCBicmluZyBiYWNrIHRoZSBjb250cm9scyBwYW5lXG5cdFx0aWYgKCBpc1ByZXZpZXdpbmcoKSApIHtcblx0XHRcdGRlYnVnKCAnZm9jdXNpbmcgY29udHJvbHMgcGFuZScgKTtcblx0XHRcdGRpc2FibGVQcmV2aWV3KCk7XG5cdFx0fVxuXG5cdFx0Zm9jdXNDYWxsb3V0KCBmb2N1c2FibGVDb250cm9sLCB0eXBlICk7XG5cdH07XG59XG5cbmZ1bmN0aW9uIGdldEV2ZW50VHlwZSggZXZlbnROYW1lLCBldmVudFRhcmdldElkICkge1xuXHRyZXR1cm4gZXZlbnRNYXBbIGV2ZW50TmFtZSBdID8gZXZlbnRNYXBbIGV2ZW50TmFtZSBdIDogZXZlbnRUYXJnZXRJZDtcbn1cbiJdfQ==
