function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function hasOne(haystack, arr) {
    return arr.some(function (v) {
        return haystack.some(function(row) {
            return row.indexOf(v) >= 0;
        })
    });
};

function notEmptyArray(arr) {
    if (arr.length == 0) return false
    var counter = 0;
    function count(array) {
        for(var i = 0; i < array.length; ++i){
            if (Array.isArray(array[i])) counter += count(array[i])
            if (array[i] || array[i] === 0) counter++;
        }
    }
    count(arr)
    return counter > 0
}

function getQuestionNumber(question_code) {
    var category_code = question_code.substring(0, question_code.indexOf('_'));
    var firstApperance = question_code.indexOf('_')
    var endIdx = question_code.indexOf('_', firstApperance + 1)
    var indicator_code = question_code.substring(0, endIdx)
    return app.$root.pgtoolForm.categories[category_code].indicators[indicator_code].questions[question_code].number
}

function getOptions(question_code) {
    try {
        var question = app.$root.getQuestion(question_code)
    } finally {
        if (question == undefined) {
            return "This question_code is not valid."
        }
    }
    if ('answer_list' in question) {
        return question.answer_list
    } else {
        return "This question_code has no answer options."
    }
}

Date.prototype.inFull = function() {
    var hours = this.getHours();
    var minutes = this.getMinutes();
    var mm = this.toLocaleString('default', { month: 'short' })
    var dd = this.getDate();
  
    return [(hours>9 ? '' : '0') + hours,
            ':',
            (minutes>9 ? '' : '0') + minutes,
            ' ',
            (dd>9 ? '' : '0') + dd,
            ' ',
            mm,
            ' ',
            this.getFullYear(),
           ].join('');
  };

//Taken from http://bl.ocks.org/mbostock/7555321
//Wraps SVG text	
function wrap(text, nrChar /*width*/, isRotated, spaceAfterFirstLine = 0) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        x = text.attr("x")
    var dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
        if (isRotated && lineNumber == 1) break;
        line.push(word);
        var substring = line.join(" ");
        tspan.text(substring);
      //if (tspan.node().getComputedTextLength() > width) { .getComputedTextLength() depends on the node being visible in the DOM. substituted by number os characters
      if (substring.length > nrChar && line.length > 1) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        lineNumber++
        if (isRotated && lineNumber > 0) x = text.attr("dx")
        if (isRotated && lineNumber == 1 && words.length > 0) word = word.substring(0, nrChar-3)+'...'
        tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", lineNumber * lineHeight + dy + spaceAfterFirstLine + "em").text(word);
      }
    }
  });
}


