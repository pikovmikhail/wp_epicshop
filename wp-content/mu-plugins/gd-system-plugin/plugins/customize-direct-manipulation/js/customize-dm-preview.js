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

},{"./window":13}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = addClickHandler;

var _jquery = require('../helpers/jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('cdm:click-handler');
var $ = (0, _jquery2.default)();

function addClickHandler(clickTarget, handler) {
	debug('adding click handler to target', clickTarget);
	return $('body').on('click', clickTarget, handler);
}

},{"../helpers/jquery":8,"debug":1}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.positionIcon = positionIcon;
exports.addClickHandlerToIcon = addClickHandlerToIcon;
exports.repositionIcons = repositionIcons;
exports.repositionAfterFontsLoad = repositionAfterFontsLoad;
exports.enableIconToggle = enableIconToggle;

var _window = require('../helpers/window');

var _window2 = _interopRequireDefault(_window);

var _jquery = require('../helpers/jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _messenger = require('../helpers/messenger');

var _underscore = require('../helpers/underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _clickHandler = require('../helpers/click-handler');

var _clickHandler2 = _interopRequireDefault(_clickHandler);

var _options = require('../helpers/options');

var _options2 = _interopRequireDefault(_options);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = (0, _underscore2.default)();
var debug = (0, _debug2.default)('cdm:icon-buttons');
var $ = (0, _jquery2.default)();

// Icons from: https://github.com/WordPress/dashicons/tree/master/svg
// Elements will default to using `editIcon` but if an element has the `icon`
// property set, it will use that as the key for one of these icons instead:
var icons = {
	headerIcon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="20" viewBox="0 0 20 20"><path d="M2.25 1h15.5c0.69 0 1.25 0.56 1.25 1.25v15.5c0 0.69-0.56 1.25-1.25 1.25h-15.5c-0.69 0-1.25-0.56-1.25-1.25v-15.5c0-0.69 0.56-1.25 1.25-1.25zM17 17v-14h-14v14h14zM10 6c0-1.1-0.9-2-2-2s-2 0.9-2 2 0.9 2 2 2 2-0.9 2-2zM13 11c0 0 0-6 3-6v10c0 0.55-0.45 1-1 1h-10c-0.55 0-1-0.45-1-1v-7c2 0 3 4 3 4s1-3 3-3 3 2 3 2z"></path></svg>',
	editIcon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="20" viewBox="0 0 20 20"><path d="M13.89 3.39l2.71 2.72c0.46 0.46 0.42 1.24 0.030 1.64l-8.010 8.020-5.56 1.16 1.16-5.58s7.6-7.63 7.99-8.030c0.39-0.39 1.22-0.39 1.68 0.070zM11.16 6.18l-5.59 5.61 1.11 1.11 5.54-5.65zM8.19 14.41l5.58-5.6-1.070-1.080-5.59 5.6z"></path></svg>',
	pageBuilderIcon: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="20" viewBox="0 0 20 20"><path d="M19 16v-13c0-0.55-0.45-1-1-1h-15c-0.55 0-1 0.45-1 1v13c0 0.55 0.45 1 1 1h15c0.55 0 1-0.45 1-1zM4 4h13v4h-13v-4zM5 5v2h3v-2h-3zM9 5v2h3v-2h-3zM13 5v2h3v-2h-3zM4.5 10c0.28 0 0.5 0.22 0.5 0.5s-0.22 0.5-0.5 0.5-0.5-0.22-0.5-0.5 0.22-0.5 0.5-0.5zM6 10h4v1h-4v-1zM12 10h5v5h-5v-5zM4.5 12c0.28 0 0.5 0.22 0.5 0.5s-0.22 0.5-0.5 0.5-0.5-0.22-0.5-0.5 0.22-0.5 0.5-0.5zM6 12h4v1h-4v-1zM13 12v2h3v-2h-3zM4.5 14c0.28 0 0.5 0.22 0.5 0.5s-0.22 0.5-0.5 0.5-0.5-0.22-0.5-0.5 0.22-0.5 0.5-0.5zM6 14h4v1h-4v-1z"></path></svg>'
};

/**
 * Create (if necessary) and position an icon button relative to its target.
 *
 * See `makeFocusable` for the format of the `element` param.
 *
 * If positioning the icon was successful, this function returns a copy of the
 * element it was passed with the additional parameters `$target` and `$icon`
 * that are cached references to the DOM elements. If the positioning failed, it
 * just returns the element unchanged.
 *
 * @param {Object} element - The data to use when constructing the icon.
 * @return {Object} The element that was passed, with additional data included.
 */
function positionIcon(element) {
	var $target = getElementTarget(element);
	if (!$target.length) {
		debug('Could not find target element for icon ' + element.id + ' with selector ' + element.selector);
		return element;
	}
	var $icon = findOrCreateIcon(element);
	var css = getCalculatedCssForIcon(element, $target, $icon);
	debug('positioning icon for ' + element.id + ' with CSS ' + JSON.stringify(css));
	$icon.css(css);
	return _.extend({}, element, { $target: $target, $icon: $icon });
}

function addClickHandlerToIcon(element) {
	if (!element.$icon) {
		return element;
	}
	(0, _clickHandler2.default)('.' + getIconClassName(element.id), element.handler);
	return element;
}

var iconRepositioner = _.debounce(function (elements) {
	debug('repositioning ' + elements.length + ' icons');
	elements.map(positionIcon);
}, 350);

function repositionIcons(elements) {
	iconRepositioner(elements);
}

function repositionAfterFontsLoad(elements) {
	iconRepositioner(elements);

	if ((0, _window2.default)().document.fonts) {
		(0, _window2.default)().document.fonts.ready.then(iconRepositioner.bind(null, elements));
	}
}

/**
 * Toggle icons when customizer toggles preview mode.
 */
function enableIconToggle() {
	(0, _messenger.on)('cdm-toggle-visible', function () {
		return $('.cdm-icon').toggleClass('cdm-icon--hidden');
	});
}

function findOrCreateIcon(element) {
	if (element.$icon) {
		return element.$icon;
	}
	var $icon = $('.' + getIconClassName(element.id));
	if ($icon.length) {
		return $icon;
	}

	var $widget_location = getWidgetLocation(element.selector);

	var title = (0, _options2.default)().translations[element.type] || 'Click to edit the ' + element.title;

	return createAndAppendIcon(element.id, element.icon, title, $widget_location);
}

function getWidgetLocation(selector) {

	// Site info wrapper (below footer)
	if ($(selector).parents('.site-title-wrapper').length || $(selector).parents('.site-title').length) {

		return 'site-title-widget';
	}

	// Hero
	if ($(selector).hasClass('hero')) {

		return 'hero-widget';
	}

	// Page Builder (below footer)
	if (_Customizer_DM.beaver_builder) {

		return 'page-builder-widget';
	}

	// Footer Widget
	if ($(selector).parents('.footer-widget').length) {

		return 'footer-widget';
	}

	// Site info wrapper (below footer)
	if ($(selector).parents('.site-info-wrapper').length) {

		return 'site-info-wrapper-widget';
	}

	return 'default';
}

function getIconClassName(id) {
	return 'cdm-icon__' + id;
}

function getCalculatedCssForIcon(element, $target, $icon) {
	var position = element.position;
	var hiddenIconPos = 'rtl' === (0, _window2.default)().document.dir ? { right: -1000, left: 'auto' } : { left: -1000, right: 'auto' };

	if (!$target.is(':visible')) {
		debug('target is not visible when positioning ' + element.id + '. I will hide the icon. target:', $target);
		return hiddenIconPos;
	}
	var offset = $target.offset();
	var top = offset.top;
	var left = offset.left;
	var middle = $target.innerHeight() / 2;
	var iconMiddle = $icon.innerHeight() / 2;
	if (top < 0) {
		debug('target top offset ' + top + ' is unusually low when positioning ' + element.id + '. I will hide the icon. target:', $target);
		return hiddenIconPos;
	}
	if (middle < 0) {
		debug('target middle offset ' + middle + ' is unusually low when positioning ' + element.id + '. I will hide the icon. target:', $target);
		return hiddenIconPos;
	}
	if (top < 1) {
		debug('target top offset ' + top + ' is unusually low when positioning ' + element.id + '. I will adjust the icon downwards. target:', $target);
		top = 0;
	}
	if (middle < 1) {
		debug('target middle offset ' + middle + ' is unusually low when positioning ' + element.id + '. I will adjust the icon downwards. target:', $target);
		middle = 0;
		iconMiddle = 0;
	}
	if (position === 'middle') {
		return adjustCoordinates({ top: top + middle - iconMiddle, left: left, right: 'auto' });
	} else if (position === 'top-right') {
		return adjustCoordinates({ top: top, left: left + $target.width() + 70, right: 'auto' });
	}
	return adjustCoordinates({ top: top, left: left, right: 'auto' });
}

function adjustCoordinates(coords) {
	var minWidth = 35;
	// Try to avoid overlapping hamburger menus
	var maxWidth = (0, _window2.default)().innerWidth - 110;
	if (coords.left < minWidth) {
		coords.left = minWidth;
	}
	if (coords.left >= maxWidth) {
		coords.left = maxWidth;
	}
	return coords;
}

function createIcon(id, iconType, title, widget_location) {
	var iconClassName = getIconClassName(id);
	var scheme = (0, _options2.default)().icon_color;
	var theme = (0, _options2.default)().theme;

	switch (iconType) {
		case 'headerIcon':
			return $('<div class="cdm-icon cdm-icon--header-image ' + iconClassName + ' ' + scheme + ' ' + theme + ' ' + widget_location + '" title="' + title + '">' + icons.headerIcon + '</div>');
		case 'pageBuilderIcon':
			return $('<div class="cdm-icon cdm-icon--page-builder ' + iconClassName + ' ' + scheme + ' ' + theme + ' ' + widget_location + '" title="' + title + '">' + icons.pageBuilderIcon + '</div>');
		default:
			return $('<div class="cdm-icon cdm-icon--text ' + iconClassName + ' ' + scheme + ' ' + theme + ' ' + widget_location + '" title="' + title + '">' + icons.editIcon + '</div>');
	}
}

function createAndAppendIcon(id, iconType, title, widget_location) {
	var $icon = createIcon(id, iconType, title, widget_location);
	$((0, _window2.default)().document.body).append($icon);
	return $icon;
}

function getElementTarget(element) {
	if (element.$target && !element.$target.parent().length) {
		// target was removed from DOM, likely by partial refresh
		element.$target = null;
	}
	return element.$target || $(element.selector);
}

},{"../helpers/click-handler":6,"../helpers/jquery":8,"../helpers/messenger":9,"../helpers/options":10,"../helpers/underscore":11,"../helpers/window":13,"debug":1}],8:[function(require,module,exports){
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

},{"./window":13}],9:[function(require,module,exports){
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

},{"./api":5,"debug":1}],10:[function(require,module,exports){
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

},{"./window":13}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = getUnderscore;

var _window = require('./window');

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getUnderscore() {
	return (0, _window2.default)()._;
}

},{"./window":13}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.getUserAgent = getUserAgent;
exports.isSafari = isSafari;
exports.isMobileSafari = isMobileSafari;

var _window = require('../helpers/window');

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getUserAgent() {
	return (0, _window2.default)().navigator.userAgent;
}

function isSafari() {
	return !!getUserAgent().match(/Version\/[\d\.]+.*Safari/);
}

function isMobileSafari() {
	return !!getUserAgent().match(/(iPod|iPhone|iPad)/);
}

},{"../helpers/window":13}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.modifyEditPostLinks = modifyEditPostLinks;
exports.disableEditPostLinks = disableEditPostLinks;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _window = require('../helpers/window');

var _window2 = _interopRequireDefault(_window);

var _jquery = require('../helpers/jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _messenger = require('../helpers/messenger');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var $ = (0, _jquery2.default)();
var debug = (0, _debug2.default)('cdm:edit-post-links');

function modifyEditPostLinks(selector) {
	debug('listening for clicks on post edit links with selector', selector);
	// We use mousedown because click has been blocked by some other JS
	$('body').on('mousedown', selector, function (event) {
		(0, _window2.default)().open(event.target.href);
		(0, _messenger.send)('recordEvent', {
			name: 'wpcom_customize_direct_manipulation_click',
			props: { type: 'post-edit' }
		});
	});
}

function disableEditPostLinks(selector) {
	debug('hiding post edit links with selector', selector);
	$(selector).hide();
}

},{"../helpers/jquery":8,"../helpers/messenger":9,"../helpers/window":13,"debug":1}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = makeFocusable;

var _window = require('../helpers/window');

var _window2 = _interopRequireDefault(_window);

var _api = require('../helpers/api');

var _api2 = _interopRequireDefault(_api);

var _jquery = require('../helpers/jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _messenger = require('../helpers/messenger');

var _iconButtons = require('../helpers/icon-buttons');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('cdm:focusable');
var api = (0, _api2.default)();
var $ = (0, _jquery2.default)();

/**
 * Give DOM elements an icon button bound to click handlers
 *
 * Accepts an array of element objects of the form:
 *
 * {
 * 	id: A string to identify this element
 * 	selector: A CSS selector string to uniquely target the DOM element
 * 	type: A string to group the element, eg: 'widget'
 * 	position: (optional) A string for positioning the icon, one of 'top-left' (default), 'top-right', or 'middle' (vertically center)
 * 	icon (optional): A string specifying which icon to use. See options in icon-buttons.js
 * 	handler (optional): A callback function which will be called when the icon is clicked
 * }
 *
 * If no handler is specified, the default will be used, which will send
 * `control-focus` to the API with the element ID.
 *
 * @param {Array} elements - An array of element objects of the form above.
 */
function makeFocusable(elements) {
	var elementsWithIcons = elements.reduce(removeDuplicateReducer, []).map(_iconButtons.positionIcon).map(createHandler).map(_iconButtons.addClickHandlerToIcon);

	if (elementsWithIcons.length) {
		startIconMonitor(elementsWithIcons);
		(0, _iconButtons.enableIconToggle)();
	}
}

function makeRepositioner(elements, changeType) {
	return function () {
		debug('detected change:', changeType);
		(0, _iconButtons.repositionAfterFontsLoad)(elements);
	};
}

/**
 * Register a group of listeners to reposition icon buttons if the DOM changes.
 *
 * See `makeFocusable` for the format of the `elements` param.
 *
 * @param {Array} elements - The element objects.
 */
function startIconMonitor(elements) {
	// Reposition icons after any theme fonts load
	(0, _iconButtons.repositionAfterFontsLoad)(elements);

	// Reposition icons after a few seconds just in case (eg: infinite scroll or other scripts complete)
	setTimeout(makeRepositioner(elements, 'follow-up'), 2000);

	// Reposition icons after the window is resized
	$((0, _window2.default)()).resize(makeRepositioner(elements, 'resize'));

	// Reposition icons after the text of any element changes
	elements.filter(function (el) {
		return ['siteTitle', 'headerIcon'].indexOf(el.type) !== -1;
	}).map(function (el) {
		return api(el.id, function (value) {
			return value.bind(makeRepositioner(elements, 'title or header'));
		});
	});

	// When the widget partial refresh runs, reposition icons
	api.bind('widget-updated', makeRepositioner(elements, 'widgets'));

	// Reposition icons after any customizer setting is changed
	api.bind('change', makeRepositioner(elements, 'any setting'));

	var $document = $((0, _window2.default)().document);

	// Reposition after menus updated
	$document.on('customize-preview-menu-refreshed', makeRepositioner(elements, 'menus'));

	// Reposition after scrolling in case there are fixed position elements
	$document.on('scroll', makeRepositioner(elements, 'scroll'));

	// Reposition after page click (eg: hamburger menus)
	$document.on('click', makeRepositioner(elements, 'click'));

	// Reposition after any page changes (if the browser supports it)
	var page = (0, _window2.default)().document.querySelector('#page');
	if (page && MutationObserver) {
		var observer = new MutationObserver(makeRepositioner(elements, 'DOM mutation'));
		observer.observe(page, { attributes: true, childList: true, characterData: true });
	}
}

function createHandler(element) {
	element.handler = element.handler || makeDefaultHandler(element.id);
	return element;
}

function removeDuplicateReducer(prev, el) {
	if (prev.map(function (x) {
		return x.id;
	}).indexOf(el.id) !== -1) {
		debug('tried to add duplicate element for ' + el.id);
		return prev;
	}
	return prev.concat(el);
}

function makeDefaultHandler(id) {
	return function (event) {
		event.preventDefault();
		event.stopPropagation();
		debug('click detected on', id);
		(0, _messenger.send)('control-focus', id);
	};
}

},{"../helpers/api":5,"../helpers/icon-buttons":7,"../helpers/jquery":8,"../helpers/messenger":9,"../helpers/window":13,"debug":1}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.getFooterElements = getFooterElements;
function getFooterElements() {
	return [{
		id: 'footercredit',
		selector: 'a[data-type="footer-credit"]',
		type: 'footerCredit',
		position: 'middle',
		title: 'footer credit'
	}];
}

},{}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.getHeaderElements = getHeaderElements;

