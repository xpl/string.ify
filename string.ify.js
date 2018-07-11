"use strict";

const bullet       = require ('string.bullet'),
      isBrowser    = (typeof window !== 'undefined') && (window.window === window) && window.navigator,
      maxOf        = (arr, pick) => arr.reduce ((max, s) => Math.max (max, pick ? pick (s) : s), 0),
      isInteger    = Number.isInteger || (value => (typeof value === 'number') && isFinite (value) && (Math.floor (value) === value)),
      isTypedArray = x => (x instanceof Float32Array) ||
                          (x instanceof Float64Array) ||
                          (x instanceof Int8Array) ||
                          (x instanceof Uint8Array) ||
                          (x instanceof Uint8ClampedArray) ||
                          (x instanceof Int16Array) ||
                          (x instanceof Int32Array) ||
                          (x instanceof Uint32Array)

const assignProps = (to, from) => { for (const prop in from) { Object.defineProperty (to, prop, Object.getOwnPropertyDescriptor (from, prop)) }; return to }

const escapeStr = x => x.replace (/\n/g, '\\n')
                        .replace (/\'/g, "\\'")
                        .replace (/\"/g, '\\"')

const { first, strlen } = require ('printable-characters') // handles ANSI codes and invisible characters

const limit = (s, n) => s && ((strlen (s) <= n) ? s : (first (s, n - 1) + '…'))

const configure = cfg => {

    const stringify = x => {

            const state = Object.assign ({ parents: new Set (), siblings: new Map () }, cfg)

            if (cfg.pretty === 'auto') {
                const   oneLine =                                    stringify.configure ({ pretty: false, siblings: new Map () }) (x)
                return (oneLine.length <= cfg.maxLength) ? oneLine : stringify.configure ({ pretty: true,  siblings: new Map () }) (x) }

            var customFormat = cfg.formatter && cfg.formatter (x, stringify)

            if (typeof customFormat === 'string') {
                return customFormat }

            if ((typeof jQuery !== 'undefined') && (x instanceof jQuery)) {
                x = x.toArray () }

            else if (isTypedArray (x)) {
                x = Array.from (x) }

            if (isBrowser && (x === window)) {
                return 'window' }

            else if (!isBrowser && (typeof global !== 'undefined') && (x === global)) {
                return 'global' }

            else if (x === null) {
                return 'null' }

            else if (x instanceof Date) {
                return state.pure ? x.getTime () : "📅  " + x.toString () }

            else if (x instanceof RegExp) {
                return state.json ? '"' + x.toString () + '"' : x.toString () }

            else if (state.parents.has (x)) {
                return state.pure ? undefined : '<cyclic>' }

            else if (!state.pure && state.siblings.has (x)) {
                return '<ref:' + state.siblings.get (x) + '>' }

            else if (x && (typeof Symbol !== 'undefined')
                       && (customFormat = x[Symbol.for ('String.ify')])
                       && (typeof customFormat === 'function')
                       && (typeof (customFormat = customFormat.call (x, stringify.configure (state))) === 'string')) {

                return customFormat }

            else if (x instanceof Function) {
                return (cfg.pure ? x.toString () : (x.name ? ('<function:' + x.name + '>') : '<function>')) }

            else if (typeof x === 'string') {
                return '"' + escapeStr (limit (x, cfg.pure ? Number.MAX_SAFE_INTEGER : cfg.maxStringLength)) + '"' }

            else if ((x instanceof Promise) && !state.pure) {
                return '<Promise>' }

            else if (typeof x === 'object') {

                state.parents.add (x)
                state.siblings.set (x, state.siblings.size)

                const result = stringify.configure (Object.assign ({}, state, { pretty: state.pretty === false ? false : 'auto', depth: state.depth + 1 })).object (x)

                state.parents.delete (x)

                return result }

            else if ((typeof x === 'number') && !isInteger (x) && (cfg.precision > 0)) {
                return x.toFixed (cfg.precision) }

            else {
                return String (x) }
        }

    /*  API  */

        assignProps (stringify, {

            state: cfg,

            configure: newConfig => configure (Object.assign ({}, cfg, newConfig)),

        /*  TODO: generalize generation of these chain-style .configure helpers (maybe in a separate library, as it looks like a common pattern)    */

            get pretty   () { return stringify.configure ({ pretty: true }) },
            get noPretty () { return stringify.configure ({ pretty: false }) },

            get json () { return stringify.configure ({ json: true, pure: true }) },
            get pure () { return stringify.configure ({ pure: true }) },

            maxStringLength (n = Number.MAX_SAFE_INTEGER) { return stringify.configure ({ maxStringLength: n }) },
            maxArrayLength  (n = Number.MAX_SAFE_INTEGER) { return stringify.configure ({ maxArrayLength: n }) },
            maxObjectLength (n = Number.MAX_SAFE_INTEGER) { return stringify.configure ({ maxObjectLength: n }) },
            maxDepth        (n = Number.MAX_SAFE_INTEGER) { return stringify.configure ({ maxDepth: n }) },
            maxLength       (n = Number.MAX_SAFE_INTEGER) { return stringify.configure ({ maxLength: n }) },
            
            precision (p) { return stringify.configure ({ precision: p }) },
            formatter (f) { return stringify.configure ({ formatter: f }) },

        /*  Some undocumented internals    */

            limit,

            rightAlign: strings => {
                            var max = maxOf (strings, s => s.length)
                            return strings.map (s => ' '.repeat (max - s.length) + s) },

            object: x => {

                if (x instanceof Set) {
                    x = Array.from (x.values ()) }

                else if (x instanceof Map) {
                    x = Array.from (x.entries ()) }

                const isArray = Array.isArray (x)

                if (isBrowser) {
                    
                    if (x instanceof Element) {
                        return '<' + (x.tagName.toLowerCase () +
                                    ((x.id && ('#' + x.id)) || '') +
                                    ((x.className && ('.' + x.className)) || '')) + '>' }
                    
                    else if (x instanceof Text) {
                        return '@' + stringify.limit (x.wholeText, 20) } }

                const entries = Object.entries (x)

                const tooDeep = (cfg.depth > cfg.maxDepth)
                    , tooBig  = (isArray ? (entries.length > cfg.maxArrayLength) :
                                           (entries.length > cfg.maxObjectLength))

                if (!cfg.pure && (tooDeep || tooBig)) {
                    return '<' + (isArray ? 'array' : 'object') + '[' + entries.length + ']>'
                }

                const pretty   = cfg.pretty ? true : false,
                      oneLine  = !pretty || (entries.length < 2),
                      quoteKey = (cfg.json ? (k => '"' + escapeStr (k) + '"') :
                                             (k => /^[A-z][A-z0-9]*$/.test (k) ? k : ("'" + escapeStr (k) + "'")))

                if (pretty) {

                    const values        = Object.values (x),
                          printedKeys   = stringify.rightAlign (Object.keys (x).map (k => quoteKey (k) + ': ')),
                          printedValues = values.map (stringify),
                          leftPaddings  = printedValues.map ((x, i) => (((x[0] === '[') ||
                                                                         (x[0] === '{'))
                                                                            ? 3
                                                                            : ((typeof values[i] === 'string') ? 1 : 0))),
                          maxLeftPadding = maxOf (leftPaddings),

                          items = leftPaddings.map ((padding, i) => {
                                            const value = ' '.repeat (maxLeftPadding - padding) + printedValues[i]
                                            return isArray ? value : bullet (printedKeys[i], value) }),

                          printed = bullet (isArray ? '[ ' :
                                                      '{ ', items.join (',\n')),

                          lines    = printed.split ('\n'),
                          lastLine = lines[lines.length - 1]

                    return printed +  (' '.repeat (maxOf (lines, l => l.length) - lastLine.length) + (isArray ? ' ]' : ' }')) }

                else {

                    const items   = entries.map (kv => (isArray ? '' : (quoteKey (kv[0]) + ': ')) + stringify (kv[1])),
                          content = items.join (', ')

                    return isArray
                            ? ('['  + content +  ']')
                            : ('{ ' + content + ' }')
                }
            }
        })

        return stringify
    }

module.exports = configure ({

                    depth:           0,
                    pure:            false,
                    json:            false,
                //  color:           false, // not supported yet
                    maxDepth:        5,
                    maxLength:       50,
                    maxArrayLength:  60,
                    maxObjectLength: 200,
                    maxStringLength: 60,
                    precision:       undefined,
                    formatter:       undefined,
                    pretty:         'auto',
                })


