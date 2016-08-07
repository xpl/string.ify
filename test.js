String.ify = require ('./string.ify')
assert     = require ('assert')

describe ('String.ify', () => {

    it ('is function', () => {

        assert.equal (typeof String.ify,           'function')
        assert.equal (typeof String.ify.configure, 'function')
    })

    it ('configure works', () => {

        assert.equal (String.ify.pretty, 'auto')
        assert.equal (String.ify.configure ({ pretty: true }).pretty, true)
    })

    it ('handles scalars', () => {

       assert.equal (String.ify (undefined),'undefined')
       assert.equal (String.ify (123),      '123')
       assert.equal (String.ify ("foo"),    '"foo"')

    })

    it ('handles complex objects', () => {

        function ololo () {}

        var object =  { yo: global, nil: null, nope: undefined, fn:           ololo,  bar: [{ baz: "garply", qux: [1, 2, 3] }] }
        var string = '{ yo: global, nil: null, nope: undefined, fn: <function:ololo>, bar: [{ baz: "garply", qux: [1, 2, 3] }] }'

        assert.equal (String.ify.oneLine (object), string)
    })

    it ('pretty prints (auto-detect)', () => {

        var src = {  obj: [{ someLongPropertyName: 1, propertyName: 2, propName: 3, anotherProp: 4, moreProps: 5 },
                          { propertyName: { foobarbaz: true, qux: 2, zap: "lol" } }] }

        var dst =
      '{ obj: [ { someLongPropertyName: 1,\n' +
      '                   propertyName: 2,\n' +
      '                       propName: 3,\n' +
      '                    anotherProp: 4,\n' +
      '                      moreProps: 5  },\n' +
      '         { propertyName: { foobarbaz:  true,\n' +
      '                                 qux:  2,\n' +
      '                                 zap: "lol"  } } ] }'

        assert.equal (String.ify (src), dst)

    })

    it ('pretty prints (enforced)', () => {

        var src = {    array: ['foo',
                               'bar',
                               'baz'],
                        more:  'qux',
                    evenMore:   42    }

        var dst = '{    array: [ "foo",\n'    +
                  '              "bar",\n'    +
                  '              "baz"  ],\n' +
                  '      more:   "qux",\n'    +
                  '  evenMore:    42       }'

        assert.equal (String.ify.configure ({ pretty: true }) (src), dst)

    })


    it ('handles cyclic references', () => {

        var obj = {}
            obj.foo = { bar: [obj] }

        assert.equal (String.ify (obj), '{ foo: { bar: [<cyclic>] } }')

    })

    it ('handles references to same object', () => {

        var obj = {}

        assert.equal (String.ify ([obj, obj, obj]), '[{  }, <ref:1>, <ref:1>]')
    })

    it ('can output JSON', () => {

        assert.equal (String.ify.configure ({ json: true }) ({ foo: { bar: 'baz' } }), '{ "foo": { "bar": "baz" } }')

    })

    it ('can output JavaScript', () => {
        
        assert.equal (String.ify.configure ({ pure: true }) ({ yo: function () { return 123 } }),
                                                            '{ yo: function () { return 123 } }')
        
    })

    it ('trims too long strings', () => {
        
        assert.equal (String.ify                                    ({ foo: 'x'.repeat (80) }), '{ foo: "' + 'x'.repeat (59) + '…" }')
        assert.equal (String.ify.configure ({ maxStringLength: 4 }) ({ yo: 'blablablabla' }),   '{ yo: "bla…" }')
    })

    it ('recognizes Set and Map', () => {

        var map = new Map ()
            map.set ('foo', 7)
            map.set ({},    8)

        var set = new Set ()
            set.add ('bar')
            set.add ('qux')
            
        assert.equal (String.ify ({ map: map, set: set }), '{ map: [["foo", 7], [{  }, 8]], set: ["bar", "qux"] }')
        
    })

    it ('allows maxDepth and maxArrayLength', () => {

        assert.equal (String.ify.configure ({ maxDepth: 2, maxArrayLength: 5 })

                                 ({ a: { b: { c: 0 } }, qux: [1,2,3,4,5,6] }),
                                 '{ a: { b: <object> }, qux: <array[6]> }')
    })

    it ('allows toFixed precision', () => {

        assert.equal ('{ a: 123, b: 123.000001 }', String.ify                              ({ a: 123, b: 123.000001 }))
        assert.equal ('{ a: 123, b: 123.00 }',     String.ify.configure ({ precision: 2 }) ({ a: 123, b: 123.000001 }))
    })

    it ('allows custom formatter', () => {

        var booleansAsYesNo = String.ify.configure ({ formatter: (x => (typeof x === 'boolean' ? (x ? 'yes' : 'no') : undefined)) })

        assert.equal (booleansAsYesNo  ({ a: { b: true }, c: false }),
                                       '{ a: { b: yes }, c: no }')

    })

    it ('allows setting custom formatter via special Symbol', () => {

        Boolean.prototype[Symbol.for ('String.ify')] = function (stringify) {
            assert.equal (stringify.passingConfigParams, 42)
            return this ? 'yes' : 'no'
        }

        assert.equal (String.ify.configure ({ passingConfigParams: 42 }) ({ a: true }), '{ a: yes }')

        Array.prototype[Symbol.for ('String.ify')] = function (stringify) {

            return '\u001B[35m[' + this.map (x => stringify (x)).join (', ') + ']\u001b[0m'
        }

        assert.equal (String.ify ({ a: [{ foo: 42, bar: 43 }, 44, 45, 46] }),
                                 '{ a: \u001B[35m[{ foo: 42, bar: 43 }, 44, 45, 46]\u001b[0m }')

    })

    it ('exposes some re-usable internals', () => {

        assert.equal (String.ify.limit ('1234567', 5), '1234…')

    })
})