var _jquery = require('../helpers/jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('cdm:header-focus');
var fallbackSelector = 'header[role="banner"]';
var $ = (0, _jquery2.default)();

function getHeaderElements() {
	return [getHeaderElement()];
}

function getHeaderElement() {
	var selector = getHeaderSelector();
	var position = selector === fallbackSelector ? 'top-right' : null;
	return { id: 'header_image', selector: selector, type: 'header', icon: 'headerIcon', position: position, title: 'header image' };
}

function getHeaderSelector() {
	var selector = getModifiedSelectors();
	if ($(selector).length > 0) {
		return selector;
	}
	debug('failed to find header image selector in page; using fallback');
	return fallbackSelector;
}

function getModifiedSelectors() {
	return ['.header-image a img', '.header-image img', '.site-branding a img', '.site-header-image img', '.header-image-link img', 'img.header-image', 'img.header-img', 'img.headerimage', 'img.custom-header', '.featured-header-image a img'].map(function (selector) {
		return selector + '[src]:not(\'.site-logo\'):not(\'.wp-post-image\'):not(\'.custom-logo\')';
	}).join();
}

},{"../helpers/jquery":8,"debug":1}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.getMenuElements = getMenuElements;

var _messenger = require('../helpers/messenger');

var _options = require('../helpers/options.js');

var _options2 = _interopRequireDefault(_options);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var opts = (0, _options2.default)();

function getMenuElements() {
	return opts.menus.map(function (menu) {
		return {
			id: menu.id,
			selector: '.' + menu.id + ' li:first-child',
			type: 'menu',
			handler: makeHandler(menu.location),
			title: 'menu'
		};
	});
}

function makeHandler(id) {
	return function () {
		(0, _messenger.send)('focus-menu', id);
	};
}

},{"../helpers/messenger":9,"../helpers/options.js":10}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.getPageBuilderElements = getPageBuilderElements;

var _window = require('../helpers/window');

var _window2 = _interopRequireDefault(_window);

var _jquery = require('../helpers/jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _messenger = require('../helpers/messenger');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('cdm:page-builder-focus');
var $ = (0, _jquery2.default)();

function getPageBuilderElements() {
	var selector = '.site-main';
	var $el = $(selector);
	if (!$el.length) {
		debug('found no page builder for selector ' + selector);
		return [];
	}
	if (!_Customizer_DM.beaver_builder) {

		return [];
	}
	return $.makeArray($el).reduce(function (posts, post) {
		var url = getPageBuilderLink();
		return posts.concat({
			id: post.id,
			selector: selector,
			type: 'page_builder',
			position: 'top',
			handler: makeHandler(post.id, url),
			title: 'page_builder',
			icon: 'pageBuilderIcon'
		});
	}, []);
}

function getPageBuilderLink() {
	var url = _Customizer_DM.page_builder_link;
	if (!url) {
		debug('invalid edit link URL for page builder');
	}
	return url;
}

function makeHandler(id, url) {
	return function (event) {
		event.preventDefault();
		event.stopPropagation();
		debug('click detected on page builder');
		(0, _window2.default)().open(url);
		(0, _messenger.send)('recordEvent', {
			name: 'wpcom_customize_direct_manipulation_click',
			props: { type: 'page-builder-icon' }
		});
	};
}

},{"../helpers/jquery":8,"../helpers/messenger":9,"../helpers/window":13,"debug":1}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.getWidgetElements = getWidgetElements;

var _api = require('../helpers/api');

var _api2 = _interopRequireDefault(_api);

var _messenger = require('../helpers/messenger');

