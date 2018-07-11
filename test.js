"use strict";

const stringify = require (process.env.STRING_IFY_TEST_FILE)
const assert    = require ('assert')

describe ('String.ify', () => {

    it ('is function', () => {

        assert.equal (typeof stringify,           'function')
        assert.equal (typeof stringify.configure, 'function')
    })

    it ('configure works', () => {

        assert.equal (stringify.configure ({ something: 42 }).state.something, 42)
    })

    it ('handles scalars', () => {

        assert.equal (stringify (undefined),'undefined')
        assert.equal (stringify (123),      '123')
        assert.equal (stringify ("foo"),    '"foo"')
    })

    it ('handles complex objects', () => {

        function ololo () {}

        var object =  { yo: global, nil: null, nope: undefined, fn:           ololo,  bar: [{ baz: "garply", qux: [1, 2, 3] }] }
        var string = '{ yo: global, nil: null, nope: undefined, fn: <function:ololo>, bar: [{ baz: "garply", qux: [1, 2, 3] }] }'

        assert.equal (stringify.noPretty (object), string)
    })

    it ('handles Date objects', () => {

        const date = new Date (1488500526560)

        assert (stringify ({ foo: date }).indexOf ('{ foo: 📅  ') === 0)

        assert.equal (stringify.pure ({ foo: date }), '{ foo: 1488500526560 }')
    })

    it ('pretty prints', () => {

        var src = {  obj: [{ someLongPropertyName: 1, propertyName: 2, propName: 3, anotherProp: 4, moreProps: 5 },
                          { propertyName: { foobarbaz: true, qux: 2, zap: "lol" } }] }

        var pretty =
      '{ obj: [ { someLongPropertyName: 1,\n' +
      '                   propertyName: 2,\n' +
      '                       propName: 3,\n' +
      '                    anotherProp: 4,\n' +
      '                      moreProps: 5  },\n' +
      '         { propertyName: { foobarbaz: true, qux: 2, zap: "lol" } } ] }'

        var noPretty = '{ obj: [{ someLongPropertyName: 1, propertyName: 2, propName: 3, anotherProp: 4, moreProps: 5 }, { propertyName: { foobarbaz: true, qux: 2, zap: "lol" } }] }'

        assert.equal (stringify (src), pretty) // auto-detect
        assert.equal (stringify.pretty (src), pretty) // enforced
        assert.equal (stringify.noPretty (src), noPretty) // disabled
    })

    it ('handles cyclic references', () => {

        var obj = {}
            obj.foo = { bar: [obj] }

        assert.equal (stringify (obj), '{ foo: { bar: [<cyclic>] } }')
    })

    it ('handles references to same object', () => {

        var obj = {}

        assert.equal (stringify ([obj, obj, obj]), '[{  }, <ref:1>, <ref:1>]')

    /*  there was a bug here...    */

        assert.equal (stringify.pretty (obj), '{  }')
        assert.equal (stringify.pretty (obj), '{  }') // was outputting <ref:6> due to unexpected state sharing

    /*  should be turned off in pure mode   */

        assert.equal (stringify.pure ([obj, obj]), '[{  }, {  }]')
    })

    it ('can output JSON', () => {

        assert.equal (stringify.json ({ foo: { bar: 'baz' } }), '{ "foo": { "bar": "baz" } }')

        assert.equal (stringify.json ({ foo: 'a'.repeat (100) }), `{ "foo": "${'a'.repeat (100)}" }`) // there was a bug (JSON implies pure mode)
    })

    it ('can output JavaScript', () => {
        
        assert.equal (stringify.pure ({ yo: function () { return 123 } }),
                                     '{ yo: function () { return 123 } }')
        
    })

    it ('trims too long strings', () => {
        
        assert.equal (stringify                     ({ foo: 'a'.repeat (80) }), `{ foo: "${'a'.repeat (59)}…" }`)
        assert.equal (stringify.maxStringLength ()  ({ foo: 'b'.repeat (80) }), `{ foo: "${'b'.repeat (80)}" }`)
        assert.equal (stringify.maxStringLength (4) ({ yo: 'blablablabla' }),   '{ yo: "bla…" }')
    })

    it ('recognizes Set and Map', () => {

        var map = new Map ()
            map.set ('foo', 7)
            map.set ({},    8)

        var set = new Set ()
            set.add ('bar')
            set.add ('qux')
            
        assert.equal (stringify.noPretty ({ map: map, set: set }), '{ map: [["foo", 7], [{  }, 8]], set: ["bar", "qux"] }')
        
    })

    it ('allows maxDepth and maxArrayLength', () => {

        assert.equal (stringify.maxDepth (2) ({ a: { b: { c: { d: {} } } } }), '{ a: { b: <object[1]> } }')
        assert.equal (stringify.maxDepth ()  ({ a: { b: { c: { d: {} } } } }), '{ a: { b: { c: { d: {  } } } } }')

        assert.equal (stringify.noPretty.maxArrayLength (5) ({ long: [...'a'.repeat (100)] }), '{ long: <array[100]> }')
        assert.equal (stringify.noPretty.maxArrayLength ()  ({ long: [...'a'.repeat (100)] }), '{ long: [' + '"a", '.repeat (99) + '"a"] }')
    })

    it ('maxObjectLength works', () => {

        const bigObject = {}
        const bigObjectKeys = []
        for (let i = 0; i < 6; i++) {
            bigObject[i] = i
            bigObjectKeys.push ("'" + i + "': " + i)
        }
        const bigObjectStr = '{ ' + bigObjectKeys.join (', ') + ' }'

        assert.equal (stringify.noPretty.maxObjectLength (5) ({ long: bigObject }), '{ long: <object[6]> }')
        assert.equal (stringify.noPretty.maxObjectLength ()  ({ long: bigObject }), '{ long: ' + bigObjectStr + ' }')
    })

    it ('allows toFixed precision', () => {

        assert.equal ('{ a: 123, b: 123.000001 }', stringify               ({ a: 123, b: 123.000001 }))
        assert.equal ('{ a: 123, b: 123.00 }',     stringify.precision (2) ({ a: 123, b: 123.000001 }))
        assert.equal ('{ a: 123, b: 123.00, c: undefined, d: null }', stringify.precision (2) ({ a: 123, b: 123.000001, c: undefined, d: null })) // regression test
    })

    it ('allows custom formatter', () => {

        var booleansAsYesNo = stringify.formatter (x => (typeof x === 'boolean' ? (x ? 'yes' : 'no') : undefined))

        assert.equal (booleansAsYesNo  ({ a: true, b: false }),
                                       '{ a: yes, b: no }')

    })

    it ('allows setting custom formatter via special Symbol', () => {

        Array.prototype[Symbol.for ('String.ify')] = function (stringify) {

            return '\u001B[35m[' + this.map (x => stringify.noPretty (x)).join (', ') + ']\u001b[0m'
        }

        assert.equal (stringify ({ a: [{ foo: 42, bar: 43 }, 44, 45, 46] }),
                                 '{ a: \u001B[35m[{ foo: 42, bar: 43 }, 44, 45, 46]\u001b[0m }')

        delete Array.prototype[Symbol.for ('String.ify')]
    })

    it ('passes config params to custom formatters', () => {

        Boolean.prototype[Symbol.for ('String.ify')] = function (stringify) {

            assert.equal (stringify.state.passingConfigParams, 42)

            return this ? 'yes' : 'no'
        }

        assert.equal (stringify.configure ({ passingConfigParams: 42 }) ({ a: true }), '{ a: yes }')

        delete Boolean.prototype[Symbol.for ('String.ify')]
    })

    it ('limit() works', () => {

        assert.equal (stringify.limit ('1234567', 5), '1234…')
        assert.equal (stringify.limit ('\u001b[43m\u001b[36m' + '1234567' + '\u001b[39m\u001b[49m', 5), '\u001b[43m\u001b[36m' + '1234' + '\u001b[39m\u001b[49m' + '…')
    })

    it ('understands typed arrays', () => {

        for (const TypedArray of [Float64Array, Float32Array, Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Int32Array, Uint32Array]) {

            assert.equal (stringify (new TypedArray ([1, 2, 3])), '[1, 2, 3]')
        }
    })

    it ('escapes strings when nessesary', () => {

        assert.equal (stringify.pure ({ 'foo bar':  'foo bar' }),  "{ 'foo bar': \"foo bar\" }")
        assert.equal (stringify ({ 'foo-bar':  'foo-bar' }),  "{ 'foo-bar': \"foo-bar\" }")
        assert.equal (stringify ({ 'foo\nbar': 'foo\nbar' }), "{ 'foo\\nbar': \"foo\\nbar\" }")
        assert.equal (stringify ({ 'foo\'bar': 'foo\'bar' }), "{ 'foo\\'bar': \"foo\\'bar\" }")

    })

    it ('maxLength works', () => {

        const obj = {
            asks: [{ price: "1000", amount: 10 }, { price: "2000", amount: 10 }],
            bids: [{ price: "500", amount: 10 }, { price: "100", amount: 10 }]
        }

        const $0 = '{ asks: [{ price: "1000", amount: 10 }, { price: "2000", amount: 10 }], bids: [{ price: "500", amount: 10 }, { price: "100", amount: 10 }] }'

        const $1 = '{ asks: [{ price: "1000", amount: 10 }, { price: "2000", amount: 10 }],\n' +
                   '  bids: [{ price: "500", amount: 10 }, { price: "100", amount: 10 }]    }'

        const $2 = [  '{ asks: [ { price: "1000", amount: 10 },'
                    , '          { price: "2000", amount: 10 }  ],'
                    , '  bids: [ { price: "500", amount: 10 },'
                    , '          { price: "100", amount: 10 }  ]   }'
                    ].join ('\n')

        const $3 = '{ asks: [ {  price: "1000",'        + '\n' +
                   '            amount:  10     },'     + '\n' +
                   '          {  price: "2000",'        + '\n' +
                   '            amount:  10     }  ],'  + '\n' +
                   '  bids: [ {  price: "500",'         + '\n' +
                   '            amount:  10    },'      + '\n' +
                   '          {  price: "100",'         + '\n' +
                   '            amount:  10    }  ]   }'
                                               
        assert.equal (stringify.maxLength () (obj),   $0)
        assert.equal (stringify.maxLength (70) (obj), $1)
        assert.equal (stringify.maxLength (50) (obj), $2)
        assert.equal (stringify.maxLength (20) (obj), $3)        
    })


    it ('renders RegExps', () => {

        assert.equal (stringify      ({ foo: new RegExp (/foo/g) }), '{ foo: /foo/g }')
        assert.equal (stringify.json ({ foo: new RegExp (/foo/g) }), '{ "foo": "/foo/g" }')
    })
})



