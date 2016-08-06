# String.ify

A small, simple cross-platform JavaScript object stringifier / pretty-printer.

## Why

- Humanized output
- Highly configurable
- Pluggable rendering (via [Symbols](http://blog.keithcirkel.co.uk/metaprogramming-in-es6-symbols/))
- Works in Node and browsers

## Installing

```javascript
npm install string.ify
```

In your code:

```javascript
String.ify = require ('string.ify')
```

## How it works

```javascript
String.ify ({ obj: [{ someLongPropertyName: 1, propertyName: 2, anotherProp: 4, moreProps: 5 },
                    { propertyName: { foobarbaz: true, qux: 6, zap: "lol" } }] })
```

Will output:

```
{ obj: [ { someLongPropertyName: 1,
                   propertyName: 2,
                    anotherProp: 4,
                      moreProps: 5  },
         { propertyName: { foobarbaz:  true,
                                 qux:  6,
                                 zap: "lol"  } } ] }
```

As you can see, it does some fancy alignment to make complex nested objects look more readable.

It automatically detects whether the pretty printing is nessesary: if total output is less than 80 symbols wide, it renders it as single line:

```javascript
String.ify ({ foo: 1, bar: 2 }) // { foo: 1, bar: 2 }
```

It handles `global` and `window` references, so it wont mess up your output:

```javascript
String.ify ({ root: global }) // { root: global }
```

Cyclic references:

```javascript
var obj = {}
    obj.foo = { bar: [obj] }

String.ify (obj) // { foo: { bar: [<cyclic>] } }
```

Collapsing multiple references to same object:

```javascript
var obj = {}

String.ify ([obj, obj, obj]) // [{  }, <ref:1>, <ref:1>]
```

## Configuring output

You can force single-line rendering by setting `{ pretty: false }` (there also exists `String.ify.oneLine` alias):

```javascript
String.ify ({ nil: null, nope: undefined, fn: function ololo () {}, bar: [{ baz: "garply", qux: [1, 2, 3] }] }, { pretty: false })
//          { nil: null, nope: undefined, fn: <function:ololo>,     bar: [{ baz: "garply", qux: [1, 2, 3] }] }
```

Setting `maxStringLength` (default is `60`):

```javascript
String.ify ({ yo: 'blablablabla' }, { maxStringLength: 4 }) // '{ yo: "bla…" }')
```

JSON-compatible output:

```javascript
String.ify ({ foo: { bar: 'baz' } }, { json: true }) // { "foo": { "bar": "baz" } }
```

JavaScript output:

```javascript
String.ify ({ yo: function () { return 123 } }, { pure: true }) // { yo: function () { return 123 } }
```

Setting `maxDepth` (defaults to `5`) and `maxArrayLength` (defaults to `60`):

```javascript
String.ify ({ foo: { bar: { qux: {}       } }, qux: [1,2,3,4,5,6] }, { maxDepth: 2, maxArrayLength: 5 }),
//         '{ foo: { bar: { qux: <object> } }, qux: <array[6]> }')
```

Setting floating-point output precision:

```javascript
String.ify ({ a: 123, b: 123.000001 }))                   // { a: 123, b: 123.000001 }
String.ify ({ a: 123, b: 123.000001 }, { precision: 2 })) // { a: 123, b: 123.00 }
```

## Custom rendering

### With ad-hoc formatter

```javascript
var booleanAsYesNo = x => (typeof x === 'boolean')
                             ? (x ? 'yes' : 'no')
                             : undefined) // return undefined to fall back

String.ify ({ a: { b: true }, c: false }, { formatter: booleanAsYesNo })
//         '{ a: { b: yes }, c: no }'
```

### With Symbols

If you don't know what they are, [read this article](http://blog.keithcirkel.co.uk/metaprogramming-in-es6-symbols/). Symbols are awesome! They allow to add hidden properties to arbitrary objects, like metadata. **String.ify** uses this mechanism to implement custom formatters on rendered objects:

```javascript
Boolean.prototype[Symbol.for ('String.ify')] = function () {
                                                   return this ? 'yes' : 'no' }

String.ify ({ a: { b: true }, c: false })
//         '{ a: { b: yes }, c: no }'
```

Here's an example of adding purple ASCII color to rendered arrays:

```javascript
Array.prototype[Symbol.for ('String.ify')] = function (ctx) {
    return '\u001B[35m[' + this.map (x => ctx.goDeeper (x, { pretty: false })).join (', ') + ']\u001b[0m'
}

String.ify ({ a:           [{ foo: 42, bar: 43 }, 44, 45, 46] }, { pretty: true })
//         '{ a: \u001B[35m[{ foo: 42, bar: 43 }, 44, 45, 46]\u001b[0m }')
```

Note how a renderer's context (`ctx` argument here) is passed to a renderer function. It exposes `goDeeper` method, which has same interface as `String.ify` function. With help of that method you can render nested objects, overriding config if nessesary (in this example, we overrode the `pretty` option to enforce single-line rendering of array contents).
