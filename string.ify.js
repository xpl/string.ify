"use strict";

const O          = require ('es7-object-polyfill'),
      bullet     = require ('string.bullet'),
      isBrowser  = (typeof window !== 'undefined') && (window.window === window) && window.navigator,
      maxOf      = (arr, pick) => arr.reduce ((max, s) => Math.max (max, pick ? pick (s) : s), 0),
      isInteger  = Number.isInteger || (value => (typeof value === 'number') && isFinite (value) && (Math.floor (value) === value))

const configure = cfg => {
const stringify = O.assign (x => {

        if (cfg.pretty === 'auto') {
            const   oneLine =                         stringify.configure ({ pretty: false, siblings: new Map () }) (x)
            return (oneLine.length <= 80) ? oneLine : stringify.configure ({ pretty: true,  siblings: new Map () }) (x) }

        var customFormat = cfg.formatter && cfg.formatter (x, stringify)

        if (typeof customFormat === 'string') {
            return customFormat }

        if ((typeof jQuery !== 'undefined') && (x instanceof jQuery)) {
            x = x.toArray () }

        if (isBrowser && (x === window)) {
            return 'window' }

        else if (!isBrowser && (typeof global !== 'undefined') && (x === global)) {
            return 'global' }

        else if (x === null) {
            return 'null' }

        else if (cfg.parents.has (x)) {
            return cfg.pure ? undefined : '<cyclic>' }

        else if (cfg.siblings.has (x)) {
            return cfg.pure ? undefined : '<ref:' + cfg.siblings.get (x) + '>' }

        else if (x && (typeof Symbol !== 'undefined')
                   && (customFormat = x[Symbol.for ('String.ify')])
                   && (typeof (customFormat = customFormat.call (x, stringify)) === 'string')) {
            return customFormat }

        else if (x instanceof Function) {
            return (cfg.pure ? x.toString () : (x.name ? ('<function:' + x.name + '>') : '<function>')) }

        else if (typeof x === 'string') {
            return '"' + stringify.limit (x, cfg.pure ? Number.MAX_SAFE_INTEGER : cfg.maxStringLength) + '"' }

        else if (typeof x === 'object') {

            cfg.parents.add (x)
            cfg.siblings.set (x, cfg.siblings.size)

            const result = stringify.object (x, cfg)

            cfg.parents.delete (x)

            return result }

        else if (!isInteger (x) && (cfg.precision > 0)) {
            return x.toFixed (cfg.precision) }

        else {
            return String (x) }

    }, cfg, {

        configure: newConfig => configure (O.assign ({}, cfg, newConfig)),

        limit: (s, n) => s && ((s.length <= n) ? s : (s.substr (0, n - 1) + '…')),

        oneLine: x => stringify.configure ({ pretty: false }) (x),

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

            if (!cfg.pure && ((cfg.depth >= cfg.maxDepth) || (isArray && (x.length > cfg.maxArrayLength)))) {
                return isArray ? '<array[' + x.length + ']>' : '<object>' }

            const pretty   = cfg.pretty ? true : false,
                  entries  = O.entries (x),
                  oneLine  = !pretty || (entries.length < 2),
                  quoteKey = cfg.json ? (k => '"' + k + '"') : (k => k)

            if (pretty) {

                const values        = O.values (x),
                      printedKeys   = stringify.rightAlign (O.keys (x).map (k => quoteKey (k) + ': ')),
                      printedValues = values.map (stringify.configure ({ depth: cfg.depth + 1 })),
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

                const items   = entries.map (kv => (isArray ? '' : (quoteKey (kv[0]) + ': ')) + stringify.configure ({ depth: cfg.depth + 1 }) (kv[1])),
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

                    parents:         new Set (),
                    siblings:        new Map (),
                    depth:           0,
                    pure:            false,
                    json:            false,
                    color:           false, // not supported yet
                    maxDepth:        5,
                    maxArrayLength:  60,
                    maxStringLength: 60,
                    precision:       undefined,
                    formatter:       undefined,
                    pretty:         'auto'

                })