var debounce = (function () {
  /**
   * lodash (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="npm" -o ./`
   * Copyright jQuery Foundation and other contributors <https://jquery.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   */
  
  /** Used as the `TypeError` message for "Functions" methods. */
  var FUNC_ERROR_TEXT = 'Expected a function';
  
  /** Used as references for various `Number` constants. */
  var NAN = 0 / 0;
  
  /** `Object#toString` result references. */
  var symbolTag = '[object Symbol]';
  
  /** Used to match leading and trailing whitespace. */
  var reTrim = /^\s+|\s+$/g;
  
  /** Used to detect bad signed hexadecimal string values. */
  var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
  
  /** Used to detect binary string values. */
  var reIsBinary = /^0b[01]+$/i;
  
  /** Used to detect octal string values. */
  var reIsOctal = /^0o[0-7]+$/i;
  
  /** Built-in method references without a dependency on `root`. */
  var freeParseInt = parseInt;
  
  /** Detect free variable `global` from Node.js. */
  var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;
  
  /** Detect free variable `self`. */
  var freeSelf = typeof self == 'object' && self && self.Object === Object && self;
  
  /** Used as a reference to the global object. */
  var root = freeGlobal || freeSelf || Function('return this')();
  
  /** Used for built-in method references. */
  var objectProto = Object.prototype;
  
  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;
  
  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeMax = Math.max,
      nativeMin = Math.min;
  
  /**
   * Gets the timestamp of the number of milliseconds that have elapsed since
   * the Unix epoch (1 January 1970 00:00:00 UTC).
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Date
   * @returns {number} Returns the timestamp.
   * @example
   *
   * _.defer(function(stamp) {
   *   console.log(_.now() - stamp);
   * }, _.now());
   * // => Logs the number of milliseconds it took for the deferred invocation.
   */
  var now = function() {
    return root.Date.now();
  };
  
  /**
   * Creates a debounced function that delays invoking `func` until after `wait`
   * milliseconds have elapsed since the last time the debounced function was
   * invoked. The debounced function comes with a `cancel` method to cancel
   * delayed `func` invocations and a `flush` method to immediately invoke them.
   * Provide `options` to indicate whether `func` should be invoked on the
   * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
   * with the last arguments provided to the debounced function. Subsequent
   * calls to the debounced function return the result of the last `func`
   * invocation.
   *
   * **Note:** If `leading` and `trailing` options are `true`, `func` is
   * invoked on the trailing edge of the timeout only if the debounced function
   * is invoked more than once during the `wait` timeout.
   *
   * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
   * until to the next tick, similar to `setTimeout` with a timeout of `0`.
   *
   * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
   * for details over the differences between `_.debounce` and `_.throttle`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Function
   * @param {Function} func The function to debounce.
   * @param {number} [wait=0] The number of milliseconds to delay.
   * @param {Object} [options={}] The options object.
   * @param {boolean} [options.leading=false]
   *  Specify invoking on the leading edge of the timeout.
   * @param {number} [options.maxWait]
   *  The maximum time `func` is allowed to be delayed before it's invoked.
   * @param {boolean} [options.trailing=true]
   *  Specify invoking on the trailing edge of the timeout.
   * @returns {Function} Returns the new debounced function.
   * @example
   *
   * // Avoid costly calculations while the window size is in flux.
   * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
   *
   * // Invoke `sendMail` when clicked, debouncing subsequent calls.
   * jQuery(element).on('click', _.debounce(sendMail, 300, {
   *   'leading': true,
   *   'trailing': false
   * }));
   *
   * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
   * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
   * var source = new EventSource('/stream');
   * jQuery(source).on('message', debounced);
   *
   * // Cancel the trailing debounced invocation.
   * jQuery(window).on('popstate', debounced.cancel);
   */
  function debounce(func, wait, options) {
    var lastArgs,
        lastThis,
        maxWait,
        result,
        timerId,
        lastCallTime,
        lastInvokeTime = 0,
        leading = false,
        maxing = false,
        trailing = true;
  
    if (typeof func != 'function') {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    wait = toNumber(wait) || 0;
    if (isObject(options)) {
      leading = !!options.leading;
      maxing = 'maxWait' in options;
      maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
      trailing = 'trailing' in options ? !!options.trailing : trailing;
    }
  
    function invokeFunc(time) {
      var args = lastArgs,
          thisArg = lastThis;
  
      lastArgs = lastThis = undefined;
      lastInvokeTime = time;
      result = func.apply(thisArg, args);
      return result;
    }
  
    function leadingEdge(time) {
      // Reset any `maxWait` timer.
      lastInvokeTime = time;
      // Start the timer for the trailing edge.
      timerId = setTimeout(timerExpired, wait);
      // Invoke the leading edge.
      return leading ? invokeFunc(time) : result;
    }
  
    function remainingWait(time) {
      var timeSinceLastCall = time - lastCallTime,
          timeSinceLastInvoke = time - lastInvokeTime,
          result = wait - timeSinceLastCall;
  
      return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
    }
  
    function shouldInvoke(time) {
      var timeSinceLastCall = time - lastCallTime,
          timeSinceLastInvoke = time - lastInvokeTime;
  
      // Either this is the first call, activity has stopped and we're at the
      // trailing edge, the system time has gone backwards and we're treating
      // it as the trailing edge, or we've hit the `maxWait` limit.
      return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
        (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
    }
  
    function timerExpired() {
      var time = now();
      if (shouldInvoke(time)) {
        return trailingEdge(time);
      }
      // Restart the timer.
      timerId = setTimeout(timerExpired, remainingWait(time));
    }
  
    function trailingEdge(time) {
      timerId = undefined;
  
      // Only invoke if we have `lastArgs` which means `func` has been
      // debounced at least once.
      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      lastArgs = lastThis = undefined;
      return result;
    }
  
    function cancel() {
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
      lastInvokeTime = 0;
      lastArgs = lastCallTime = lastThis = timerId = undefined;
    }
  
    function flush() {
      return timerId === undefined ? result : trailingEdge(now());
    }
  
    function debounced() {
      var time = now(),
          isInvoking = shouldInvoke(time);
  
      lastArgs = arguments;
      lastThis = this;
      lastCallTime = time;
  
      if (isInvoking) {
        if (timerId === undefined) {
          return leadingEdge(lastCallTime);
        }
        if (maxing) {
          // Handle invocations in a tight loop.
          timerId = setTimeout(timerExpired, wait);
          return invokeFunc(lastCallTime);
        }
      }
      if (timerId === undefined) {
        timerId = setTimeout(timerExpired, wait);
      }
      return result;
    }
    debounced.cancel = cancel;
    debounced.flush = flush;
    return debounced;
  }
  
  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject(value) {
    var type = typeof value;
    return !!value && (type == 'object' || type == 'function');
  }
  
  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return !!value && typeof value == 'object';
  }
  
  /**
   * Checks if `value` is classified as a `Symbol` primitive or object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
   * @example
   *
   * _.isSymbol(Symbol.iterator);
   * // => true
   *
   * _.isSymbol('abc');
   * // => false
   */
  function isSymbol(value) {
    return typeof value == 'symbol' ||
      (isObjectLike(value) && objectToString.call(value) == symbolTag);
  }
  
  /**
   * Converts `value` to a number.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to process.
   * @returns {number} Returns the number.
   * @example
   *
   * _.toNumber(3.2);
   * // => 3.2
   *
   * _.toNumber(Number.MIN_VALUE);
   * // => 5e-324
   *
   * _.toNumber(Infinity);
   * // => Infinity
   *
   * _.toNumber('3.2');
   * // => 3.2
   */
  function toNumber(value) {
    if (typeof value == 'number') {
      return value;
    }
    if (isSymbol(value)) {
      return NAN;
    }
    if (isObject(value)) {
      var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
      value = isObject(other) ? (other + '') : other;
    }
    if (typeof value != 'string') {
      return value === 0 ? value : +value;
    }
    value = value.replace(reTrim, '');
    var isBinary = reIsBinary.test(value);
    return (isBinary || reIsOctal.test(value))
      ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
      : (reIsBadHex.test(value) ? NAN : +value);
  }
  
  return debounce
  })();

  /**
 * Minified by jsDelivr using Terser v3.14.1.
 * Original file: /npm/text-clipper@2.1.0/dist/index.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
"use strict";var VOID_ELEMENTS=["area","base","br","col","command","embed","hr","img","input","keygen","link","meta","param","source","track","wbr"],BLOCK_ELEMENTS=["address","article","aside","blockquote","canvas","dd","div","dl","dt","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","hr","li","main","nav","noscript","ol","output","p","pre","section","table","tbody","tfoot","thead","tr","ul","video"],NEWLINE_CHAR_CODE=10,EXCLAMATION_CHAR_CODE=33,DOUBLE_QUOTE_CHAR_CODE=34,AMPERSAND_CHAR_CODE=38,SINGLE_QUOTE_CHAR_CODE=39,FORWARD_SLASH_CHAR_CODE=47,SEMICOLON_CHAR_CODE=59,TAG_OPEN_CHAR_CODE=60,EQUAL_SIGN_CHAR_CODE=61,TAG_CLOSE_CHAR_CODE=62,CHAR_OF_INTEREST_REGEX=/[<&\n\ud800-\udbff]/,SIMPLIFY_WHITESPACE_REGEX=/\s{2,}/g;function clip(e,r,i){return void 0===i&&(i={}),e?(e=e.toString(),i.html?clipHtml(e,r,i):clipPlainText(e,r,i)):""}function clipHtml(e,r,i){for(var t=i.imageWeight,a=void 0===t?2:t,C=i.indicator,n=void 0===C?"…":C,f=i.maxLines,E=void 0===f?1/0:f,_=n.length,o=1,A=0,h=!1,c=[],l=e.length;A<l;A++){var O=A?e.slice(A):e,s=O.search(CHAR_OF_INTEREST_REGEX),d=s>-1?s:O.length;if(A+=d,!h)if(shouldSimplifyWhiteSpace(c)){if((_+=simplifyWhiteSpace(d===O.length?O:O.slice(0,s)).length)>r){A-=d;break}}else if((_+=d)>r){A=Math.max(A-_+r,0);break}if(-1===s)break;if((M=e.charCodeAt(A))===TAG_OPEN_CHAR_CODE){var R=e.charCodeAt(A+1)===EXCLAMATION_CHAR_CODE;if(R&&"--"===e.substr(A+2,2))A=e.indexOf("--\x3e",A+4)+3-1;else if(R&&"[CDATA["===e.substr(A+2,7)){A=e.indexOf("]]>",A+9)+3-1}else{if(_===r&&e.charCodeAt(A+1)!==FORWARD_SLASH_CHAR_CODE){_++;break}for(var S=0,u=A,H=!1;;){if(++u>=l)throw new Error("Invalid HTML: "+e);var D=e.charCodeAt(u);if(H)S?D===S&&(H=!1):isWhiteSpace(D)?H=!1:D===TAG_CLOSE_CHAR_CODE&&(H=!1,u--);else if(D===EQUAL_SIGN_CHAR_CODE){for(;isWhiteSpace(e.charCodeAt(u+1));)u++;H=!0;var v=e.charCodeAt(u+1);v===DOUBLE_QUOTE_CHAR_CODE||v===SINGLE_QUOTE_CHAR_CODE?(S=v,u++):S=0}else if(D===TAG_CLOSE_CHAR_CODE){var L=e.charCodeAt(A+1)===FORWARD_SLASH_CHAR_CODE,p=A+(L?2:1),b=Math.min(indexOfWhiteSpace(e,p),u);if((x=e.slice(p,b).toLowerCase()).charCodeAt(x.length-1)===FORWARD_SLASH_CHAR_CODE&&(x=x.slice(0,x.length-1)),L){if(c.pop()!==x)throw new Error("Invalid HTML: "+e);if(("math"===x||"svg"===x)&&!(h=c.includes("math")||c.includes("svg"))&&(_+=a)>r)break;if(BLOCK_ELEMENTS.includes(x)&&!h&&++o>E){c.push(x);break}}else if(VOID_ELEMENTS.includes(x)||e.charCodeAt(u-1)===FORWARD_SLASH_CHAR_CODE){if("br"===x){if(++o>E)break}else if("img"===x&&(_+=a)>r)break}else c.push(x),"math"!==x&&"svg"!==x||(h=!0);A=u;break}}if(_>r||o>E)break}}else if(M===AMPERSAND_CHAR_CODE){u=A+1;for(var g=!0;;){var k=e.charCodeAt(u);if(!isCharacterReferenceCharacter(k)){if(k===SEMICOLON_CHAR_CODE)break;g=!1;break}u++}if(!h&&++_>r)break;g&&(A=u)}else if(M===NEWLINE_CHAR_CODE){if(!h&&!shouldSimplifyWhiteSpace(c)){if(++_>r)break;if(++o>E)break}}else{if(!h&&++_>r)break;56320==(64512&e.charCodeAt(A+1))&&A++}}if(_>r){var N=takeHtmlCharAt(e,A);if(n){for(var m=A+N.length;e.charCodeAt(m)===TAG_OPEN_CHAR_CODE&&e.charCodeAt(m+1)===FORWARD_SLASH_CHAR_CODE;){var T=e.indexOf(">",m+2)+1;if(!T)break;m=T}m&&(m===e.length||isLineBreak(e,m))&&(A+=N.length,N=e.charAt(A))}for(;"<"===N&&e.charCodeAt(A+1)===FORWARD_SLASH_CHAR_CODE;){var W=(x=c.pop())?e.indexOf(">",A+2):-1;if(-1===W||e.slice(A+2,W).trim()!==x)throw new Error("Invalid HTML: "+e);A=W+1,N=e.charAt(A)}if(A<e.length){if(!i.breakWords)for(var I=A-n.length;I>=0;I--){var M;if((M=e.charCodeAt(I))===TAG_CLOSE_CHAR_CODE||M===SEMICOLON_CHAR_CODE)break;if(M===NEWLINE_CHAR_CODE||M===TAG_OPEN_CHAR_CODE){A=I;break}if(isWhiteSpace(M)){A=I+(n?1:0);break}}var G=e.slice(0,A);for(isLineBreak(e,A)||(G+=n);c.length;){G+="</"+(x=c.pop())+">"}return G}}else if(o>E){for(G=e.slice(0,A);c.length;){var x;G+="</"+(x=c.pop())+">"}return G}return e}function clipPlainText(e,r,i){for(var t=i.indicator,a=void 0===t?"…":t,C=i.maxLines,n=void 0===C?1/0:C,f=a.length,E=1,_=0,o=e.length;_<o&&!(++f>r);_++){if((l=e.charCodeAt(_))===NEWLINE_CHAR_CODE){if(++E>n)break}else if(55296==(64512&l)){56320==(64512&e.charCodeAt(_+1))&&_++}}if(f>r){var A=takeCharAt(e,_);if(a){var h=_+A.length;if(h===e.length)return e;if(e.charCodeAt(h)===NEWLINE_CHAR_CODE)return e.slice(0,_+A.length)}if(!i.breakWords)for(var c=_-a.length;c>=0;c--){var l;if((l=e.charCodeAt(c))===NEWLINE_CHAR_CODE){_=c,A="\n";break}if(isWhiteSpace(l)){_=c+(a?1:0);break}}return e.slice(0,_)+("\n"===A?"":a)}return E>n?e.slice(0,_):e}function indexOfWhiteSpace(e,r){for(var i=e.length,t=r;t<i;t++)if(isWhiteSpace(e.charCodeAt(t)))return t;return i}function isCharacterReferenceCharacter(e){return e>=48&&e<=57||e>=65&&e<=90||e>=97&&e<=122}function isLineBreak(e,r){var i=e.charCodeAt(r);if(i===NEWLINE_CHAR_CODE)return!0;if(i===TAG_OPEN_CHAR_CODE){var t="("+BLOCK_ELEMENTS.join("|")+"|br)";return new RegExp("^<"+t+"[\t\n\f\r ]*/?>","i").test(e.slice(r))}return!1}function isWhiteSpace(e){return 9===e||10===e||12===e||13===e||32===e}function shouldSimplifyWhiteSpace(e){for(var r=e.length-1;r>=0;r--){var i=e[r];if("li"===i||"td"===i)return!1;if("ol"===i||"table"===i||"ul"===i)return!0}return!1}function simplifyWhiteSpace(e){return e.trim().replace(SIMPLIFY_WHITESPACE_REGEX," ")}function takeCharAt(e,r){var i=e.charCodeAt(r);if(55296==(64512&i)){var t=e.charCodeAt(r+1);if(56320==(64512&t))return String.fromCharCode(i,t)}return String.fromCharCode(i)}function takeHtmlCharAt(e,r){var i=takeCharAt(e,r);if("&"===i)for(;;){r++;var t=e.charCodeAt(r);if(!isCharacterReferenceCharacter(t)){if(t===SEMICOLON_CHAR_CODE){i+=String.fromCharCode(t);break}break}i+=String.fromCharCode(t)}return i}
//# sourceMappingURL=/sm/15a3a21783cd4fea4951a4455e905a3746bb9c89e77fffafd2cbb9fc579d65b3.map