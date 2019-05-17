# String.ify

[![Build Status](https://travis-ci.org/xpl/string.ify.svg?branch=master)](https://travis-ci.org/xpl/string.ify) [![npm](https://img.shields.io/npm/v/string.ify.svg)](https://npmjs.com/package/string.ify) [![dependencies Status](https://david-dm.org/xpl/string.ify/status.svg)](https://david-dm.org/xpl/string.ify)

A small, simple yet powerful JavaScript object stringifier / pretty-printer. Powers the [`Ololog`](https://github.com/xpl/ololog) library.

## Why

- Humanized output
- Highly configurable
- Pluggable rendering (via [Symbols](https://github.com/xpl/string.ify/blob/master/README.md#with-symbols))
- Works in Node and browsers

## Recent changes

- `RegExp` instances now rendered correctly
- Chain-style configuration helpers: `stringify.pure.noPretty.maxDepth (10) (...)`
- Now understands typed arrays

## Installing

```javascript
npm install string.ify
```

In your code:

```javascript
stringify = require ('string.ify')
```

## Pretty Printing

```javascript
stringify ({ obj: [{ someLongPropertyName: 1, propertyName: 2, anotherProp: 4, moreProps: 5 },
                   { propertyName: { someVeryLongPropertyName: true, qux: 6, zap: "lol" } }] })
```

Will output:

```
{ obj: [ { someLongPropertyName: 1,
                   propertyName: 2,
                    anotherProp: 4,
                      moreProps: 5  },
         { propertyName: { someVeryLongPropertyName:  true,
                                                qux:  6,
                                                zap: "lol"  } } ] }
```

With `stringify.noRightAlignKeys (obj)` or [`rightAlignKeys: false`](https://github.com/xpl/string.ify#configuring), if you don't want the keys alignment:

```
{ obj: [ { someLongPropertyName: 1,
           propertyName: 2,
           anotherProp: 4,
           moreProps: 5             },
         { propertyName: { someVeryLongPropertyName: true,
                           qux: 6,
                           zap: "lol"                      } } ] }
```

With `stringify.noFancy (obj)` or [`fancy: false`](https://github.com/xpl/string.ify#configuring), if you want classic nesting:

```
{
    obj: [
        {
            someLongPropertyName: 1,
            propertyName: 2,
            anotherProp: 4,
            moreProps: 5
        },
        {
            propertyName: {
                someVeryLongPropertyName: true,
                qux: 6,
                zap: "lol"
            }
        }
    ]
}
```

In the "no fancy" mode you can also set the indentation width by:

```javascript
stringify.configure ({ fancy: false, indentation: '  ' }) (obj) // 2 spaces instead of 4
```
```
{
  obj: [
    {
      propertyName: 2,
      moreProps: 5
    }
  ]
}
```

As you can see, by default it does some fancy alignment to make complex nested objects look more readable:

![GIF Animation](https://user-images.githubusercontent.com/1707/39936518-6163e2dc-5555-11e8-9c40-3abe57371ab4.gif)

It automatically detects whether the pretty printing is nessesary. If the output isn't lenghty, it renders as single line:

```javascript
stringify ({ foo: 1, bar: 2 }) // { foo: 1, bar: 2 }
```

It also works with nested objects. Setting `maxLength` (defaults to `50`):

```javascript
stringify.maxLength (70) ({ asks: [{ price: "1000", amount: 10 }, { price: "2000", amount: 10 }],
                            bids: [{ price: "500", amount: 10 }, { price: "100", amount: 10 }] })
```

Example output for `maxLength` set to `70`, `50` and `20`, respectively):

```
{ asks: [{ price: "1000", amount: 10 }, { price: "2000", amount: 10 }],
  bids: [{ price: "500", amount: 10 }, { price: "100", amount: 10 }]    }
```
```
{ asks: [ { price: "1000", amount: 10 },
          { price: "2000", amount: 10 }  ],
  bids: [ { price: "500", amount: 10 },
          { price: "100", amount: 10 }  ]   }
```
```
{ asks: [ {  price: "1000",
            amount:  10     },
          {  price: "2000",
            amount:  10     }  ],
  bids: [ {  price: "500",
            amount:  10    },
          {  price: "100",
            amount:  10    }  ]   }
```

Forcing single-line rendering by setting `{ pretty: false }` or with `noPretty` chain helper:

```javascript
stringify.noPretty
    ({ nil: null, nope: undefined, fn: function ololo () {}, bar: [{ baz: "garply", qux: [1, 2, 3] }] })
//   { nil: null, nope: undefined, fn: <function:ololo>,     bar: [{ baz: "garply", qux: [1, 2, 3] }] }
```

## Configuring

Configuring goes like this:

```javascript
stringify.configure ({ /* params */ }) (...)
```

You can stack `.configure` calls, as it simply returns a new function instance with config params applied:

```javascript
stringify = require ('string.ify').configure ({ ... }) // configure at import

...

stringify.configure ({ ... }) (obj) // ad-hoc configuration
```

Configuration parameters have chain-style setter methods:

```javascript
stringify.pure.noPretty.maxDepth (10) (...)
```

It's the same as calling `configure` with:

```javascript
stringify.configure ({ pure: true, pretty: false, maxDepth: 10 }) (...)
```

All (default) config options:

```javascript
stringify.configure ({

    pure:            false,
    json:            false,
    maxDepth:        5,
    maxLength:       50,
    maxArrayLength:  60,
    maxObjectLength: 200,
    maxStringLength: 60,
    precision:       undefined,
    formatter:       undefined,
    pretty:         'auto',
    rightAlignKeys:  true,
    fancy:           true,
    indentation:    '    ',
    
}) (...)
```

## Collapsing Lengthy Output

It handles `global` and `window` references, so it wont mess up your output:

```javascript
stringify ({ root: global }) // { root: global }
```

Cyclic references:

```javascript
var obj = {}
    obj.foo = { bar: [obj] }

stringify (obj) // { foo: { bar: [<cyclic>] } }
```

Collapsing multiple references to the same object:

```javascript
var obj = {}

stringify ([obj, obj, obj]) // [{  }, <ref:1>, <ref:1>]
```

It even understands jQuery objects and DOM nodes:

```javascript
$('<button id="send" class="red" /><button class="blue" />']).appendTo (document.body)

stringify ($('button'))                           // "[ <button#send.red>, <button.blue> ]"
stringify (document.createTextNode ('some text')) // "@some text"
```


Setting `maxDepth` (defaults to `5`) and `maxArrayLength` (defaults to `60`):

```javascript
stringify.maxDepth (2).maxArrayLength (5) ({ a: { b: { c: 0 } }, qux: [1,2,3,4,5,6] }),
                                        // { a: { b: <object> }, qux: <array[6]> }
```

Setting `maxObjectLength` (defaults to `200`):

```javascript
stringify.maxObjectLength (6) ({ long: { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 } })
                            // { long: <object[6]> }
```

Setting `maxStringLength` (default is `60`):

```javascript
stringify.maxStringLength (4) ({ yo: 'blablablabla' }) // { yo: "bla…" }
```

Empty argument means no limit:

```javascript
stringify.maxDepth () (...) // will render arbitrarily deep
```

## Other Configuration Options

JSON-compatible output:

```javascript
stringify.json ({ foo: { bar: 'baz' } }) // { "foo": { "bar": "baz" } }
```

JavaScript output:

```javascript
stringify.pure ({ yo: function () { return 123 } }) // { yo: function () { return 123 } }
```

Setting floating-point output precision:

```javascript
stringify               ({ a: 123, b: 123.000001 }) // { a: 123, b: 123.000001 }
stringify.precision (2) ({ a: 123, b: 123.000001 }) // { a: 123, b: 123.00 }
```

## Custom rendering

### With ad-hoc formatter

```javascript
booleansAsYesNo = stringify.formatter (x => (typeof x === 'boolean' ? (x ? 'yes' : 'no') : undefined))
booleansAsYesNo  ({ a: { b: true }, c: false }),
//                { a: { b: yes }, c: no }
```

Return `undefined` to fallback to the default formatter.

### With Symbols

If you don't know what they are, [read this article](http://blog.keithcirkel.co.uk/metaprogramming-in-es6-symbols/). Symbols are awesome! They allow to add hidden properties (i.e. metadata) to arbitrary objects. **String.ify** uses this mechanism to implement custom formatters on rendered objects:

```javascript
Boolean.prototype[Symbol.for ('String.ify')] = function (stringify) {
                                                   return this ? 'yes' : 'no' }

stringify ({ a: { b: true }, c: false })
//        '{ a: { b: yes }, c: no }'
```

Note how a `stringify` is passed as an argument to a renderer function. Call it to render nested contents. Current config options are available as properties of that function. You can override them by calling the `configure` method. Here's an example of adding purple ANSI color to rendered arrays:

```javascript
Array.prototype[Symbol.for ('String.ify')] = function (stringify) {

    return '\u001B[35m[' + this.map (stringify).join (', ') + ']\u001b[0m'
}

stringify ({ a:           [{ foo: 42, bar: 43 }, 44, 45, 46] })
//        '{ a: \u001B[35m[{ foo: 42, bar: 43 }, 44, 45, 46]\u001b[0m }')
```

## Powered by

- [string.bullet](https://github.com/xpl/string.bullet) — a helper for the ASCII data layouting

## Applications

- [Ololog](https://github.com/xpl/ololog) — a platform-agnostic logging powered with _String.ify_