var _jquery = require('../helpers/jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('cdm:widgets');
var api = (0, _api2.default)();
var $ = (0, _jquery2.default)();

function getWidgetElements() {
	return getWidgetSelectors().map(getWidgetsForSelector).reduce(function (widgets, id) {
		return widgets.concat(id);
	}, []) // flatten the arrays
	.map(function (id) {
		return {
			id: id,
			selector: getWidgetSelectorForId(id),
			type: 'widget',
			handler: makeHandlerForId(id),
			title: 'widget'
		};
	});
}

function getWidgetSelectors() {
	return api.WidgetCustomizerPreview.widgetSelectors;
}

function getWidgetsForSelector(selector) {
	var $el = $(selector);
	if (!$el.length) {
		debug('found no widgets for selector', selector);
		return [];
	}
	debug('found widgets for selector', selector, $el);
	return $.makeArray($el.map(function (i, w) {
		return w.id;
	}));
}

function getWidgetSelectorForId(id) {
	return '#' + id;
}

function makeHandlerForId(id) {
	return function (event) {
		event.preventDefault();
		event.stopPropagation();
		debug('click detected on', id);
		(0, _messenger.send)('focus-widget-control', id);
	};
}

},{"../helpers/api":5,"../helpers/jquery":8,"../helpers/messenger":9,"debug":1}],21:[function(require,module,exports){
'use strict';

var _window = require('./helpers/window');

var _window2 = _interopRequireDefault(_window);

var _api = require('./helpers/api');

var _api2 = _interopRequireDefault(_api);

var _jquery = require('./helpers/jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _options = require('./helpers/options');

var _options2 = _interopRequireDefault(_options);

var _userAgent = require('./helpers/user-agent');

var _focusable = require('./modules/focusable');

var _focusable2 = _interopRequireDefault(_focusable);

var _editPostLinks = require('./modules/edit-post-links');

var _headerFocus = require('./modules/header-focus');

var _widgetFocus = require('./modules/widget-focus');

var _menuFocus = require('./modules/menu-focus');

var _pageBuilderFocus = require('./modules/page-builder-focus');

var _footerFocus = require('./modules/footer-focus');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var options = (0, _options2.default)();
var api = (0, _api2.default)();
var $ = (0, _jquery2.default)();

function startDirectManipulation() {

	var basicElements = _Customizer_DM.is_wp_four_seven ? [] : [{ id: 'blogname', selector: '.site-title a, #site-title a', type: 'siteTitle', position: 'middle', title: 'site title' }];

	var widgets = _Customizer_DM.is_wp_four_seven ? [] : (0, _widgetFocus.getWidgetElements)();
	var headers = options.headerImageSupport ? (0, _headerFocus.getHeaderElements)() : [];

	var menus = (0, _menuFocus.getMenuElements)();
	var footers = (0, _footerFocus.getFooterElements)();
	var pb_elements = (0, _pageBuilderFocus.getPageBuilderElements)();

	(0, _focusable2.default)(basicElements.concat(headers, widgets, menus, footers, pb_elements));

	if (-1 === options.disabledModules.indexOf('edit-post-links')) {
		if ((0, _userAgent.isSafari)() && !(0, _userAgent.isMobileSafari)()) {
			(0, _editPostLinks.disableEditPostLinks)('.post-edit-link, [href^="https://wordpress.com/post"], [href^="https://wordpress.com/page"]');
		} else {
			(0, _editPostLinks.modifyEditPostLinks)('.post-edit-link, [href^="https://wordpress.com/post"], [href^="https://wordpress.com/page"]');
		}
	}
}

api.bind('preview-ready', function () {
	// the widget customizer doesn't run until document.ready, so let's run later
	$((0, _window2.default)().document).ready(function () {
		return setTimeout(startDirectManipulation, 100);
	});
});

},{"./helpers/api":5,"./helpers/jquery":8,"./helpers/options":10,"./helpers/user-agent":12,"./helpers/window":13,"./modules/edit-post-links":14,"./modules/focusable":15,"./modules/footer-focus":16,"./modules/header-focus":17,"./modules/menu-focus":18,"./modules/page-builder-focus":19,"./modules/widget-focus":20}]},{},[21])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVidWcvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9kZWJ1Zy5qcyIsIm5vZGVfbW9kdWxlcy9kZWJ1Zy9ub2RlX21vZHVsZXMvbXMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwic3JjL2hlbHBlcnMvYXBpLmpzIiwic3JjL2hlbHBlcnMvY2xpY2staGFuZGxlci5qcyIsInNyYy9oZWxwZXJzL2ljb24tYnV0dG9ucy5qcyIsInNyYy9oZWxwZXJzL2pxdWVyeS5qcyIsInNyYy9oZWxwZXJzL21lc3Nlbmdlci5qcyIsInNyYy9oZWxwZXJzL29wdGlvbnMuanMiLCJzcmMvaGVscGVycy91bmRlcnNjb3JlLmpzIiwic3JjL2hlbHBlcnMvdXNlci1hZ2VudC5qcyIsInNyYy9oZWxwZXJzL3dpbmRvdy5qcyIsInNyYy9tb2R1bGVzL2VkaXQtcG9zdC1saW5rcy5qcyIsInNyYy9tb2R1bGVzL2ZvY3VzYWJsZS5qcyIsInNyYy9tb2R1bGVzL2Zvb3Rlci1mb2N1cy5qcyIsInNyYy9tb2R1bGVzL2hlYWRlci1mb2N1cy5qcyIsInNyYy9tb2R1bGVzL21lbnUtZm9jdXMuanMiLCJzcmMvbW9kdWxlcy9wYWdlLWJ1aWxkZXItZm9jdXMuanMiLCJzcmMvbW9kdWxlcy93aWRnZXQtZm9jdXMuanMiLCJzcmMvcHJldmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztrQkNsTHdCLE07O0FBRnhCOzs7Ozs7QUFFZSxTQUFTLE1BQVQsR0FBa0I7QUFDaEMsS0FBSyxDQUFFLHdCQUFZLEVBQWQsSUFBb0IsQ0FBRSx3QkFBWSxFQUFaLENBQWUsU0FBMUMsRUFBc0Q7QUFDckQsUUFBTSxJQUFJLEtBQUosQ0FB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QkFBNUIsRUFBNEQsTUFBTSxXQUFsRSxFQUErRSxVQUFVLFFBQXpGLEVBQW1HLE9BQU8sWUFBMUcsRUFEZ0UsQ0FBakU7O0FBSUEsS0FBTSxVQUFZLGVBQWUsZ0JBQWpCLEdBQXNDLEVBQXRDLEdBQTJDLHFDQUEzRDtBQUNBLEtBQU0sVUFBWSxRQUFRLGtCQUFWLEdBQWlDLHFDQUFqQyxHQUF1RCxFQUF2RTs7QUFFQSxLQUFNLFFBQVEsaUNBQWQ7QUFDQSxLQUFNLFVBQVUscUNBQWhCO0FBQ0EsS0FBTSxjQUFjLCtDQUFwQjs7QUFFQSwwQkFBZSxjQUFjLE1BQWQsQ0FBc0IsT0FBdEIsRUFBK0IsT0FBL0IsRUFBd0MsS0FBeEMsRUFBK0MsT0FBL0MsRUFBd0QsV0FBeEQsQ0FBZjs7QUFFQSxLQUFLLENBQUMsQ0FBRCxLQUFPLFFBQVEsZUFBUixDQUF3QixPQUF4QixDQUFpQyxpQkFBakMsQ0FBWixFQUFtRTtBQUNsRSxNQUFLLDhCQUFjLENBQUUsZ0NBQXJCLEVBQXdDO0FBQ3ZDLDRDQUFzQiw2RkFBdEI7QUFDQSxHQUZELE1BRU87QUFDTiwyQ0FBcUIsNkZBQXJCO0FBQ0E7QUFDRDtBQUNEOztBQUVELElBQUksSUFBSixDQUFVLGVBQVYsRUFBMkIsWUFBTTtBQUNoQztBQUNBLEdBQUcsd0JBQVksUUFBZixFQUEwQixLQUExQixDQUFpQztBQUFBLFNBQU0sV0FBWSx1QkFBWixFQUFxQyxHQUFyQyxDQUFOO0FBQUEsRUFBakM7QUFDQSxDQUhEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSB3ZWIgYnJvd3NlciBpbXBsZW1lbnRhdGlvbiBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbmV4cG9ydHMubG9nID0gbG9nO1xuZXhwb3J0cy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcbmV4cG9ydHMuc2F2ZSA9IHNhdmU7XG5leHBvcnRzLmxvYWQgPSBsb2FkO1xuZXhwb3J0cy51c2VDb2xvcnMgPSB1c2VDb2xvcnM7XG5leHBvcnRzLnN0b3JhZ2UgPSAndW5kZWZpbmVkJyAhPSB0eXBlb2YgY2hyb21lXG4gICAgICAgICAgICAgICAmJiAndW5kZWZpbmVkJyAhPSB0eXBlb2YgY2hyb21lLnN0b3JhZ2VcbiAgICAgICAgICAgICAgICAgID8gY2hyb21lLnN0b3JhZ2UubG9jYWxcbiAgICAgICAgICAgICAgICAgIDogbG9jYWxzdG9yYWdlKCk7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuICAnbGlnaHRzZWFncmVlbicsXG4gICdmb3Jlc3RncmVlbicsXG4gICdnb2xkZW5yb2QnLFxuICAnZG9kZ2VyYmx1ZScsXG4gICdkYXJrb3JjaGlkJyxcbiAgJ2NyaW1zb24nXG5dO1xuXG4vKipcbiAqIEN1cnJlbnRseSBvbmx5IFdlYktpdC1iYXNlZCBXZWIgSW5zcGVjdG9ycywgRmlyZWZveCA+PSB2MzEsXG4gKiBhbmQgdGhlIEZpcmVidWcgZXh0ZW5zaW9uIChhbnkgRmlyZWZveCB2ZXJzaW9uKSBhcmUga25vd25cbiAqIHRvIHN1cHBvcnQgXCIlY1wiIENTUyBjdXN0b21pemF0aW9ucy5cbiAqXG4gKiBUT0RPOiBhZGQgYSBgbG9jYWxTdG9yYWdlYCB2YXJpYWJsZSB0byBleHBsaWNpdGx5IGVuYWJsZS9kaXNhYmxlIGNvbG9yc1xuICovXG5cbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcbiAgLy8gaXMgd2Via2l0PyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNjQ1OTYwNi8zNzY3NzNcbiAgLy8gZG9jdW1lbnQgaXMgdW5kZWZpbmVkIGluIHJlYWN0LW5hdGl2ZTogaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0LW5hdGl2ZS9wdWxsLzE2MzJcbiAgcmV0dXJuICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmICdXZWJraXRBcHBlYXJhbmNlJyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUpIHx8XG4gICAgLy8gaXMgZmlyZWJ1Zz8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzk4MTIwLzM3Njc3M1xuICAgICh3aW5kb3cuY29uc29sZSAmJiAoY29uc29sZS5maXJlYnVnIHx8IChjb25zb2xlLmV4Y2VwdGlvbiAmJiBjb25zb2xlLnRhYmxlKSkpIHx8XG4gICAgLy8gaXMgZmlyZWZveCA+PSB2MzE/XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Ub29scy9XZWJfQ29uc29sZSNTdHlsaW5nX21lc3NhZ2VzXG4gICAgKG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKTtcbn1cblxuLyoqXG4gKiBNYXAgJWogdG8gYEpTT04uc3RyaW5naWZ5KClgLCBzaW5jZSBubyBXZWIgSW5zcGVjdG9ycyBkbyB0aGF0IGJ5IGRlZmF1bHQuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcbn07XG5cblxuLyoqXG4gKiBDb2xvcml6ZSBsb2cgYXJndW1lbnRzIGlmIGVuYWJsZWQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRBcmdzKCkge1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIHVzZUNvbG9ycyA9IHRoaXMudXNlQ29sb3JzO1xuXG4gIGFyZ3NbMF0gPSAodXNlQ29sb3JzID8gJyVjJyA6ICcnKVxuICAgICsgdGhpcy5uYW1lc3BhY2VcbiAgICArICh1c2VDb2xvcnMgPyAnICVjJyA6ICcgJylcbiAgICArIGFyZ3NbMF1cbiAgICArICh1c2VDb2xvcnMgPyAnJWMgJyA6ICcgJylcbiAgICArICcrJyArIGV4cG9ydHMuaHVtYW5pemUodGhpcy5kaWZmKTtcblxuICBpZiAoIXVzZUNvbG9ycykgcmV0dXJuIGFyZ3M7XG5cbiAgdmFyIGMgPSAnY29sb3I6ICcgKyB0aGlzLmNvbG9yO1xuICBhcmdzID0gW2FyZ3NbMF0sIGMsICdjb2xvcjogaW5oZXJpdCddLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzLCAxKSk7XG5cbiAgLy8gdGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcbiAgLy8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuICAvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIGxhc3RDID0gMDtcbiAgYXJnc1swXS5yZXBsYWNlKC8lW2EteiVdL2csIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgaWYgKCclJScgPT09IG1hdGNoKSByZXR1cm47XG4gICAgaW5kZXgrKztcbiAgICBpZiAoJyVjJyA9PT0gbWF0Y2gpIHtcbiAgICAgIC8vIHdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuICAgICAgLy8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcbiAgICAgIGxhc3RDID0gaW5kZXg7XG4gICAgfVxuICB9KTtcblxuICBhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG4gIHJldHVybiBhcmdzO1xufVxuXG4vKipcbiAqIEludm9rZXMgYGNvbnNvbGUubG9nKClgIHdoZW4gYXZhaWxhYmxlLlxuICogTm8tb3Agd2hlbiBgY29uc29sZS5sb2dgIGlzIG5vdCBhIFwiZnVuY3Rpb25cIi5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGxvZygpIHtcbiAgLy8gdGhpcyBoYWNrZXJ5IGlzIHJlcXVpcmVkIGZvciBJRTgvOSwgd2hlcmVcbiAgLy8gdGhlIGBjb25zb2xlLmxvZ2AgZnVuY3Rpb24gZG9lc24ndCBoYXZlICdhcHBseSdcbiAgcmV0dXJuICdvYmplY3QnID09PSB0eXBlb2YgY29uc29sZVxuICAgICYmIGNvbnNvbGUubG9nXG4gICAgJiYgRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5LmNhbGwoY29uc29sZS5sb2csIGNvbnNvbGUsIGFyZ3VtZW50cyk7XG59XG5cbi8qKlxuICogU2F2ZSBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNhdmUobmFtZXNwYWNlcykge1xuICB0cnkge1xuICAgIGlmIChudWxsID09IG5hbWVzcGFjZXMpIHtcbiAgICAgIGV4cG9ydHMuc3RvcmFnZS5yZW1vdmVJdGVtKCdkZWJ1ZycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHBvcnRzLnN0b3JhZ2UuZGVidWcgPSBuYW1lc3BhY2VzO1xuICAgIH1cbiAgfSBjYXRjaChlKSB7fVxufVxuXG4vKipcbiAqIExvYWQgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gcmV0dXJucyB0aGUgcHJldmlvdXNseSBwZXJzaXN0ZWQgZGVidWcgbW9kZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvYWQoKSB7XG4gIHZhciByO1xuICB0cnkge1xuICAgIHIgPSBleHBvcnRzLnN0b3JhZ2UuZGVidWc7XG4gIH0gY2F0Y2goZSkge31cblxuICAvLyBJZiBkZWJ1ZyBpc24ndCBzZXQgaW4gTFMsIGFuZCB3ZSdyZSBpbiBFbGVjdHJvbiwgdHJ5IHRvIGxvYWQgJERFQlVHXG4gIGlmICgnZW52JyBpbiAodHlwZW9mIHByb2Nlc3MgPT09ICd1bmRlZmluZWQnID8ge30gOiBwcm9jZXNzKSkge1xuICAgIHIgPSBwcm9jZXNzLmVudi5ERUJVRztcbiAgfVxuICBcbiAgcmV0dXJuIHI7XG59XG5cbi8qKlxuICogRW5hYmxlIG5hbWVzcGFjZXMgbGlzdGVkIGluIGBsb2NhbFN0b3JhZ2UuZGVidWdgIGluaXRpYWxseS5cbiAqL1xuXG5leHBvcnRzLmVuYWJsZShsb2FkKCkpO1xuXG4vKipcbiAqIExvY2Fsc3RvcmFnZSBhdHRlbXB0cyB0byByZXR1cm4gdGhlIGxvY2Fsc3RvcmFnZS5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHNhZmFyaSB0aHJvd3NcbiAqIHdoZW4gYSB1c2VyIGRpc2FibGVzIGNvb2tpZXMvbG9jYWxzdG9yYWdlXG4gKiBhbmQgeW91IGF0dGVtcHQgdG8gYWNjZXNzIGl0LlxuICpcbiAqIEByZXR1cm4ge0xvY2FsU3RvcmFnZX1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvY2Fsc3RvcmFnZSgpe1xuICB0cnkge1xuICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlO1xuICB9IGNhdGNoIChlKSB7fVxufVxuIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIGNvbW1vbiBsb2dpYyBmb3IgYm90aCB0aGUgTm9kZS5qcyBhbmQgd2ViIGJyb3dzZXJcbiAqIGltcGxlbWVudGF0aW9ucyBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGRlYnVnLmRlYnVnID0gZGVidWc7XG5leHBvcnRzLmNvZXJjZSA9IGNvZXJjZTtcbmV4cG9ydHMuZGlzYWJsZSA9IGRpc2FibGU7XG5leHBvcnRzLmVuYWJsZSA9IGVuYWJsZTtcbmV4cG9ydHMuZW5hYmxlZCA9IGVuYWJsZWQ7XG5leHBvcnRzLmh1bWFuaXplID0gcmVxdWlyZSgnbXMnKTtcblxuLyoqXG4gKiBUaGUgY3VycmVudGx5IGFjdGl2ZSBkZWJ1ZyBtb2RlIG5hbWVzLCBhbmQgbmFtZXMgdG8gc2tpcC5cbiAqL1xuXG5leHBvcnRzLm5hbWVzID0gW107XG5leHBvcnRzLnNraXBzID0gW107XG5cbi8qKlxuICogTWFwIG9mIHNwZWNpYWwgXCIlblwiIGhhbmRsaW5nIGZ1bmN0aW9ucywgZm9yIHRoZSBkZWJ1ZyBcImZvcm1hdFwiIGFyZ3VtZW50LlxuICpcbiAqIFZhbGlkIGtleSBuYW1lcyBhcmUgYSBzaW5nbGUsIGxvd2VyY2FzZWQgbGV0dGVyLCBpLmUuIFwiblwiLlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycyA9IHt9O1xuXG4vKipcbiAqIFByZXZpb3VzbHkgYXNzaWduZWQgY29sb3IuXG4gKi9cblxudmFyIHByZXZDb2xvciA9IDA7XG5cbi8qKlxuICogUHJldmlvdXMgbG9nIHRpbWVzdGFtcC5cbiAqL1xuXG52YXIgcHJldlRpbWU7XG5cbi8qKlxuICogU2VsZWN0IGEgY29sb3IuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2VsZWN0Q29sb3IoKSB7XG4gIHJldHVybiBleHBvcnRzLmNvbG9yc1twcmV2Q29sb3IrKyAlIGV4cG9ydHMuY29sb3JzLmxlbmd0aF07XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZGVidWdnZXIgd2l0aCB0aGUgZ2l2ZW4gYG5hbWVzcGFjZWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRlYnVnKG5hbWVzcGFjZSkge1xuXG4gIC8vIGRlZmluZSB0aGUgYGRpc2FibGVkYCB2ZXJzaW9uXG4gIGZ1bmN0aW9uIGRpc2FibGVkKCkge1xuICB9XG4gIGRpc2FibGVkLmVuYWJsZWQgPSBmYWxzZTtcblxuICAvLyBkZWZpbmUgdGhlIGBlbmFibGVkYCB2ZXJzaW9uXG4gIGZ1bmN0aW9uIGVuYWJsZWQoKSB7XG5cbiAgICB2YXIgc2VsZiA9IGVuYWJsZWQ7XG5cbiAgICAvLyBzZXQgYGRpZmZgIHRpbWVzdGFtcFxuICAgIHZhciBjdXJyID0gK25ldyBEYXRlKCk7XG4gICAgdmFyIG1zID0gY3VyciAtIChwcmV2VGltZSB8fCBjdXJyKTtcbiAgICBzZWxmLmRpZmYgPSBtcztcbiAgICBzZWxmLnByZXYgPSBwcmV2VGltZTtcbiAgICBzZWxmLmN1cnIgPSBjdXJyO1xuICAgIHByZXZUaW1lID0gY3VycjtcblxuICAgIC8vIGFkZCB0aGUgYGNvbG9yYCBpZiBub3Qgc2V0XG4gICAgaWYgKG51bGwgPT0gc2VsZi51c2VDb2xvcnMpIHNlbGYudXNlQ29sb3JzID0gZXhwb3J0cy51c2VDb2xvcnMoKTtcbiAgICBpZiAobnVsbCA9PSBzZWxmLmNvbG9yICYmIHNlbGYudXNlQ29sb3JzKSBzZWxmLmNvbG9yID0gc2VsZWN0Q29sb3IoKTtcblxuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBhcmdzWzBdID0gZXhwb3J0cy5jb2VyY2UoYXJnc1swXSk7XG5cbiAgICBpZiAoJ3N0cmluZycgIT09IHR5cGVvZiBhcmdzWzBdKSB7XG4gICAgICAvLyBhbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlb1xuICAgICAgYXJncyA9IFsnJW8nXS5jb25jYXQoYXJncyk7XG4gICAgfVxuXG4gICAgLy8gYXBwbHkgYW55IGBmb3JtYXR0ZXJzYCB0cmFuc2Zvcm1hdGlvbnNcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIGFyZ3NbMF0gPSBhcmdzWzBdLnJlcGxhY2UoLyUoW2EteiVdKS9nLCBmdW5jdGlvbihtYXRjaCwgZm9ybWF0KSB7XG4gICAgICAvLyBpZiB3ZSBlbmNvdW50ZXIgYW4gZXNjYXBlZCAlIHRoZW4gZG9uJ3QgaW5jcmVhc2UgdGhlIGFycmF5IGluZGV4XG4gICAgICBpZiAobWF0Y2ggPT09ICclJScpIHJldHVybiBtYXRjaDtcbiAgICAgIGluZGV4Kys7XG4gICAgICB2YXIgZm9ybWF0dGVyID0gZXhwb3J0cy5mb3JtYXR0ZXJzW2Zvcm1hdF07XG4gICAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGZvcm1hdHRlcikge1xuICAgICAgICB2YXIgdmFsID0gYXJnc1tpbmRleF07XG4gICAgICAgIG1hdGNoID0gZm9ybWF0dGVyLmNhbGwoc2VsZiwgdmFsKTtcblxuICAgICAgICAvLyBub3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXG4gICAgICAgIGFyZ3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaW5kZXgtLTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcblxuICAgIC8vIGFwcGx5IGVudi1zcGVjaWZpYyBmb3JtYXR0aW5nXG4gICAgYXJncyA9IGV4cG9ydHMuZm9ybWF0QXJncy5hcHBseShzZWxmLCBhcmdzKTtcblxuICAgIHZhciBsb2dGbiA9IGVuYWJsZWQubG9nIHx8IGV4cG9ydHMubG9nIHx8IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSk7XG4gICAgbG9nRm4uYXBwbHkoc2VsZiwgYXJncyk7XG4gIH1cbiAgZW5hYmxlZC5lbmFibGVkID0gdHJ1ZTtcblxuICB2YXIgZm4gPSBleHBvcnRzLmVuYWJsZWQobmFtZXNwYWNlKSA/IGVuYWJsZWQgOiBkaXNhYmxlZDtcblxuICBmbi5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG5cbiAgcmV0dXJuIGZuO1xufVxuXG4vKipcbiAqIEVuYWJsZXMgYSBkZWJ1ZyBtb2RlIGJ5IG5hbWVzcGFjZXMuIFRoaXMgY2FuIGluY2x1ZGUgbW9kZXNcbiAqIHNlcGFyYXRlZCBieSBhIGNvbG9uIGFuZCB3aWxkY2FyZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlKG5hbWVzcGFjZXMpIHtcbiAgZXhwb3J0cy5zYXZlKG5hbWVzcGFjZXMpO1xuXG4gIHZhciBzcGxpdCA9IChuYW1lc3BhY2VzIHx8ICcnKS5zcGxpdCgvW1xccyxdKy8pO1xuICB2YXIgbGVuID0gc3BsaXQubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoIXNwbGl0W2ldKSBjb250aW51ZTsgLy8gaWdub3JlIGVtcHR5IHN0cmluZ3NcbiAgICBuYW1lc3BhY2VzID0gc3BsaXRbaV0ucmVwbGFjZSgvW1xcXFxeJCs/LigpfFtcXF17fV0vZywgJ1xcXFwkJicpLnJlcGxhY2UoL1xcKi9nLCAnLio/Jyk7XG4gICAgaWYgKG5hbWVzcGFjZXNbMF0gPT09ICctJykge1xuICAgICAgZXhwb3J0cy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcy5zdWJzdHIoMSkgKyAnJCcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERpc2FibGUgZGVidWcgb3V0cHV0LlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGlzYWJsZSgpIHtcbiAgZXhwb3J0cy5lbmFibGUoJycpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbW9kZSBuYW1lIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5uYW1lc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENvZXJjZSBgdmFsYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiB2YWwuc3RhY2sgfHwgdmFsLm1lc3NhZ2U7XG4gIHJldHVybiB2YWw7XG59XG4iLCIvKipcbiAqIEhlbHBlcnMuXG4gKi9cblxudmFyIHMgPSAxMDAwXG52YXIgbSA9IHMgKiA2MFxudmFyIGggPSBtICogNjBcbnZhciBkID0gaCAqIDI0XG52YXIgeSA9IGQgKiAzNjUuMjVcblxuLyoqXG4gKiBQYXJzZSBvciBmb3JtYXQgdGhlIGdpdmVuIGB2YWxgLlxuICpcbiAqIE9wdGlvbnM6XG4gKlxuICogIC0gYGxvbmdgIHZlcmJvc2UgZm9ybWF0dGluZyBbZmFsc2VdXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSB2YWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAdGhyb3dzIHtFcnJvcn0gdGhyb3cgYW4gZXJyb3IgaWYgdmFsIGlzIG5vdCBhIG5vbi1lbXB0eSBzdHJpbmcgb3IgYSBudW1iZXJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWxcbiAgaWYgKHR5cGUgPT09ICdzdHJpbmcnICYmIHZhbC5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIHBhcnNlKHZhbClcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnbnVtYmVyJyAmJiBpc05hTih2YWwpID09PSBmYWxzZSkge1xuICAgIHJldHVybiBvcHRpb25zLmxvbmcgP1xuXHRcdFx0Zm10TG9uZyh2YWwpIDpcblx0XHRcdGZtdFNob3J0KHZhbClcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ3ZhbCBpcyBub3QgYSBub24tZW1wdHkgc3RyaW5nIG9yIGEgdmFsaWQgbnVtYmVyLiB2YWw9JyArIEpTT04uc3RyaW5naWZ5KHZhbCkpXG59XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGBzdHJgIGFuZCByZXR1cm4gbWlsbGlzZWNvbmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHN0cikge1xuICBzdHIgPSBTdHJpbmcoc3RyKVxuICBpZiAoc3RyLmxlbmd0aCA+IDEwMDAwKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdmFyIG1hdGNoID0gL14oKD86XFxkKyk/XFwuP1xcZCspICoobWlsbGlzZWNvbmRzP3xtc2Vjcz98bXN8c2Vjb25kcz98c2Vjcz98c3xtaW51dGVzP3xtaW5zP3xtfGhvdXJzP3xocnM/fGh8ZGF5cz98ZHx5ZWFycz98eXJzP3x5KT8kL2kuZXhlYyhzdHIpXG4gIGlmICghbWF0Y2gpIHtcbiAgICByZXR1cm5cbiAgfVxuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pXG4gIHZhciB0eXBlID0gKG1hdGNoWzJdIHx8ICdtcycpLnRvTG93ZXJDYXNlKClcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAneWVhcnMnOlxuICAgIGNhc2UgJ3llYXInOlxuICAgIGNhc2UgJ3lycyc6XG4gICAgY2FzZSAneXInOlxuICAgIGNhc2UgJ3knOlxuICAgICAgcmV0dXJuIG4gKiB5XG4gICAgY2FzZSAnZGF5cyc6XG4gICAgY2FzZSAnZGF5JzpcbiAgICBjYXNlICdkJzpcbiAgICAgIHJldHVybiBuICogZFxuICAgIGNhc2UgJ2hvdXJzJzpcbiAgICBjYXNlICdob3VyJzpcbiAgICBjYXNlICdocnMnOlxuICAgIGNhc2UgJ2hyJzpcbiAgICBjYXNlICdoJzpcbiAgICAgIHJldHVybiBuICogaFxuICAgIGNhc2UgJ21pbnV0ZXMnOlxuICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgY2FzZSAnbWlucyc6XG4gICAgY2FzZSAnbWluJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbVxuICAgIGNhc2UgJ3NlY29uZHMnOlxuICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgY2FzZSAnc2Vjcyc6XG4gICAgY2FzZSAnc2VjJzpcbiAgICBjYXNlICdzJzpcbiAgICAgIHJldHVybiBuICogc1xuICAgIGNhc2UgJ21pbGxpc2Vjb25kcyc6XG4gICAgY2FzZSAnbWlsbGlzZWNvbmQnOlxuICAgIGNhc2UgJ21zZWNzJzpcbiAgICBjYXNlICdtc2VjJzpcbiAgICBjYXNlICdtcyc6XG4gICAgICByZXR1cm4gblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gIH1cbn1cblxuLyoqXG4gKiBTaG9ydCBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBmbXRTaG9ydChtcykge1xuICBpZiAobXMgPj0gZCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCdcbiAgfVxuICBpZiAobXMgPj0gaCkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyAnaCdcbiAgfVxuICBpZiAobXMgPj0gbSkge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gbSkgKyAnbSdcbiAgfVxuICBpZiAobXMgPj0gcykge1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncydcbiAgfVxuICByZXR1cm4gbXMgKyAnbXMnXG59XG5cbi8qKlxuICogTG9uZyBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBmbXRMb25nKG1zKSB7XG4gIHJldHVybiBwbHVyYWwobXMsIGQsICdkYXknKSB8fFxuICAgIHBsdXJhbChtcywgaCwgJ2hvdXInKSB8fFxuICAgIHBsdXJhbChtcywgbSwgJ21pbnV0ZScpIHx8XG4gICAgcGx1cmFsKG1zLCBzLCAnc2Vjb25kJykgfHxcbiAgICBtcyArICcgbXMnXG59XG5cbi8qKlxuICogUGx1cmFsaXphdGlvbiBoZWxwZXIuXG4gKi9cblxuZnVuY3Rpb24gcGx1cmFsKG1zLCBuLCBuYW1lKSB7XG4gIGlmIChtcyA8IG4pIHtcbiAgICByZXR1cm5cbiAgfVxuICBpZiAobXMgPCBuICogMS41KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IobXMgLyBuKSArICcgJyArIG5hbWVcbiAgfVxuICByZXR1cm4gTWF0aC5jZWlsKG1zIC8gbikgKyAnICcgKyBuYW1lICsgJ3MnXG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiaW1wb3J0IGdldFdpbmRvdyBmcm9tICcuL3dpbmRvdyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGdldEFQSSgpIHtcblx0aWYgKCAhIGdldFdpbmRvdygpLndwIHx8ICEgZ2V0V2luZG93KCkud3AuY3VzdG9taXplICkge1xuXHRcdHRocm93IG5ldyBFcnJvciggJ05vIFdvcmRQcmVzcyBjdXN0b21pemVyIEFQSSBmb3VuZCcgKTtcblx0fVxuXHRyZXR1cm4gZ2V0V2luZG93KCkud3AuY3VzdG9taXplO1xufVxuIiwiaW1wb3J0IGdldEpRdWVyeSBmcm9tICcuLi9oZWxwZXJzL2pxdWVyeSc7XG5pbXBvcnQgZGVidWdGYWN0b3J5IGZyb20gJ2RlYnVnJztcblxuY29uc3QgZGVidWcgPSBkZWJ1Z0ZhY3RvcnkoICdjZG06Y2xpY2staGFuZGxlcicgKTtcbmNvbnN0ICQgPSBnZXRKUXVlcnkoKTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gYWRkQ2xpY2tIYW5kbGVyKCBjbGlja1RhcmdldCwgaGFuZGxlciApIHtcblx0ZGVidWcoICdhZGRpbmcgY2xpY2sgaGFuZGxlciB0byB0YXJnZXQnLCBjbGlja1RhcmdldCApO1xuXHRyZXR1cm4gJCggJ2JvZHknICkub24oICdjbGljaycsIGNsaWNrVGFyZ2V0LCBoYW5kbGVyICk7XG59XG4iLCJpbXBvcnQgZ2V0V2luZG93IGZyb20gJy4uL2hlbHBlcnMvd2luZG93JztcbmltcG9ydCBnZXRKUXVlcnkgZnJvbSAnLi4vaGVscGVycy9qcXVlcnknO1xuaW1wb3J0IHsgb24gfSBmcm9tICcuLi9oZWxwZXJzL21lc3Nlbmdlcic7XG5pbXBvcnQgZ2V0VW5kZXJzY29yZSBmcm9tICcuLi9oZWxwZXJzL3VuZGVyc2NvcmUnO1xuaW1wb3J0IGFkZENsaWNrSGFuZGxlciBmcm9tICcuLi9oZWxwZXJzL2NsaWNrLWhhbmRsZXInO1xuaW1wb3J0IGdldE9wdGlvbnMgZnJvbSAnLi4vaGVscGVycy9vcHRpb25zJztcbmltcG9ydCBkZWJ1Z0ZhY3RvcnkgZnJvbSAnZGVidWcnO1xuXG5jb25zdCBfID0gZ2V0VW5kZXJzY29yZSgpO1xuY29uc3QgZGVidWcgPSBkZWJ1Z0ZhY3RvcnkoICdjZG06aWNvbi1idXR0b25zJyApO1xuY29uc3QgJCA9IGdldEpRdWVyeSgpO1xuXG4vLyBJY29ucyBmcm9tOiBodHRwczovL2dpdGh1Yi5jb20vV29yZFByZXNzL2Rhc2hpY29ucy90cmVlL21hc3Rlci9zdmdcbi8vIEVsZW1lbnRzIHdpbGwgZGVmYXVsdCB0byB1c2luZyBgZWRpdEljb25gIGJ1dCBpZiBhbiBlbGVtZW50IGhhcyB0aGUgYGljb25gXG4vLyBwcm9wZXJ0eSBzZXQsIGl0IHdpbGwgdXNlIHRoYXQgYXMgdGhlIGtleSBmb3Igb25lIG9mIHRoZXNlIGljb25zIGluc3RlYWQ6XG5jb25zdCBpY29ucyA9IHtcblx0aGVhZGVySWNvbjogJzxzdmcgdmVyc2lvbj1cIjEuMVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxuczp4bGluaz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiB3aWR0aD1cIjIwXCIgaGVpZ2h0PVwiMjBcIiB2aWV3Qm94PVwiMCAwIDIwIDIwXCI+PHBhdGggZD1cIk0yLjI1IDFoMTUuNWMwLjY5IDAgMS4yNSAwLjU2IDEuMjUgMS4yNXYxNS41YzAgMC42OS0wLjU2IDEuMjUtMS4yNSAxLjI1aC0xNS41Yy0wLjY5IDAtMS4yNS0wLjU2LTEuMjUtMS4yNXYtMTUuNWMwLTAuNjkgMC41Ni0xLjI1IDEuMjUtMS4yNXpNMTcgMTd2LTE0aC0xNHYxNGgxNHpNMTAgNmMwLTEuMS0wLjktMi0yLTJzLTIgMC45LTIgMiAwLjkgMiAyIDIgMi0wLjkgMi0yek0xMyAxMWMwIDAgMC02IDMtNnYxMGMwIDAuNTUtMC40NSAxLTEgMWgtMTBjLTAuNTUgMC0xLTAuNDUtMS0xdi03YzIgMCAzIDQgMyA0czEtMyAzLTMgMyAyIDMgMnpcIj48L3BhdGg+PC9zdmc+Jyxcblx0ZWRpdEljb246ICc8c3ZnIHZlcnNpb249XCIxLjFcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgd2lkdGg9XCIyMFwiIGhlaWdodD1cIjIwXCIgdmlld0JveD1cIjAgMCAyMCAyMFwiPjxwYXRoIGQ9XCJNMTMuODkgMy4zOWwyLjcxIDIuNzJjMC40NiAwLjQ2IDAuNDIgMS4yNCAwLjAzMCAxLjY0bC04LjAxMCA4LjAyMC01LjU2IDEuMTYgMS4xNi01LjU4czcuNi03LjYzIDcuOTktOC4wMzBjMC4zOS0wLjM5IDEuMjItMC4zOSAxLjY4IDAuMDcwek0xMS4xNiA2LjE4bC01LjU5IDUuNjEgMS4xMSAxLjExIDUuNTQtNS42NXpNOC4xOSAxNC40MWw1LjU4LTUuNi0xLjA3MC0xLjA4MC01LjU5IDUuNnpcIj48L3BhdGg+PC9zdmc+Jyxcblx0cGFnZUJ1aWxkZXJJY29uOiAnPHN2ZyB2ZXJzaW9uPVwiMS4xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHdpZHRoPVwiMjBcIiBoZWlnaHQ9XCIyMFwiIHZpZXdCb3g9XCIwIDAgMjAgMjBcIj48cGF0aCBkPVwiTTE5IDE2di0xM2MwLTAuNTUtMC40NS0xLTEtMWgtMTVjLTAuNTUgMC0xIDAuNDUtMSAxdjEzYzAgMC41NSAwLjQ1IDEgMSAxaDE1YzAuNTUgMCAxLTAuNDUgMS0xek00IDRoMTN2NGgtMTN2LTR6TTUgNXYyaDN2LTJoLTN6TTkgNXYyaDN2LTJoLTN6TTEzIDV2Mmgzdi0yaC0zek00LjUgMTBjMC4yOCAwIDAuNSAwLjIyIDAuNSAwLjVzLTAuMjIgMC41LTAuNSAwLjUtMC41LTAuMjItMC41LTAuNSAwLjIyLTAuNSAwLjUtMC41ek02IDEwaDR2MWgtNHYtMXpNMTIgMTBoNXY1aC01di01ek00LjUgMTJjMC4yOCAwIDAuNSAwLjIyIDAuNSAwLjVzLTAuMjIgMC41LTAuNSAwLjUtMC41LTAuMjItMC41LTAuNSAwLjIyLTAuNSAwLjUtMC41ek02IDEyaDR2MWgtNHYtMXpNMTMgMTJ2Mmgzdi0yaC0zek00LjUgMTRjMC4yOCAwIDAuNSAwLjIyIDAuNSAwLjVzLTAuMjIgMC41LTAuNSAwLjUtMC41LTAuMjItMC41LTAuNSAwLjIyLTAuNSAwLjUtMC41ek02IDE0aDR2MWgtNHYtMXpcIj48L3BhdGg+PC9zdmc+J1xufTtcblxuLyoqXG4gKiBDcmVhdGUgKGlmIG5lY2Vzc2FyeSkgYW5kIHBvc2l0aW9uIGFuIGljb24gYnV0dG9uIHJlbGF0aXZlIHRvIGl0cyB0YXJnZXQuXG4gKlxuICogU2VlIGBtYWtlRm9jdXNhYmxlYCBmb3IgdGhlIGZvcm1hdCBvZiB0aGUgYGVsZW1lbnRgIHBhcmFtLlxuICpcbiAqIElmIHBvc2l0aW9uaW5nIHRoZSBpY29uIHdhcyBzdWNjZXNzZnVsLCB0aGlzIGZ1bmN0aW9uIHJldHVybnMgYSBjb3B5IG9mIHRoZVxuICogZWxlbWVudCBpdCB3YXMgcGFzc2VkIHdpdGggdGhlIGFkZGl0aW9uYWwgcGFyYW1ldGVycyBgJHRhcmdldGAgYW5kIGAkaWNvbmBcbiAqIHRoYXQgYXJlIGNhY2hlZCByZWZlcmVuY2VzIHRvIHRoZSBET00gZWxlbWVudHMuIElmIHRoZSBwb3NpdGlvbmluZyBmYWlsZWQsIGl0XG4gKiBqdXN0IHJldHVybnMgdGhlIGVsZW1lbnQgdW5jaGFuZ2VkLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0gVGhlIGRhdGEgdG8gdXNlIHdoZW4gY29uc3RydWN0aW5nIHRoZSBpY29uLlxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgZWxlbWVudCB0aGF0IHdhcyBwYXNzZWQsIHdpdGggYWRkaXRpb25hbCBkYXRhIGluY2x1ZGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcG9zaXRpb25JY29uKCBlbGVtZW50ICkge1xuXHRjb25zdCAkdGFyZ2V0ID0gZ2V0RWxlbWVudFRhcmdldCggZWxlbWVudCApO1xuXHRpZiAoICEgJHRhcmdldC5sZW5ndGggKSB7XG5cdFx0ZGVidWcoIGBDb3VsZCBub3QgZmluZCB0YXJnZXQgZWxlbWVudCBmb3IgaWNvbiAke2VsZW1lbnQuaWR9IHdpdGggc2VsZWN0b3IgJHtlbGVtZW50LnNlbGVjdG9yfWAgKTtcblx0XHRyZXR1cm4gZWxlbWVudDtcblx0fVxuXHRjb25zdCAkaWNvbiA9IGZpbmRPckNyZWF0ZUljb24oIGVsZW1lbnQgKTtcblx0Y29uc3QgY3NzID0gZ2V0Q2FsY3VsYXRlZENzc0Zvckljb24oIGVsZW1lbnQsICR0YXJnZXQsICRpY29uICk7XG5cdGRlYnVnKCBgcG9zaXRpb25pbmcgaWNvbiBmb3IgJHtlbGVtZW50LmlkfSB3aXRoIENTUyAke0pTT04uc3RyaW5naWZ5KCBjc3MgKX1gICk7XG5cdCRpY29uLmNzcyggY3NzICk7XG5cdHJldHVybiBfLmV4dGVuZCgge30sIGVsZW1lbnQsIHsgJHRhcmdldCwgJGljb24gfSApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRkQ2xpY2tIYW5kbGVyVG9JY29uKCBlbGVtZW50ICkge1xuXHRpZiAoICEgZWxlbWVudC4kaWNvbiApIHtcblx0XHRyZXR1cm4gZWxlbWVudDtcblx0fVxuXHRhZGRDbGlja0hhbmRsZXIoIGAuJHtnZXRJY29uQ2xhc3NOYW1lKCBlbGVtZW50LmlkICl9YCwgZWxlbWVudC5oYW5kbGVyICk7XG5cdHJldHVybiBlbGVtZW50O1xufVxuXG5jb25zdCBpY29uUmVwb3NpdGlvbmVyID0gXy5kZWJvdW5jZSggZWxlbWVudHMgPT4ge1xuXHRkZWJ1ZyggYHJlcG9zaXRpb25pbmcgJHtlbGVtZW50cy5sZW5ndGh9IGljb25zYCApO1xuXHRlbGVtZW50cy5tYXAoIHBvc2l0aW9uSWNvbiApO1xufSwgMzUwICk7XG5cbmV4cG9ydCBmdW5jdGlvbiByZXBvc2l0aW9uSWNvbnMoIGVsZW1lbnRzICkge1xuXHRpY29uUmVwb3NpdGlvbmVyKCBlbGVtZW50cyApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVwb3NpdGlvbkFmdGVyRm9udHNMb2FkKCBlbGVtZW50cyApIHtcblx0aWNvblJlcG9zaXRpb25lciggZWxlbWVudHMgKTtcblxuXHRpZiAoIGdldFdpbmRvdygpLmRvY3VtZW50LmZvbnRzICkge1xuXHRcdGdldFdpbmRvdygpLmRvY3VtZW50LmZvbnRzLnJlYWR5LnRoZW4oIGljb25SZXBvc2l0aW9uZXIuYmluZCggbnVsbCwgZWxlbWVudHMgKSApO1xuXHR9XG59XG5cbi8qKlxuICogVG9nZ2xlIGljb25zIHdoZW4gY3VzdG9taXplciB0b2dnbGVzIHByZXZpZXcgbW9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuYWJsZUljb25Ub2dnbGUoKSB7XG5cdG9uKCAnY2RtLXRvZ2dsZS12aXNpYmxlJywgKCkgPT4gJCggJy5jZG0taWNvbicgKS50b2dnbGVDbGFzcyggJ2NkbS1pY29uLS1oaWRkZW4nICkgKTtcbn1cblxuZnVuY3Rpb24gZmluZE9yQ3JlYXRlSWNvbiggZWxlbWVudCApIHtcblx0aWYgKCBlbGVtZW50LiRpY29uICkge1xuXHRcdHJldHVybiBlbGVtZW50LiRpY29uO1xuXHR9XG5cdGNvbnN0ICRpY29uID0gJCggYC4ke2dldEljb25DbGFzc05hbWUoIGVsZW1lbnQuaWQgKX1gICk7XG5cdGlmICggJGljb24ubGVuZ3RoICkge1xuXHRcdHJldHVybiAkaWNvbjtcblx0fVxuXG5cdGNvbnN0ICR3aWRnZXRfbG9jYXRpb24gPSBnZXRXaWRnZXRMb2NhdGlvbiggZWxlbWVudC5zZWxlY3RvciApO1xuXG5cdGNvbnN0IHRpdGxlID0gZ2V0T3B0aW9ucygpLnRyYW5zbGF0aW9uc1sgZWxlbWVudC50eXBlIF0gfHwgYENsaWNrIHRvIGVkaXQgdGhlICR7ZWxlbWVudC50aXRsZX1gO1xuXG5cdHJldHVybiBjcmVhdGVBbmRBcHBlbmRJY29uKCBlbGVtZW50LmlkLCBlbGVtZW50Lmljb24sIHRpdGxlLCAkd2lkZ2V0X2xvY2F0aW9uICk7XG59XG5cbmZ1bmN0aW9uIGdldFdpZGdldExvY2F0aW9uKCBzZWxlY3RvciApIHtcblxuXHQvLyBTaXRlIGluZm8gd3JhcHBlciAoYmVsb3cgZm9vdGVyKVxuXHRpZiAoICQoIHNlbGVjdG9yICkucGFyZW50cyggJy5zaXRlLXRpdGxlLXdyYXBwZXInICkubGVuZ3RoIHx8ICQoIHNlbGVjdG9yICkucGFyZW50cyggJy5zaXRlLXRpdGxlJyApLmxlbmd0aCApIHtcblxuXHRcdHJldHVybiAnc2l0ZS10aXRsZS13aWRnZXQnO1xuXG5cdH1cblxuXHQvLyBIZXJvXG5cdGlmICggJCggc2VsZWN0b3IgKS5oYXNDbGFzcyggJ2hlcm8nICkgKSB7XG5cblx0XHRyZXR1cm4gJ2hlcm8td2lkZ2V0JztcblxuXHR9XG5cblx0Ly8gUGFnZSBCdWlsZGVyIChiZWxvdyBmb290ZXIpXG5cdGlmICggX0N1c3RvbWl6ZXJfRE0uYmVhdmVyX2J1aWxkZXIgKSB7XG5cblx0XHRyZXR1cm4gJ3BhZ2UtYnVpbGRlci13aWRnZXQnO1xuXG5cdH1cblxuXHQvLyBGb290ZXIgV2lkZ2V0XG5cdGlmICggJCggc2VsZWN0b3IgKS5wYXJlbnRzKCAnLmZvb3Rlci13aWRnZXQnICkubGVuZ3RoICkge1xuXG5cdFx0cmV0dXJuICdmb290ZXItd2lkZ2V0JztcblxuXHR9XG5cblx0Ly8gU2l0ZSBpbmZvIHdyYXBwZXIgKGJlbG93IGZvb3Rlcilcblx0aWYgKCAkKCBzZWxlY3RvciApLnBhcmVudHMoICcuc2l0ZS1pbmZvLXdyYXBwZXInICkubGVuZ3RoICkge1xuXG5cdFx0cmV0dXJuICdzaXRlLWluZm8td3JhcHBlci13aWRnZXQnO1xuXG5cdH1cblxuXHRyZXR1cm4gJ2RlZmF1bHQnO1xuXG59XG5cbmZ1bmN0aW9uIGdldEljb25DbGFzc05hbWUoIGlkICkge1xuXHRyZXR1cm4gYGNkbS1pY29uX18ke2lkfWA7XG59XG5cbmZ1bmN0aW9uIGdldENhbGN1bGF0ZWRDc3NGb3JJY29uKCBlbGVtZW50LCAkdGFyZ2V0LCAkaWNvbiApIHtcblx0Y29uc3QgcG9zaXRpb24gPSBlbGVtZW50LnBvc2l0aW9uO1xuXHRjb25zdCBoaWRkZW5JY29uUG9zID0gKCAncnRsJyA9PT0gZ2V0V2luZG93KCkuZG9jdW1lbnQuZGlyICkgPyB7IHJpZ2h0OiAtMTAwMCwgbGVmdDogJ2F1dG8nIH0gOiB7IGxlZnQ6IC0xMDAwLCByaWdodDogJ2F1dG8nIH07XG5cblx0aWYgKCAhICR0YXJnZXQuaXMoICc6dmlzaWJsZScgKSApIHtcblx0XHRkZWJ1ZyggYHRhcmdldCBpcyBub3QgdmlzaWJsZSB3aGVuIHBvc2l0aW9uaW5nICR7ZWxlbWVudC5pZH0uIEkgd2lsbCBoaWRlIHRoZSBpY29uLiB0YXJnZXQ6YCwgJHRhcmdldCApO1xuXHRcdHJldHVybiBoaWRkZW5JY29uUG9zO1xuXHR9XG5cdGNvbnN0IG9mZnNldCA9ICR0YXJnZXQub2Zmc2V0KCk7XG5cdGxldCB0b3AgPSBvZmZzZXQudG9wO1xuXHRjb25zdCBsZWZ0ID0gb2Zmc2V0LmxlZnQ7XG5cdGxldCBtaWRkbGUgPSAkdGFyZ2V0LmlubmVySGVpZ2h0KCkgLyAyO1xuXHRsZXQgaWNvbk1pZGRsZSA9ICRpY29uLmlubmVySGVpZ2h0KCkgLyAyO1xuXHRpZiAoIHRvcCA8IDAgKSB7XG5cdFx0ZGVidWcoIGB0YXJnZXQgdG9wIG9mZnNldCAke3RvcH0gaXMgdW51c3VhbGx5IGxvdyB3aGVuIHBvc2l0aW9uaW5nICR7ZWxlbWVudC5pZH0uIEkgd2lsbCBoaWRlIHRoZSBpY29uLiB0YXJnZXQ6YCwgJHRhcmdldCApO1xuXHRcdHJldHVybiBoaWRkZW5JY29uUG9zO1xuXHR9XG5cdGlmICggbWlkZGxlIDwgMCApIHtcblx0XHRkZWJ1ZyggYHRhcmdldCBtaWRkbGUgb2Zmc2V0ICR7bWlkZGxlfSBpcyB1bnVzdWFsbHkgbG93IHdoZW4gcG9zaXRpb25pbmcgJHtlbGVtZW50LmlkfS4gSSB3aWxsIGhpZGUgdGhlIGljb24uIHRhcmdldDpgLCAkdGFyZ2V0ICk7XG5cdFx0cmV0dXJuIGhpZGRlbkljb25Qb3M7XG5cdH1cblx0aWYgKCB0b3AgPCAxICkge1xuXHRcdGRlYnVnKCBgdGFyZ2V0IHRvcCBvZmZzZXQgJHt0b3B9IGlzIHVudXN1YWxseSBsb3cgd2hlbiBwb3NpdGlvbmluZyAke2VsZW1lbnQuaWR9LiBJIHdpbGwgYWRqdXN0IHRoZSBpY29uIGRvd253YXJkcy4gdGFyZ2V0OmAsICR0YXJnZXQgKTtcblx0XHR0b3AgPSAwO1xuXHR9XG5cdGlmICggbWlkZGxlIDwgMSApIHtcblx0XHRkZWJ1ZyggYHRhcmdldCBtaWRkbGUgb2Zmc2V0ICR7bWlkZGxlfSBpcyB1bnVzdWFsbHkgbG93IHdoZW4gcG9zaXRpb25pbmcgJHtlbGVtZW50LmlkfS4gSSB3aWxsIGFkanVzdCB0aGUgaWNvbiBkb3dud2FyZHMuIHRhcmdldDpgLCAkdGFyZ2V0ICk7XG5cdFx0bWlkZGxlID0gMDtcblx0XHRpY29uTWlkZGxlID0gMDtcblx0fVxuXHRpZiAoIHBvc2l0aW9uID09PSAnbWlkZGxlJyApIHtcblx0XHRyZXR1cm4gYWRqdXN0Q29vcmRpbmF0ZXMoIHsgdG9wOiB0b3AgKyBtaWRkbGUgLSBpY29uTWlkZGxlLCBsZWZ0LCByaWdodDogJ2F1dG8nIH0gKTtcblx0fSBlbHNlIGlmICggcG9zaXRpb24gPT09ICd0b3AtcmlnaHQnICkge1xuXHRcdHJldHVybiBhZGp1c3RDb29yZGluYXRlcyggeyB0b3AsIGxlZnQ6IGxlZnQgKyAkdGFyZ2V0LndpZHRoKCkgKyA3MCwgcmlnaHQ6ICdhdXRvJyB9ICk7XG5cdH1cblx0cmV0dXJuIGFkanVzdENvb3JkaW5hdGVzKCB7IHRvcCwgbGVmdCwgcmlnaHQ6ICdhdXRvJyB9ICk7XG59XG5cbmZ1bmN0aW9uIGFkanVzdENvb3JkaW5hdGVzKCBjb29yZHMgKSB7XG5cdGNvbnN0IG1pbldpZHRoID0gMzU7XG5cdC8vIFRyeSB0byBhdm9pZCBvdmVybGFwcGluZyBoYW1idXJnZXIgbWVudXNcblx0Y29uc3QgbWF4V2lkdGggPSBnZXRXaW5kb3coKS5pbm5lcldpZHRoIC0gMTEwO1xuXHRpZiAoIGNvb3Jkcy5sZWZ0IDwgbWluV2lkdGggKSB7XG5cdFx0Y29vcmRzLmxlZnQgPSBtaW5XaWR0aDtcblx0fVxuXHRpZiAoIGNvb3Jkcy5sZWZ0ID49IG1heFdpZHRoICkge1xuXHRcdGNvb3Jkcy5sZWZ0ID0gbWF4V2lkdGg7XG5cdH1cblx0cmV0dXJuIGNvb3Jkcztcbn1cblxuZnVuY3Rpb24gY3JlYXRlSWNvbiggaWQsIGljb25UeXBlLCB0aXRsZSwgd2lkZ2V0X2xvY2F0aW9uICkge1xuXHRjb25zdCBpY29uQ2xhc3NOYW1lID0gZ2V0SWNvbkNsYXNzTmFtZSggaWQgKTtcblx0Y29uc3Qgc2NoZW1lID0gZ2V0T3B0aW9ucygpLmljb25fY29sb3I7XG5cdGNvbnN0IHRoZW1lID0gZ2V0T3B0aW9ucygpLnRoZW1lO1xuXG5cdHN3aXRjaCAoIGljb25UeXBlICkge1xuXHRcdGNhc2UgJ2hlYWRlckljb24nOlxuXHRcdFx0cmV0dXJuICQoIGA8ZGl2IGNsYXNzPVwiY2RtLWljb24gY2RtLWljb24tLWhlYWRlci1pbWFnZSAke2ljb25DbGFzc05hbWV9ICR7c2NoZW1lfSAke3RoZW1lfSAke3dpZGdldF9sb2NhdGlvbn1cIiB0aXRsZT1cIiR7dGl0bGV9XCI+JHtpY29ucy5oZWFkZXJJY29ufTwvZGl2PmAgKTtcblx0XHRjYXNlICdwYWdlQnVpbGRlckljb24nOlxuXHRcdFx0cmV0dXJuICQoIGA8ZGl2IGNsYXNzPVwiY2RtLWljb24gY2RtLWljb24tLXBhZ2UtYnVpbGRlciAke2ljb25DbGFzc05hbWV9ICR7c2NoZW1lfSAke3RoZW1lfSAke3dpZGdldF9sb2NhdGlvbn1cIiB0aXRsZT1cIiR7dGl0bGV9XCI+JHtpY29ucy5wYWdlQnVpbGRlckljb259PC9kaXY+YCApO1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXR1cm4gJCggYDxkaXYgY2xhc3M9XCJjZG0taWNvbiBjZG0taWNvbi0tdGV4dCAke2ljb25DbGFzc05hbWV9ICR7c2NoZW1lfSAke3RoZW1lfSAke3dpZGdldF9sb2NhdGlvbn1cIiB0aXRsZT1cIiR7dGl0bGV9XCI+JHtpY29ucy5lZGl0SWNvbn08L2Rpdj5gICk7XG5cdH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlQW5kQXBwZW5kSWNvbiggaWQsIGljb25UeXBlLCB0aXRsZSwgd2lkZ2V0X2xvY2F0aW9uICkge1xuXHRjb25zdCAkaWNvbiA9IGNyZWF0ZUljb24oIGlkLCBpY29uVHlwZSwgdGl0bGUsIHdpZGdldF9sb2NhdGlvbiApO1xuXHQkKCBnZXRXaW5kb3coKS5kb2N1bWVudC5ib2R5ICkuYXBwZW5kKCAkaWNvbiApO1xuXHRyZXR1cm4gJGljb247XG59XG5cbmZ1bmN0aW9uIGdldEVsZW1lbnRUYXJnZXQoIGVsZW1lbnQgKSB7XG5cdGlmICggZWxlbWVudC4kdGFyZ2V0ICYmICEgZWxlbWVudC4kdGFyZ2V0LnBhcmVudCgpLmxlbmd0aCApIHtcblx0XHQvLyB0YXJnZXQgd2FzIHJlbW92ZWQgZnJvbSBET00sIGxpa2VseSBieSBwYXJ0aWFsIHJlZnJlc2hcblx0XHRlbGVtZW50LiR0YXJnZXQgPSBudWxsO1xuXHR9XG5cdHJldHVybiBlbGVtZW50LiR0YXJnZXQgfHwgJCggZWxlbWVudC5zZWxlY3RvciApO1xufVxuIiwiaW1wb3J0IGdldFdpbmRvdyBmcm9tICcuL3dpbmRvdyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGdldEpRdWVyeSgpIHtcblx0cmV0dXJuIGdldFdpbmRvdygpLmpRdWVyeTtcbn1cbiIsImltcG9ydCBnZXRBUEkgZnJvbSAnLi9hcGknO1xuaW1wb3J0IGRlYnVnRmFjdG9yeSBmcm9tICdkZWJ1Zyc7XG5cbmNvbnN0IGRlYnVnID0gZGVidWdGYWN0b3J5KCAnY2RtOm1lc3NlbmdlcicgKTtcbmNvbnN0IGFwaSA9IGdldEFQSSgpO1xuXG5mdW5jdGlvbiBnZXRQcmV2aWV3KCkge1xuXHQvLyB3cC1hZG1pbiBpcyBwcmV2aWV3ZXIsIGZyb250ZW5kIGlzIHByZXZpZXcuIHdoeT8gbm8gaWRlYS5cblx0cmV0dXJuIHR5cGVvZiBhcGkucHJldmlldyAhPT0gJ3VuZGVmaW5lZCcgPyBhcGkucHJldmlldyA6IGFwaS5wcmV2aWV3ZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZW5kKCBpZCwgZGF0YSApIHtcblx0ZGVidWcoICdzZW5kJywgaWQsIGRhdGEgKTtcblx0cmV0dXJuIGdldFByZXZpZXcoKS5zZW5kKCBpZCwgZGF0YSApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gb24oIGlkLCBjYWxsYmFjayApIHtcblx0ZGVidWcoICdvbicsIGlkLCBjYWxsYmFjayApO1xuXHRyZXR1cm4gZ2V0UHJldmlldygpLmJpbmQoIGlkLCBjYWxsYmFjayApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gb2ZmKCBpZCwgY2FsbGJhY2sgPSBmYWxzZSApIHtcblx0ZGVidWcoICdvZmYnLCBpZCwgY2FsbGJhY2sgKTtcblx0aWYgKCBjYWxsYmFjayApIHtcblx0XHRyZXR1cm4gZ2V0UHJldmlldygpLnVuYmluZCggaWQsIGNhbGxiYWNrICk7XG5cdH1cblx0Ly8gbm8gY2FsbGJhY2s/IEdldCByaWQgb2YgYWxsIG9mICdlbVxuXHRjb25zdCB0b3BpYyA9IGdldFByZXZpZXcoKS50b3BpY3NbIGlkIF07XG5cdGlmICggdG9waWMgKSB7XG5cdFx0cmV0dXJuIHRvcGljLmVtcHR5KCk7XG5cdH1cbn1cbiIsImltcG9ydCBnZXRXaW5kb3cgZnJvbSAnLi93aW5kb3cnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBnZXRPcHRpb25zKCkge1xuXHRyZXR1cm4gZ2V0V2luZG93KCkuX0N1c3RvbWl6ZXJfRE07XG59XG4iLCJpbXBvcnQgZ2V0V2luZG93IGZyb20gJy4vd2luZG93JztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZ2V0VW5kZXJzY29yZSgpIHtcblx0cmV0dXJuIGdldFdpbmRvdygpLl87XG59XG4iLCJpbXBvcnQgZ2V0V2luZG93IGZyb20gJy4uL2hlbHBlcnMvd2luZG93JztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFVzZXJBZ2VudCgpIHtcblx0cmV0dXJuIGdldFdpbmRvdygpLm5hdmlnYXRvci51c2VyQWdlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1NhZmFyaSgpIHtcblx0cmV0dXJuICggISEgZ2V0VXNlckFnZW50KCkubWF0Y2goIC9WZXJzaW9uXFwvW1xcZFxcLl0rLipTYWZhcmkvICkgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTW9iaWxlU2FmYXJpKCkge1xuXHRyZXR1cm4gKCAhISBnZXRVc2VyQWdlbnQoKS5tYXRjaCggLyhpUG9kfGlQaG9uZXxpUGFkKS8gKSApO1xufVxuIiwibGV0IHdpbmRvd09iaiA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRXaW5kb3coIG9iaiApIHtcblx0d2luZG93T2JqID0gb2JqO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBnZXRXaW5kb3coKSB7XG5cdGlmICggISB3aW5kb3dPYmogJiYgISB3aW5kb3cgKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCAnTm8gd2luZG93IG9iamVjdCBmb3VuZC4nICk7XG5cdH1cblx0cmV0dXJuIHdpbmRvd09iaiB8fCB3aW5kb3c7XG59XG4iLCJpbXBvcnQgZGVidWdGYWN0b3J5IGZyb20gJ2RlYnVnJztcbmltcG9ydCBnZXRXaW5kb3cgZnJvbSAnLi4vaGVscGVycy93aW5kb3cnO1xuaW1wb3J0IGdldEpRdWVyeSBmcm9tICcuLi9oZWxwZXJzL2pxdWVyeSc7XG5pbXBvcnQgeyBzZW5kIH0gZnJvbSAnLi4vaGVscGVycy9tZXNzZW5nZXInO1xuXG5jb25zdCAkID0gZ2V0SlF1ZXJ5KCk7XG5jb25zdCBkZWJ1ZyA9IGRlYnVnRmFjdG9yeSggJ2NkbTplZGl0LXBvc3QtbGlua3MnICk7XG5cbmV4cG9ydCBmdW5jdGlvbiBtb2RpZnlFZGl0UG9zdExpbmtzKCBzZWxlY3RvciApIHtcblx0ZGVidWcoICdsaXN0ZW5pbmcgZm9yIGNsaWNrcyBvbiBwb3N0IGVkaXQgbGlua3Mgd2l0aCBzZWxlY3RvcicsIHNlbGVjdG9yICk7XG5cdC8vIFdlIHVzZSBtb3VzZWRvd24gYmVjYXVzZSBjbGljayBoYXMgYmVlbiBibG9ja2VkIGJ5IHNvbWUgb3RoZXIgSlNcblx0JCggJ2JvZHknICkub24oICdtb3VzZWRvd24nLCBzZWxlY3RvciwgZXZlbnQgPT4ge1xuXHRcdGdldFdpbmRvdygpLm9wZW4oIGV2ZW50LnRhcmdldC5ocmVmICk7XG5cdFx0c2VuZCggJ3JlY29yZEV2ZW50Jywge1xuXHRcdFx0bmFtZTogJ3dwY29tX2N1c3RvbWl6ZV9kaXJlY3RfbWFuaXB1bGF0aW9uX2NsaWNrJyxcblx0XHRcdHByb3BzOiB7IHR5cGU6ICdwb3N0LWVkaXQnIH1cblx0XHR9ICk7XG5cdH0gKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpc2FibGVFZGl0UG9zdExpbmtzKCBzZWxlY3RvciApIHtcblx0ZGVidWcoICdoaWRpbmcgcG9zdCBlZGl0IGxpbmtzIHdpdGggc2VsZWN0b3InLCBzZWxlY3RvciApO1xuXHQkKCBzZWxlY3RvciApLmhpZGUoKTtcbn1cbiIsImltcG9ydCBnZXRXaW5kb3cgZnJvbSAnLi4vaGVscGVycy93aW5kb3cnO1xuaW1wb3J0IGdldEFQSSBmcm9tICcuLi9oZWxwZXJzL2FwaSc7XG5pbXBvcnQgZ2V0SlF1ZXJ5IGZyb20gJy4uL2hlbHBlcnMvanF1ZXJ5JztcbmltcG9ydCB7IHNlbmQgfSBmcm9tICcuLi9oZWxwZXJzL21lc3Nlbmdlcic7XG5pbXBvcnQgeyBwb3NpdGlvbkljb24sIGFkZENsaWNrSGFuZGxlclRvSWNvbiwgcmVwb3NpdGlvbkFmdGVyRm9udHNMb2FkLCBlbmFibGVJY29uVG9nZ2xlIH0gZnJvbSAnLi4vaGVscGVycy9pY29uLWJ1dHRvbnMnO1xuaW1wb3J0IGRlYnVnRmFjdG9yeSBmcm9tICdkZWJ1Zyc7XG5cbmNvbnN0IGRlYnVnID0gZGVidWdGYWN0b3J5KCAnY2RtOmZvY3VzYWJsZScgKTtcbmNvbnN0IGFwaSA9IGdldEFQSSgpO1xuY29uc3QgJCA9IGdldEpRdWVyeSgpO1xuXG4vKipcbiAqIEdpdmUgRE9NIGVsZW1lbnRzIGFuIGljb24gYnV0dG9uIGJvdW5kIHRvIGNsaWNrIGhhbmRsZXJzXG4gKlxuICogQWNjZXB0cyBhbiBhcnJheSBvZiBlbGVtZW50IG9iamVjdHMgb2YgdGhlIGZvcm06XG4gKlxuICoge1xuICogXHRpZDogQSBzdHJpbmcgdG8gaWRlbnRpZnkgdGhpcyBlbGVtZW50XG4gKiBcdHNlbGVjdG9yOiBBIENTUyBzZWxlY3RvciBzdHJpbmcgdG8gdW5pcXVlbHkgdGFyZ2V0IHRoZSBET00gZWxlbWVudFxuICogXHR0eXBlOiBBIHN0cmluZyB0byBncm91cCB0aGUgZWxlbWVudCwgZWc6ICd3aWRnZXQnXG4gKiBcdHBvc2l0aW9uOiAob3B0aW9uYWwpIEEgc3RyaW5nIGZvciBwb3NpdGlvbmluZyB0aGUgaWNvbiwgb25lIG9mICd0b3AtbGVmdCcgKGRlZmF1bHQpLCAndG9wLXJpZ2h0Jywgb3IgJ21pZGRsZScgKHZlcnRpY2FsbHkgY2VudGVyKVxuICogXHRpY29uIChvcHRpb25hbCk6IEEgc3RyaW5nIHNwZWNpZnlpbmcgd2hpY2ggaWNvbiB0byB1c2UuIFNlZSBvcHRpb25zIGluIGljb24tYnV0dG9ucy5qc1xuICogXHRoYW5kbGVyIChvcHRpb25hbCk6IEEgY2FsbGJhY2sgZnVuY3Rpb24gd2hpY2ggd2lsbCBiZSBjYWxsZWQgd2hlbiB0aGUgaWNvbiBpcyBjbGlja2VkXG4gKiB9XG4gKlxuICogSWYgbm8gaGFuZGxlciBpcyBzcGVjaWZpZWQsIHRoZSBkZWZhdWx0IHdpbGwgYmUgdXNlZCwgd2hpY2ggd2lsbCBzZW5kXG4gKiBgY29udHJvbC1mb2N1c2AgdG8gdGhlIEFQSSB3aXRoIHRoZSBlbGVtZW50IElELlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGVsZW1lbnRzIC0gQW4gYXJyYXkgb2YgZWxlbWVudCBvYmplY3RzIG9mIHRoZSBmb3JtIGFib3ZlLlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBtYWtlRm9jdXNhYmxlKCBlbGVtZW50cyApIHtcblx0Y29uc3QgZWxlbWVudHNXaXRoSWNvbnMgPSBlbGVtZW50c1xuXHQucmVkdWNlKCByZW1vdmVEdXBsaWNhdGVSZWR1Y2VyLCBbXSApXG5cdC5tYXAoIHBvc2l0aW9uSWNvbiApXG5cdC5tYXAoIGNyZWF0ZUhhbmRsZXIgKVxuXHQubWFwKCBhZGRDbGlja0hhbmRsZXJUb0ljb24gKTtcblxuXHRpZiAoIGVsZW1lbnRzV2l0aEljb25zLmxlbmd0aCApIHtcblx0XHRzdGFydEljb25Nb25pdG9yKCBlbGVtZW50c1dpdGhJY29ucyApO1xuXHRcdGVuYWJsZUljb25Ub2dnbGUoKTtcblx0fVxufVxuXG5mdW5jdGlvbiBtYWtlUmVwb3NpdGlvbmVyKCBlbGVtZW50cywgY2hhbmdlVHlwZSApIHtcblx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdGRlYnVnKCAnZGV0ZWN0ZWQgY2hhbmdlOicsIGNoYW5nZVR5cGUgKTtcblx0XHRyZXBvc2l0aW9uQWZ0ZXJGb250c0xvYWQoIGVsZW1lbnRzICk7XG5cdH07XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBncm91cCBvZiBsaXN0ZW5lcnMgdG8gcmVwb3NpdGlvbiBpY29uIGJ1dHRvbnMgaWYgdGhlIERPTSBjaGFuZ2VzLlxuICpcbiAqIFNlZSBgbWFrZUZvY3VzYWJsZWAgZm9yIHRoZSBmb3JtYXQgb2YgdGhlIGBlbGVtZW50c2AgcGFyYW0uXG4gKlxuICogQHBhcmFtIHtBcnJheX0gZWxlbWVudHMgLSBUaGUgZWxlbWVudCBvYmplY3RzLlxuICovXG5mdW5jdGlvbiBzdGFydEljb25Nb25pdG9yKCBlbGVtZW50cyApIHtcblx0Ly8gUmVwb3NpdGlvbiBpY29ucyBhZnRlciBhbnkgdGhlbWUgZm9udHMgbG9hZFxuXHRyZXBvc2l0aW9uQWZ0ZXJGb250c0xvYWQoIGVsZW1lbnRzICk7XG5cblx0Ly8gUmVwb3NpdGlvbiBpY29ucyBhZnRlciBhIGZldyBzZWNvbmRzIGp1c3QgaW4gY2FzZSAoZWc6IGluZmluaXRlIHNjcm9sbCBvciBvdGhlciBzY3JpcHRzIGNvbXBsZXRlKVxuXHRzZXRUaW1lb3V0KCBtYWtlUmVwb3NpdGlvbmVyKCBlbGVtZW50cywgJ2ZvbGxvdy11cCcgKSwgMjAwMCApO1xuXG5cdC8vIFJlcG9zaXRpb24gaWNvbnMgYWZ0ZXIgdGhlIHdpbmRvdyBpcyByZXNpemVkXG5cdCQoIGdldFdpbmRvdygpICkucmVzaXplKCBtYWtlUmVwb3NpdGlvbmVyKCBlbGVtZW50cywgJ3Jlc2l6ZScgKSApO1xuXG5cdC8vIFJlcG9zaXRpb24gaWNvbnMgYWZ0ZXIgdGhlIHRleHQgb2YgYW55IGVsZW1lbnQgY2hhbmdlc1xuXHRlbGVtZW50cy5maWx0ZXIoIGVsID0+IFsgJ3NpdGVUaXRsZScsICdoZWFkZXJJY29uJyBdLmluZGV4T2YoIGVsLnR5cGUgKSAhPT0gLTEgKVxuXHQubWFwKCBlbCA9PiBhcGkoIGVsLmlkLCB2YWx1ZSA9PiB2YWx1ZS5iaW5kKCBtYWtlUmVwb3NpdGlvbmVyKCBlbGVtZW50cywgJ3RpdGxlIG9yIGhlYWRlcicgKSApICkgKTtcblxuXHQvLyBXaGVuIHRoZSB3aWRnZXQgcGFydGlhbCByZWZyZXNoIHJ1bnMsIHJlcG9zaXRpb24gaWNvbnNcblx0YXBpLmJpbmQoICd3aWRnZXQtdXBkYXRlZCcsIG1ha2VSZXBvc2l0aW9uZXIoIGVsZW1lbnRzLCAnd2lkZ2V0cycgKSApO1xuXG5cdC8vIFJlcG9zaXRpb24gaWNvbnMgYWZ0ZXIgYW55IGN1c3RvbWl6ZXIgc2V0dGluZyBpcyBjaGFuZ2VkXG5cdGFwaS5iaW5kKCAnY2hhbmdlJywgbWFrZVJlcG9zaXRpb25lciggZWxlbWVudHMsICdhbnkgc2V0dGluZycgKSApO1xuXG5cdGNvbnN0ICRkb2N1bWVudCA9ICQoIGdldFdpbmRvdygpLmRvY3VtZW50ICk7XG5cblx0Ly8gUmVwb3NpdGlvbiBhZnRlciBtZW51cyB1cGRhdGVkXG5cdCRkb2N1bWVudC5vbiggJ2N1c3RvbWl6ZS1wcmV2aWV3LW1lbnUtcmVmcmVzaGVkJywgbWFrZVJlcG9zaXRpb25lciggZWxlbWVudHMsICdtZW51cycgKSApO1xuXG5cdC8vIFJlcG9zaXRpb24gYWZ0ZXIgc2Nyb2xsaW5nIGluIGNhc2UgdGhlcmUgYXJlIGZpeGVkIHBvc2l0aW9uIGVsZW1lbnRzXG5cdCRkb2N1bWVudC5vbiggJ3Njcm9sbCcsIG1ha2VSZXBvc2l0aW9uZXIoIGVsZW1lbnRzLCAnc2Nyb2xsJyApICk7XG5cblx0Ly8gUmVwb3NpdGlvbiBhZnRlciBwYWdlIGNsaWNrIChlZzogaGFtYnVyZ2VyIG1lbnVzKVxuXHQkZG9jdW1lbnQub24oICdjbGljaycsIG1ha2VSZXBvc2l0aW9uZXIoIGVsZW1lbnRzLCAnY2xpY2snICkgKTtcblxuXHQvLyBSZXBvc2l0aW9uIGFmdGVyIGFueSBwYWdlIGNoYW5nZXMgKGlmIHRoZSBicm93c2VyIHN1cHBvcnRzIGl0KVxuXHRjb25zdCBwYWdlID0gZ2V0V2luZG93KCkuZG9jdW1lbnQucXVlcnlTZWxlY3RvciggJyNwYWdlJyApO1xuXHRpZiAoIHBhZ2UgJiYgTXV0YXRpb25PYnNlcnZlciApIHtcblx0XHRjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCBtYWtlUmVwb3NpdGlvbmVyKCBlbGVtZW50cywgJ0RPTSBtdXRhdGlvbicgKSApO1xuXHRcdG9ic2VydmVyLm9ic2VydmUoIHBhZ2UsIHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0gKTtcblx0fVxufVxuXG5mdW5jdGlvbiBjcmVhdGVIYW5kbGVyKCBlbGVtZW50ICkge1xuXHRlbGVtZW50LmhhbmRsZXIgPSBlbGVtZW50LmhhbmRsZXIgfHwgbWFrZURlZmF1bHRIYW5kbGVyKCBlbGVtZW50LmlkICk7XG5cdHJldHVybiBlbGVtZW50O1xufVxuXG5mdW5jdGlvbiByZW1vdmVEdXBsaWNhdGVSZWR1Y2VyKCBwcmV2LCBlbCApIHtcblx0aWYgKCBwcmV2Lm1hcCggeCA9PiB4LmlkICkuaW5kZXhPZiggZWwuaWQgKSAhPT0gLTEgKSB7XG5cdFx0ZGVidWcoIGB0cmllZCB0byBhZGQgZHVwbGljYXRlIGVsZW1lbnQgZm9yICR7ZWwuaWR9YCApO1xuXHRcdHJldHVybiBwcmV2O1xuXHR9XG5cdHJldHVybiBwcmV2LmNvbmNhdCggZWwgKTtcbn1cblxuZnVuY3Rpb24gbWFrZURlZmF1bHRIYW5kbGVyKCBpZCApIHtcblx0cmV0dXJuIGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdGRlYnVnKCAnY2xpY2sgZGV0ZWN0ZWQgb24nLCBpZCApO1xuXHRcdHNlbmQoICdjb250cm9sLWZvY3VzJywgaWQgKTtcblx0fTtcbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBnZXRGb290ZXJFbGVtZW50cygpIHtcblx0cmV0dXJuIFtcblx0XHR7XG5cdFx0XHRpZDogJ2Zvb3RlcmNyZWRpdCcsXG5cdFx0XHRzZWxlY3RvcjogJ2FbZGF0YS10eXBlPVwiZm9vdGVyLWNyZWRpdFwiXScsXG5cdFx0XHR0eXBlOiAnZm9vdGVyQ3JlZGl0Jyxcblx0XHRcdHBvc2l0aW9uOiAnbWlkZGxlJyxcblx0XHRcdHRpdGxlOiAnZm9vdGVyIGNyZWRpdCcsXG5cdFx0fVxuXHRdO1xufVxuIiwiaW1wb3J0IGdldEpRdWVyeSBmcm9tICcuLi9oZWxwZXJzL2pxdWVyeSc7XG5pbXBvcnQgZGVidWdGYWN0b3J5IGZyb20gJ2RlYnVnJztcblxuY29uc3QgZGVidWcgPSBkZWJ1Z0ZhY3RvcnkoICdjZG06aGVhZGVyLWZvY3VzJyApO1xuY29uc3QgZmFsbGJhY2tTZWxlY3RvciA9ICdoZWFkZXJbcm9sZT1cImJhbm5lclwiXSc7XG5jb25zdCAkID0gZ2V0SlF1ZXJ5KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRIZWFkZXJFbGVtZW50cygpIHtcblx0cmV0dXJuIFsgZ2V0SGVhZGVyRWxlbWVudCgpIF07XG59XG5cbmZ1bmN0aW9uIGdldEhlYWRlckVsZW1lbnQoKSB7XG5cdGNvbnN0IHNlbGVjdG9yID0gZ2V0SGVhZGVyU2VsZWN0b3IoKTtcblx0Y29uc3QgcG9zaXRpb24gPSAoIHNlbGVjdG9yID09PSBmYWxsYmFja1NlbGVjdG9yICkgPyAndG9wLXJpZ2h0JyA6IG51bGw7XG5cdHJldHVybiB7IGlkOiAnaGVhZGVyX2ltYWdlJywgc2VsZWN0b3IsIHR5cGU6ICdoZWFkZXInLCBpY29uOiAnaGVhZGVySWNvbicsIHBvc2l0aW9uLCB0aXRsZTogJ2hlYWRlciBpbWFnZScsIH07XG59XG5cbmZ1bmN0aW9uIGdldEhlYWRlclNlbGVjdG9yKCkge1xuXHRjb25zdCBzZWxlY3RvciA9IGdldE1vZGlmaWVkU2VsZWN0b3JzKCk7XG5cdGlmICggJCggc2VsZWN0b3IgKS5sZW5ndGggPiAwICkge1xuXHRcdHJldHVybiBzZWxlY3Rvcjtcblx0fVxuXHRkZWJ1ZyggJ2ZhaWxlZCB0byBmaW5kIGhlYWRlciBpbWFnZSBzZWxlY3RvciBpbiBwYWdlOyB1c2luZyBmYWxsYmFjaycgKTtcblx0cmV0dXJuIGZhbGxiYWNrU2VsZWN0b3I7XG59XG5cbmZ1bmN0aW9uIGdldE1vZGlmaWVkU2VsZWN0b3JzKCkge1xuXHRyZXR1cm4gW1xuXHRcdCcuaGVhZGVyLWltYWdlIGEgaW1nJyxcblx0XHQnLmhlYWRlci1pbWFnZSBpbWcnLFxuXHRcdCcuc2l0ZS1icmFuZGluZyBhIGltZycsXG5cdFx0Jy5zaXRlLWhlYWRlci1pbWFnZSBpbWcnLFxuXHRcdCcuaGVhZGVyLWltYWdlLWxpbmsgaW1nJyxcblx0XHQnaW1nLmhlYWRlci1pbWFnZScsXG5cdFx0J2ltZy5oZWFkZXItaW1nJyxcblx0XHQnaW1nLmhlYWRlcmltYWdlJyxcblx0XHQnaW1nLmN1c3RvbS1oZWFkZXInLFxuXHRcdCcuZmVhdHVyZWQtaGVhZGVyLWltYWdlIGEgaW1nJ1xuXHRdLm1hcCggc2VsZWN0b3IgPT4gc2VsZWN0b3IgKyAnW3NyY106bm90KFxcJy5zaXRlLWxvZ29cXCcpOm5vdChcXCcud3AtcG9zdC1pbWFnZVxcJyk6bm90KFxcJy5jdXN0b20tbG9nb1xcJyknICkuam9pbigpO1xufVxuIiwiaW1wb3J0IHsgc2VuZCB9IGZyb20gJy4uL2hlbHBlcnMvbWVzc2VuZ2VyJztcbmltcG9ydCBnZXRPcHRpb25zIGZyb20gJy4uL2hlbHBlcnMvb3B0aW9ucy5qcyc7XG5cbmNvbnN0IG9wdHMgPSBnZXRPcHRpb25zKCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNZW51RWxlbWVudHMoKSB7XG5cdHJldHVybiBvcHRzLm1lbnVzLm1hcCggbWVudSA9PiB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGlkOiBtZW51LmlkLFxuXHRcdFx0c2VsZWN0b3I6IGAuJHttZW51LmlkfSBsaTpmaXJzdC1jaGlsZGAsXG5cdFx0XHR0eXBlOiAnbWVudScsXG5cdFx0XHRoYW5kbGVyOiBtYWtlSGFuZGxlciggbWVudS5sb2NhdGlvbiApLFxuXHRcdFx0dGl0bGU6ICdtZW51Jyxcblx0XHR9O1xuXHR9ICk7XG59XG5cbmZ1bmN0aW9uIG1ha2VIYW5kbGVyKCBpZCApIHtcblx0cmV0dXJuIGZ1bmN0aW9uKCkge1xuXHRcdHNlbmQoICdmb2N1cy1tZW51JywgaWQgKTtcblx0fTtcbn1cbiIsImltcG9ydCBnZXRXaW5kb3cgZnJvbSAnLi4vaGVscGVycy93aW5kb3cnO1xuaW1wb3J0IGdldEpRdWVyeSBmcm9tICcuLi9oZWxwZXJzL2pxdWVyeSc7XG5pbXBvcnQgZGVidWdGYWN0b3J5IGZyb20gJ2RlYnVnJztcbmltcG9ydCB7IHNlbmQgfSBmcm9tICcuLi9oZWxwZXJzL21lc3Nlbmdlcic7XG5cbmNvbnN0IGRlYnVnID0gZGVidWdGYWN0b3J5KCAnY2RtOnBhZ2UtYnVpbGRlci1mb2N1cycgKTtcbmNvbnN0ICQgPSBnZXRKUXVlcnkoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhZ2VCdWlsZGVyRWxlbWVudHMoKSB7XG5cdGNvbnN0IHNlbGVjdG9yID0gJy5zaXRlLW1haW4nO1xuXHRjb25zdCAkZWwgPSAkKCBzZWxlY3RvciApO1xuXHRpZiAoICEgJGVsLmxlbmd0aCApIHtcblx0XHRkZWJ1ZyggYGZvdW5kIG5vIHBhZ2UgYnVpbGRlciBmb3Igc2VsZWN0b3IgJHtzZWxlY3Rvcn1gICk7XG5cdFx0cmV0dXJuIFtdO1xuXHR9XG5cdGlmICggISBfQ3VzdG9taXplcl9ETS5iZWF2ZXJfYnVpbGRlciApIHtcblxuXHRcdHJldHVybiBbXTtcblxuXHR9XG5cdHJldHVybiAkLm1ha2VBcnJheSggJGVsIClcblx0LnJlZHVjZSggKCBwb3N0cywgcG9zdCApID0+IHtcblx0XHRjb25zdCB1cmwgPSBnZXRQYWdlQnVpbGRlckxpbmsoKTtcblx0XHRyZXR1cm4gcG9zdHMuY29uY2F0KCB7XG5cdFx0XHRpZDogcG9zdC5pZCxcblx0XHRcdHNlbGVjdG9yOiBzZWxlY3Rvcixcblx0XHRcdHR5cGU6ICdwYWdlX2J1aWxkZXInLFxuXHRcdFx0cG9zaXRpb246ICd0b3AnLFxuXHRcdFx0aGFuZGxlcjogbWFrZUhhbmRsZXIoIHBvc3QuaWQsIHVybCApLFxuXHRcdFx0dGl0bGU6ICdwYWdlX2J1aWxkZXInLFxuXHRcdFx0aWNvbjogJ3BhZ2VCdWlsZGVySWNvbicsXG5cdFx0fSApO1xuXHR9LCBbXSApO1xufVxuXG5mdW5jdGlvbiBnZXRQYWdlQnVpbGRlckxpbmsoKSB7XG5cdGNvbnN0IHVybCA9IF9DdXN0b21pemVyX0RNLnBhZ2VfYnVpbGRlcl9saW5rO1xuXHRpZiAoICEgdXJsICkge1xuXHRcdGRlYnVnKCBgaW52YWxpZCBlZGl0IGxpbmsgVVJMIGZvciBwYWdlIGJ1aWxkZXJgICk7XG5cdH1cblx0cmV0dXJuIHVybDtcbn1cblxuZnVuY3Rpb24gbWFrZUhhbmRsZXIoIGlkLCB1cmwgKSB7XG5cdHJldHVybiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRkZWJ1ZyggYGNsaWNrIGRldGVjdGVkIG9uIHBhZ2UgYnVpbGRlcmAgKTtcblx0XHRnZXRXaW5kb3coKS5vcGVuKCB1cmwgKTtcblx0XHRzZW5kKCAncmVjb3JkRXZlbnQnLCB7XG5cdFx0XHRuYW1lOiAnd3Bjb21fY3VzdG9taXplX2RpcmVjdF9tYW5pcHVsYXRpb25fY2xpY2snLFxuXHRcdFx0cHJvcHM6IHsgdHlwZTogJ3BhZ2UtYnVpbGRlci1pY29uJyB9XG5cdFx0fSApO1xuXHR9O1xufVxuIiwiaW1wb3J0IGdldEFQSSBmcm9tICcuLi9oZWxwZXJzL2FwaSc7XG5pbXBvcnQgeyBzZW5kIH0gZnJvbSAnLi4vaGVscGVycy9tZXNzZW5nZXInO1xuaW1wb3J0IGdldEpRdWVyeSBmcm9tICcuLi9oZWxwZXJzL2pxdWVyeSc7XG5pbXBvcnQgZGVidWdGYWN0b3J5IGZyb20gJ2RlYnVnJztcblxuY29uc3QgZGVidWcgPSBkZWJ1Z0ZhY3RvcnkoICdjZG06d2lkZ2V0cycgKTtcbmNvbnN0IGFwaSA9IGdldEFQSSgpO1xuY29uc3QgJCA9IGdldEpRdWVyeSgpO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0V2lkZ2V0RWxlbWVudHMoKSB7XG5cdHJldHVybiBnZXRXaWRnZXRTZWxlY3RvcnMoKVxuXHQubWFwKCBnZXRXaWRnZXRzRm9yU2VsZWN0b3IgKVxuXHQucmVkdWNlKCAoIHdpZGdldHMsIGlkICkgPT4gd2lkZ2V0cy5jb25jYXQoIGlkICksIFtdICkgLy8gZmxhdHRlbiB0aGUgYXJyYXlzXG5cdC5tYXAoIGlkID0+ICgge1xuXHRcdGlkLFxuXHRcdHNlbGVjdG9yOiBnZXRXaWRnZXRTZWxlY3RvckZvcklkKCBpZCApLFxuXHRcdHR5cGU6ICd3aWRnZXQnLFxuXHRcdGhhbmRsZXI6IG1ha2VIYW5kbGVyRm9ySWQoIGlkICksXG5cdFx0dGl0bGU6ICd3aWRnZXQnLFxuXHR9ICkgKTtcbn1cblxuZnVuY3Rpb24gZ2V0V2lkZ2V0U2VsZWN0b3JzKCkge1xuXHRyZXR1cm4gYXBpLldpZGdldEN1c3RvbWl6ZXJQcmV2aWV3LndpZGdldFNlbGVjdG9ycztcbn1cblxuZnVuY3Rpb24gZ2V0V2lkZ2V0c0ZvclNlbGVjdG9yKCBzZWxlY3RvciApIHtcblx0Y29uc3QgJGVsID0gJCggc2VsZWN0b3IgKTtcblx0aWYgKCAhICRlbC5sZW5ndGggKSB7XG5cdFx0ZGVidWcoICdmb3VuZCBubyB3aWRnZXRzIGZvciBzZWxlY3RvcicsIHNlbGVjdG9yICk7XG5cdFx0cmV0dXJuIFtdO1xuXHR9XG5cdGRlYnVnKCAnZm91bmQgd2lkZ2V0cyBmb3Igc2VsZWN0b3InLCBzZWxlY3RvciwgJGVsICk7XG5cdHJldHVybiAkLm1ha2VBcnJheSggJGVsLm1hcCggKCBpLCB3ICkgPT4gdy5pZCApICk7XG59XG5cbmZ1bmN0aW9uIGdldFdpZGdldFNlbGVjdG9yRm9ySWQoIGlkICkge1xuXHRyZXR1cm4gYCMke2lkfWA7XG59XG5cbmZ1bmN0aW9uIG1ha2VIYW5kbGVyRm9ySWQoIGlkICkge1xuXHRyZXR1cm4gZnVuY3Rpb24oIGV2ZW50ICkge1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0ZGVidWcoICdjbGljayBkZXRlY3RlZCBvbicsIGlkICk7XG5cdFx0c2VuZCggJ2ZvY3VzLXdpZGdldC1jb250cm9sJywgaWQgKTtcblx0fTtcbn1cbiIsImltcG9ydCBnZXRXaW5kb3cgZnJvbSAnLi9oZWxwZXJzL3dpbmRvdyc7XG5pbXBvcnQgZ2V0QVBJIGZyb20gJy4vaGVscGVycy9hcGknO1xuaW1wb3J0IGdldEpRdWVyeSBmcm9tICcuL2hlbHBlcnMvanF1ZXJ5JztcbmltcG9ydCBnZXRPcHRpb25zIGZyb20gJy4vaGVscGVycy9vcHRpb25zJztcbmltcG9ydCB7IGlzU2FmYXJpLCBpc01vYmlsZVNhZmFyaSB9IGZyb20gJy4vaGVscGVycy91c2VyLWFnZW50JztcbmltcG9ydCBtYWtlRm9jdXNhYmxlIGZyb20gJy4vbW9kdWxlcy9mb2N1c2FibGUnO1xuaW1wb3J0IHsgbW9kaWZ5RWRpdFBvc3RMaW5rcywgZGlzYWJsZUVkaXRQb3N0TGlua3MgfSBmcm9tICcuL21vZHVsZXMvZWRpdC1wb3N0LWxpbmtzJztcbmltcG9ydCB7IGdldEhlYWRlckVsZW1lbnRzIH0gZnJvbSAnLi9tb2R1bGVzL2hlYWRlci1mb2N1cyc7XG5pbXBvcnQgeyBnZXRXaWRnZXRFbGVtZW50cyB9IGZyb20gJy4vbW9kdWxlcy93aWRnZXQtZm9jdXMnO1xuaW1wb3J0IHsgZ2V0TWVudUVsZW1lbnRzIH0gZnJvbSAnLi9tb2R1bGVzL21lbnUtZm9jdXMnO1xuaW1wb3J0IHsgZ2V0UGFnZUJ1aWxkZXJFbGVtZW50cyB9IGZyb20gJy4vbW9kdWxlcy9wYWdlLWJ1aWxkZXItZm9jdXMnO1xuaW1wb3J0IHsgZ2V0Rm9vdGVyRWxlbWVudHMgfSBmcm9tICcuL21vZHVsZXMvZm9vdGVyLWZvY3VzJztcblxuY29uc3Qgb3B0aW9ucyA9IGdldE9wdGlvbnMoKTtcbmNvbnN0IGFwaSA9IGdldEFQSSgpO1xuY29uc3QgJCA9IGdldEpRdWVyeSgpO1xuXG5mdW5jdGlvbiBzdGFydERpcmVjdE1hbmlwdWxhdGlvbigpIHtcblxuXHRjb25zdCBiYXNpY0VsZW1lbnRzID0gKCBfQ3VzdG9taXplcl9ETS5pc193cF9mb3VyX3NldmVuICkgPyBbXSA6IFtcblx0XHR7IGlkOiAnYmxvZ25hbWUnLCBzZWxlY3RvcjogJy5zaXRlLXRpdGxlIGEsICNzaXRlLXRpdGxlIGEnLCB0eXBlOiAnc2l0ZVRpdGxlJywgcG9zaXRpb246ICdtaWRkbGUnLCB0aXRsZTogJ3NpdGUgdGl0bGUnIH0sXG5cdF07XG5cblx0Y29uc3Qgd2lkZ2V0cyA9ICggX0N1c3RvbWl6ZXJfRE0uaXNfd3BfZm91cl9zZXZlbiApID8gW10gOiBnZXRXaWRnZXRFbGVtZW50cygpO1xuXHRjb25zdCBoZWFkZXJzID0gKCBvcHRpb25zLmhlYWRlckltYWdlU3VwcG9ydCApID8gZ2V0SGVhZGVyRWxlbWVudHMoKSA6IFtdO1xuXG5cdGNvbnN0IG1lbnVzID0gZ2V0TWVudUVsZW1lbnRzKCk7XG5cdGNvbnN0IGZvb3RlcnMgPSBnZXRGb290ZXJFbGVtZW50cygpO1xuXHRjb25zdCBwYl9lbGVtZW50cyA9IGdldFBhZ2VCdWlsZGVyRWxlbWVudHMoKTtcblxuXHRtYWtlRm9jdXNhYmxlKCBiYXNpY0VsZW1lbnRzLmNvbmNhdCggaGVhZGVycywgd2lkZ2V0cywgbWVudXMsIGZvb3RlcnMsIHBiX2VsZW1lbnRzICkgKTtcblxuXHRpZiAoIC0xID09PSBvcHRpb25zLmRpc2FibGVkTW9kdWxlcy5pbmRleE9mKCAnZWRpdC1wb3N0LWxpbmtzJyApICkge1xuXHRcdGlmICggaXNTYWZhcmkoKSAmJiAhIGlzTW9iaWxlU2FmYXJpKCkgKSB7XG5cdFx0XHRkaXNhYmxlRWRpdFBvc3RMaW5rcyggJy5wb3N0LWVkaXQtbGluaywgW2hyZWZePVwiaHR0cHM6Ly93b3JkcHJlc3MuY29tL3Bvc3RcIl0sIFtocmVmXj1cImh0dHBzOi8vd29yZHByZXNzLmNvbS9wYWdlXCJdJyApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRtb2RpZnlFZGl0UG9zdExpbmtzKCAnLnBvc3QtZWRpdC1saW5rLCBbaHJlZl49XCJodHRwczovL3dvcmRwcmVzcy5jb20vcG9zdFwiXSwgW2hyZWZePVwiaHR0cHM6Ly93b3JkcHJlc3MuY29tL3BhZ2VcIl0nICk7XG5cdFx0fVxuXHR9XG59XG5cbmFwaS5iaW5kKCAncHJldmlldy1yZWFkeScsICgpID0+IHtcblx0Ly8gdGhlIHdpZGdldCBjdXN0b21pemVyIGRvZXNuJ3QgcnVuIHVudGlsIGRvY3VtZW50LnJlYWR5LCBzbyBsZXQncyBydW4gbGF0ZXJcblx0JCggZ2V0V2luZG93KCkuZG9jdW1lbnQgKS5yZWFkeSggKCkgPT4gc2V0VGltZW91dCggc3RhcnREaXJlY3RNYW5pcHVsYXRpb24sIDEwMCApICk7XG59ICk7XG4iXX0=
