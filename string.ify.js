"use strict";

const O          = require ('es7-object-polyfill'),
      bullet     = require ('string.bullet'),
      isBrowser  = (typeof window !== 'undefined') && (window.window === window) && window.navigator,
      maxOf      = (arr, pick) => arr.reduce ((max, s) => Math.max (max, pick ? pick (s) : s), 0),
      limitTo    = (s, n) => s && ((s.length <= n) ? s : (s.substr (0, n - 1) + '…')),
      isInteger  = Number.isInteger || (value => (typeof value === 'number') && isFinite (value) && (Math.floor (value) === value))

const stringify = module.exports = function (x, cfg) {

    cfg = O.assign ({ pretty: 'auto' }, cfg)

    if (cfg.pretty === 'auto') {
        var oneLine = stringify (x, O.assign ({}, cfg, { pretty: false, siblings: new Map () }))
        if (oneLine.length <= 80) {
            return oneLine }
        else {
            return stringify (x, O.assign ({}, cfg, { pretty: true, siblings: new Map () })) } }

    cfg = O.assign ({

                parents: new Set (),
                siblings: new Map (),
                depth: 0,
                pure: false,
                color: false,
                maxDepth: 5,
                maxArrayLength: 60,
                maxStringLength: 60,
                precision: undefined,
                formatter: undefined

            }, cfg, {

                goDeeper: (y, newCfg) => stringify (y, O.assign ({}, cfg, { depth: cfg.depth + 1 }, newCfg))

            })

    var customFormat = cfg.formatter && cfg.formatter (x, cfg)

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
               && (typeof (customFormat = customFormat.call (x, cfg)) === 'string')) {
        return customFormat }

    else if (x instanceof Function) {
        return (cfg.pure ? x.toString () : (x.name ? ('<function:' + x.name + '>') : '<function>')) }

    else if (typeof x === 'string') {
        return '"' + limitTo (x, cfg.pure ? Number.MAX_SAFE_INTEGER : cfg.maxStringLength) + '"' }

    else if (typeof x === 'object') {

        cfg.parents.add (x)
        cfg.siblings.set (x, cfg.siblings.size)

        var result = stringify.object (x, cfg)

        cfg.parents.delete (x)

        return result }

    else if (!isInteger (x) && (cfg.precision > 0)) {
        return x.toFixed (cfg.precision) }

    else {
        return String (x) } }

stringify.oneLine = function (x, cfg) {
                        return stringify (x, O.assign (cfg || {}, { pretty: false })) }

stringify.object = function (x, cfg) {

    if (x instanceof Set) {
        x = Array.from (x.values ()) }

    else if (x instanceof Map) {
        x = Array.from (x.entries ()) }

    var isArray = Array.isArray (x)

    if (isBrowser) {
        
        if (x instanceof Element) {
            return '<' + (x.tagName.toLowerCase () +
                        ((x.id && ('#' + x.id)) || '') +
                        ((x.className && ('.' + x.className)) || '')) + '>' }
        
        else if (x instanceof Text) {
            return '@' + limitTo (x.wholeText, 20) } }

    if (!cfg.pure && ((cfg.depth >= cfg.maxDepth) || (isArray && (x.length > cfg.maxArrayLength)))) {
        return isArray ? '<array[' + x.length + ']>' : '<object>' }

    var pretty   = cfg.pretty ? true : false
    var entries  = O.entries (x)
    var oneLine  = !pretty || (entries.length < 2)
    var quoteKey = cfg.json ? (k => '"' + k + '"') : (k => k)

    if (pretty) {

        var alignStringsRight = strings => {
                                    var max = maxOf (strings, s => s.length)
                                    return strings.map (s => ' '.repeat (max - s.length) + s) }

        var values        = O.values (x)
        var printedKeys   = alignStringsRight (O.keys (x).map (k => quoteKey (k) + ': '))
        var printedValues = values.map (cfg.goDeeper)

        var leftPaddings = printedValues.map (function (x, i) {
                                                return (((x[0] === '[') ||
                                                         (x[0] === '{')) ? 3 :
                                                            (typeof values[i] === 'string') ? 1 : 0) })
        var maxLeftPadding = maxOf (leftPaddings)

        var items = leftPaddings.map ((padding, i) => {
                                var value = ' '.repeat (maxLeftPadding - padding) + printedValues[i]
                                return isArray ? value : bullet (printedKeys[i], value) })

        var printed = bullet (isArray ? '[ ' :
                                        '{ ', items.join (',\n'))

        var lines    = printed.split ('\n')
        var lastLine = lines[lines.length - 1]

        return printed +  (' '.repeat (maxOf (lines, l => l.length) - lastLine.length) + (isArray ? ' ]' : ' }')) }

    else {

        var items = entries.map (kv => (isArray ? '' : (quoteKey (kv[0]) + ': ')) + cfg.goDeeper (kv[1]))
        var content = items.join (', ')

        return isArray
                ? ('['  + content +  ']')
                : ('{ ' + content + ' }')
    }
}



